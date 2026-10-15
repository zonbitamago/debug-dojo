package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type dbtx interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func newPool(ctx context.Context, url string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		return nil, err
	}
	cfg.MaxConns = 10
	// LOG_SQL=1 のとき、実行したSQLをログに出す
	if os.Getenv("LOG_SQL") == "1" {
		cfg.ConnConfig.Tracer = sqlLogger{}
	}
	return pgxpool.NewWithConfig(ctx, cfg)
}

type sqlLogger struct{}

func (sqlLogger) TraceQueryStart(ctx context.Context, _ *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	log.Printf("[sql] %s %v", strings.Join(strings.Fields(data.SQL), " "), data.Args)
	return ctx
}

func (sqlLogger) TraceQueryEnd(context.Context, *pgx.Conn, pgx.TraceQueryEndData) {}
