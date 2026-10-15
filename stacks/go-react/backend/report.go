package main

import "context"

type dailySales struct {
	Day    string `json:"day"`
	Orders int64  `json:"orders"`
	Sales  int64  `json:"sales"`
}

func findDailySales(ctx context.Context, db dbtx) ([]dailySales, error) {
	rows, err := db.Query(ctx, `
		SELECT to_char((created_at AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS day,
		       count(*) AS orders,
		       sum(amount) AS sales
		  FROM orders
		 WHERE status = 'paid'
		   AND created_at >= now() - interval '14 days'
		 GROUP BY 1
		 ORDER BY 1 DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	sales := []dailySales{}
	for rows.Next() {
		var s dailySales
		if err := rows.Scan(&s.Day, &s.Orders, &s.Sales); err != nil {
			return nil, err
		}
		sales = append(sales, s)
	}
	return sales, rows.Err()
}
