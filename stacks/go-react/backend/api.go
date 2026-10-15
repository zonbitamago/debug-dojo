package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type api struct {
	pool   *pgxpool.Pool
	orders *orderService
}

type product struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Price int    `json:"price"`
	Stock int    `json:"stock"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func serverError(w http.ResponseWriter, err error) {
	log.Printf("error: %v", err)
	writeJSON(w, http.StatusInternalServerError, errorResponse{"サーバーエラーが発生しました"})
}

func currentUserID(r *http.Request) int64 {
	id, err := strconv.ParseInt(r.Header.Get("X-User-Id"), 10, 64)
	if err != nil {
		return 1
	}
	return id
}

func (a *api) listProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := a.pool.Query(r.Context(), `SELECT id, name, price, stock FROM products ORDER BY id`)
	if err != nil {
		serverError(w, err)
		return
	}
	defer rows.Close()

	products := []product{}
	for rows.Next() {
		var p product
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.Stock); err != nil {
			serverError(w, err)
			return
		}
		products = append(products, p)
	}
	if err := rows.Err(); err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, products)
}

func (a *api) createOrder(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductID *int64 `json:"productId"`
		Quantity  *int   `json:"quantity"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.ProductID == nil || req.Quantity == nil || *req.Quantity < 1 || *req.Quantity > 5 {
		writeJSON(w, http.StatusBadRequest, errorResponse{"入力内容が正しくありません"})
		return
	}

	order, err := a.orders.createOrder(r.Context(), currentUserID(r), *req.ProductID, *req.Quantity)
	var oe *orderError
	if errors.As(err, &oe) {
		writeJSON(w, oe.status, errorResponse{oe.message})
		return
	}
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, order)
}

func (a *api) listOrders(w http.ResponseWriter, r *http.Request) {
	orders, err := findOrdersByUser(r.Context(), a.pool, currentUserID(r))
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, orders)
}

func (a *api) searchOrder(w http.ResponseWriter, r *http.Request) {
	order, err := findOrderByNumber(r.Context(), a.pool, strings.TrimSpace(r.URL.Query().Get("number")))
	if err != nil {
		serverError(w, err)
		return
	}
	if order == nil {
		writeJSON(w, http.StatusNotFound, errorResponse{"注文が見つかりません"})
		return
	}
	writeJSON(w, http.StatusOK, order)
}

func (a *api) dailySales(w http.ResponseWriter, r *http.Request) {
	sales, err := findDailySales(r.Context(), a.pool)
	if err != nil {
		serverError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, sales)
}
