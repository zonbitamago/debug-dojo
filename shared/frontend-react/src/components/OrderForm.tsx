import { useState } from 'react';
import { api, yen, type Product } from '../api';

interface Props {
  userId: number;
  product: Product;
  onOrdered: () => void;
}

export default function OrderForm({ userId, product, onOrdered }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleOrder() {
    if (submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const order = await api.createOrder(userId, product.id, quantity);
      setMessage({ type: 'success', text: `注文が完了しました(${order.orderNumber} / ${yen(order.amount)})` });
      onOrdered();
    } catch (e) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="order-form">
      <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}個
          </option>
        ))}
      </select>
      <button className="primary" onClick={handleOrder} disabled={submitting}>
        {submitting ? '処理中…' : '注文を確定する'}
      </button>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </div>
  );
}
