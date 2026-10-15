import { pool } from './db';

export interface DailySales {
  day: string;
  orders: number;
  sales: number;
}

export async function dailySales(): Promise<DailySales[]> {
  const { rows } = await pool.query(
    `SELECT to_char((created_at AT TIME ZONE 'Asia/Tokyo')::date, 'YYYY-MM-DD') AS day,
            count(*) AS orders,
            sum(amount) AS sales
       FROM orders
      WHERE status = 'paid'
        AND created_at >= now() - interval '14 days'
      GROUP BY 1
      ORDER BY 1 DESC`,
  );
  return rows.map((r) => ({ day: r.day, orders: Number(r.orders), sales: Number(r.sales) }));
}
