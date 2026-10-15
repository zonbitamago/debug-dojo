import { useEffect, useState } from 'react';
import { api, yen, type DailySales } from '../api';

export default function SalesReport({ userId }: { userId: number }) {
  const [rows, setRows] = useState<DailySales[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDailySales(userId)
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, [userId]);

  return (
    <section>
      <h2>日別売上(直近14日・日本時間)</h2>
      {error && <p className="message error">{error}</p>}
      {!rows && !error && <p className="muted">読み込み中…</p>}
      {rows && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th className="num">注文件数</th>
                <th className="num">売上</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day}>
                  <td>{r.day}</td>
                  <td className="num">{r.orders.toLocaleString('ja-JP')}</td>
                  <td className="num">{yen(r.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
