import { pool } from './db';
import { reserveStock } from './inventory';
import { charge } from './paymentClient';

export type CreateOrderResult =
  | { ok: true; order: { id: number; orderNumber: string; amount: number } }
  | { ok: false; status: number; error: string };

export async function createOrder(
  userId: number,
  productId: number,
  quantity: number,
): Promise<CreateOrderResult> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const product = await reserveStock(client, productId, quantity);
    if (!product) {
      await client.query('ROLLBACK');
      return { ok: false, status: 409, error: '在庫が不足しています' };
    }

    const amount = product.price * quantity;
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, product_id, quantity, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_number`,
      [userId, productId, quantity, amount],
    );
    const order = rows[0] as { id: number; order_number: string };

    const payment = await charge(order.order_number, amount);
    if (!payment.ok) {
      await client.query('ROLLBACK');
      return { ok: false, status: 402, error: payment.message };
    }

    await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [order.id]);
    await client.query('COMMIT');
    return { ok: true, order: { id: Number(order.id), orderNumber: order.order_number, amount } };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
