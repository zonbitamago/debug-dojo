import { useEffect, useState } from 'react';
import { api, yen, type Product } from '../api';
import OrderForm from './OrderForm';

export default function ShopPage({ userId }: { userId: number }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api
      .getProducts(userId)
      .then(setProducts)
      .catch((e: Error) => setError(e.message));
  }, [userId, refreshKey]);

  return (
    <section>
      <h2>商品一覧</h2>
      {error && <p className="message error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>商品名</th>
              <th className="num">価格</th>
              <th className="num">在庫</th>
              <th>注文</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="num">{yen(p.price)}</td>
                <td className="num">{p.stock}</td>
                <td>
                  <OrderForm
                    userId={userId}
                    product={p}
                    onOrdered={() => setRefreshKey((k) => k + 1)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
