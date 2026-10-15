import express, { type NextFunction, type Request, type Response } from 'express';
import { pool } from './db';
import { createOrder } from './orderService';
import { findOrderByNumber, findOrdersByUser } from './orderRepository';
import { dailySales } from './report';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const started = performance.now();
  res.on('finish', () => {
    const ms = Math.round(performance.now() - started);
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
  fn(req, res).catch(next);

const currentUserId = (req: Request) => Number(req.header('X-User-Id') ?? 1);

app.get('/api/products', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name, price, stock FROM products ORDER BY id');
  res.json(rows.map((r) => ({ ...r, id: Number(r.id) })));
}));

app.post('/api/orders', wrap(async (req, res) => {
  const productId = Number(req.body?.productId);
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
    return res.status(400).json({ error: '入力内容が正しくありません' });
  }
  const result = await createOrder(currentUserId(req), productId, quantity);
  if (!result.ok) return res.status(result.status).json({ error: result.error });
  res.status(201).json(result.order);
}));

app.get('/api/orders', wrap(async (req, res) => {
  res.json(await findOrdersByUser(currentUserId(req)));
}));

app.get('/api/orders/search', wrap(async (req, res) => {
  const order = await findOrderByNumber(String(req.query.number ?? '').trim());
  if (!order) return res.status(404).json({ error: '注文が見つかりません' });
  res.json(order);
}));

app.get('/api/reports/daily-sales', wrap(async (_req, res) => {
  res.json(await dailySales());
}));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'サーバーエラーが発生しました' });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`backend listening on ${port}`));
