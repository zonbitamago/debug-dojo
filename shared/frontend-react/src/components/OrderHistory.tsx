import { useEffect, useState } from 'react';
import { api, jst, yen, type Order } from '../api';

export default function OrderHistory({ userId }: { userId: number }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrders(null);
    setError(null);
    api
      .getOrders(userId)
      .then(setOrders)
      .catch((e: Error) => setError(e.message));
  }, [userId]);

  return (
    <section>
      <h2>注文履歴</h2>
      {error && <p className="message error">{error}</p>}
      {!orders && !error && <p className="muted">読み込み中…</p>}
      {orders && (
        <>
          <p className="muted">{orders.length}件</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>注文番号</th>
                  <th>注文日時</th>
                  <th>商品</th>
                  <th className="num">数量</th>
                  <th className="num">金額</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{jst(o.createdAt)}</td>
                    <td>{o.productName}</td>
                    <td className="num">{o.quantity}</td>
                    <td className="num">{yen(o.amount)}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
