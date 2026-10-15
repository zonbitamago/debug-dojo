package main

import (
	"context"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type orderService struct {
	pool    *pgxpool.Pool
	payment *paymentClient
}

type createdOrder struct {
	ID          int64  `json:"id"`
	OrderNumber string `json:"orderNumber"`
	Amount      int    `json:"amount"`
}

type orderError struct {
	status  int
	message string
}

func (e *orderError) Error() string { return e.message }

func (s *orderService) createOrder(ctx context.Context, userID, productID int64, quantity int) (*createdOrder, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	product, err := reserveStock(ctx, tx, productID, quantity)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, &orderError{http.StatusConflict, "在庫が不足しています"}
	}

	order := createdOrder{Amount: product.Price * quantity}
	err = tx.QueryRow(ctx, `
		INSERT INTO orders (user_id, product_id, quantity, amount)
		VALUES ($1, $2, $3, $4)
		RETURNING id, order_number`,
		userID, productID, quantity, order.Amount).Scan(&order.ID, &order.OrderNumber)
	if err != nil {
		return nil, err
	}

	payment := s.payment.charge(ctx, order.OrderNumber, order.Amount)
	if !payment.ok {
		return nil, &orderError{http.StatusPaymentRequired, payment.message}
	}

	if _, err := tx.Exec(ctx, `UPDATE orders SET status = 'paid' WHERE id = $1`, order.ID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &order, nil
}
