package main

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
)

type orderView struct {
	ID          int64     `json:"id"`
	OrderNumber string    `json:"orderNumber"`
	ProductName string    `json:"productName"`
	Quantity    int       `json:"quantity"`
	Amount      int       `json:"amount"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UserName    string    `json:"userName,omitempty"`
}

func findOrdersByUser(ctx context.Context, db dbtx, userID int64) ([]orderView, error) {
	rows, err := db.Query(ctx, `
		SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
		       p.name AS product_name
		  FROM orders o
		  JOIN products p ON p.id = o.product_id
		 WHERE o.user_id = $1
		 ORDER BY o.created_at DESC`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := []orderView{}
	for rows.Next() {
		var o orderView
		if err := rows.Scan(&o.ID, &o.OrderNumber, &o.Quantity, &o.Amount, &o.Status, &o.CreatedAt, &o.ProductName); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, rows.Err()
}

func findOrderByNumber(ctx context.Context, db dbtx, orderNumber string) (*orderView, error) {
	var o orderView
	err := db.QueryRow(ctx, `
		SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
		       p.name AS product_name, u.name AS user_name
		  FROM orders o
		  JOIN products p ON p.id = o.product_id
		  JOIN users u ON u.id = o.user_id
		 WHERE o.order_number = $1`,
		orderNumber).Scan(&o.ID, &o.OrderNumber, &o.Quantity, &o.Amount, &o.Status, &o.CreatedAt, &o.ProductName, &o.UserName)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}
