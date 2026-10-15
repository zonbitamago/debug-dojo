import { useState, type FormEvent } from 'react';
import { api, jst, yen, type Order } from '../api';

export default function OrderSearch({ userId }: { userId: number }) {
  const [number, setNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearching(true);
    setOrder(null);
    setError(null);
    try {
      setOrder(await api.searchOrder(userId, number));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <section>
      <h2>注文検索(問い合わせ対応用)</h2>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="注文番号(例: ORD-10000123)"
        />
        <button className="primary" type="submit" disabled={searching || !number}>
          {searching ? '検索中…' : '検索'}
        </button>
      </form>
      {error && <p className="message error">{error}</p>}
      {order && (
        <dl className="detail">
          <dt>注文番号</dt><dd>{order.orderNumber}</dd>
          <dt>注文者</dt><dd>{order.userName}</dd>
          <dt>注文日時</dt><dd>{jst(order.createdAt)}</dd>
          <dt>商品</dt><dd>{order.productName} × {order.quantity}</dd>
          <dt>金額</dt><dd>{yen(order.amount)}</dd>
          <dt>状態</dt><dd>{order.status}</dd>
        </dl>
      )}
    </section>
  );
}
