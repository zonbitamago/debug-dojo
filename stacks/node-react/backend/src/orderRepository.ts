import { pool } from './db';

export interface OrderView {
  id: number;
  orderNumber: string;
  productName: string;
  quantity: number;
  amount: number;
  status: string;
  createdAt: string;
  userName?: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  amount: number;
  status: string;
  created_at: Date;
  user_name?: string;
}

function toView(row: OrderRow): OrderView {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    productName: row.product_name,
    quantity: row.quantity,
    amount: row.amount,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    ...(row.user_name ? { userName: row.user_name } : {}),
  };
}

export async function findOrdersByUser(userId: number): Promise<OrderView[]> {
  const { rows } = await pool.query(
    `SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
            p.name AS product_name
       FROM orders o
       JOIN products p ON p.id = o.product_id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC`,
    [userId],
  );
  return rows.map(toView);
}

export async function findOrderByNumber(orderNumber: string): Promise<OrderView | null> {
  const { rows } = await pool.query(
    `SELECT o.id, o.order_number, o.quantity, o.amount, o.status, o.created_at,
            p.name AS product_name, u.name AS user_name
       FROM orders o
       JOIN products p ON p.id = o.product_id
       JOIN users u ON u.id = o.user_id
      WHERE o.order_number = $1`,
    [orderNumber],
  );
  return rows[0] ? toView(rows[0]) : null;
}
