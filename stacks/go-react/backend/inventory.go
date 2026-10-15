package main

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
)

type reservedProduct struct {
	ID    int64
	Name  string
	Price int
}

// 在庫が足りないときは nil を返す
func reserveStock(ctx context.Context, db dbtx, productID int64, quantity int) (*reservedProduct, error) {
	var p reservedProduct
	err := db.QueryRow(ctx, `
		UPDATE products
		   SET stock = stock - $2
		 WHERE id = $1
		   AND stock >= $2
		RETURNING id, name, price`,
		productID, quantity).Scan(&p.ID, &p.Name, &p.Price)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}
