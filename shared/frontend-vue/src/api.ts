export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  productName: string;
  quantity: number;
  amount: number;
  status: string;
  createdAt: string;
  userName?: string;
}

export interface DailySales {
  day: string;
  orders: number;
  sales: number;
}

async function request<T>(userId: number, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-User-Id': String(userId), ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `エラーが発生しました(${res.status})`);
  return body as T;
}

export const api = {
  getProducts: (userId: number) => request<Product[]>(userId, '/api/products'),
  createOrder: (userId: number, productId: number, quantity: number) =>
    request<{ orderNumber: string; amount: number }>(userId, '/api/orders', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  getOrders: (userId: number) => request<Order[]>(userId, '/api/orders'),
  searchOrder: (userId: number, number: string) =>
    request<Order>(userId, `/api/orders/search?number=${encodeURIComponent(number)}`),
  getDailySales: (userId: number) => request<DailySales[]>(userId, '/api/reports/daily-sales'),
};

export const yen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
export const jst = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
