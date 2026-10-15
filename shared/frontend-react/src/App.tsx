import { useState } from 'react';
import ShopPage from './components/ShopPage';
import OrderHistory from './components/OrderHistory';
import OrderSearch from './components/OrderSearch';
import SalesReport from './components/SalesReport';

const USERS = [
  { id: 1, name: '田中 一郎' },
  { id: 2, name: '佐藤 花子' },
];

const TABS = [
  { key: 'shop', label: '商品・注文' },
  { key: 'history', label: '注文履歴' },
  { key: 'search', label: '注文検索(CS用)' },
  { key: 'report', label: '日別売上' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function App() {
  const [userId, setUserId] = useState(1);
  const [tab, setTab] = useState<TabKey>('shop');

  return (
    <div className="app">
      <header className="app-header">
        <h1>練習用ECショップ</h1>
        <label className="user-switcher">
          ログイン中のユーザー
          <select value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'shop' && <ShopPage userId={userId} />}
        {tab === 'history' && <OrderHistory userId={userId} />}
        {tab === 'search' && <OrderSearch userId={userId} />}
        {tab === 'report' && <SalesReport userId={userId} />}
      </main>
    </div>
  );
}
