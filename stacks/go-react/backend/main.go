package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	pool, err := newPool(context.Background(), env("DATABASE_URL", "postgres://app:app@localhost:5432/shop"))
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	timeoutMS, err := strconv.Atoi(env("PAYMENT_TIMEOUT_MS", "1000"))
	if err != nil {
		log.Fatal(err)
	}
	payment := newPaymentClient(env("PAYMENT_URL", "http://localhost:4010"), time.Duration(timeoutMS)*time.Millisecond)
	a := &api{pool: pool, orders: &orderService{pool: pool, payment: payment}}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/products", a.listProducts)
	mux.HandleFunc("POST /api/orders", a.createOrder)
	mux.HandleFunc("GET /api/orders", a.listOrders)
	mux.HandleFunc("GET /api/orders/search", a.searchOrder)
	mux.HandleFunc("GET /api/reports/daily-sales", a.dailySales)

	port := env("PORT", "8080")
	log.Printf("backend listening on %s", port)
	log.Fatal(http.ListenAndServe(":"+port, logRequests(mux)))
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		log.Printf("%s %s %d %dms", r.Method, r.URL.RequestURI(), rec.status, time.Since(started).Milliseconds())
	})
}
