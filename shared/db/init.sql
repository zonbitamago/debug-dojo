-- 練習用ECショップ スキーマと初期データ
-- 初回起動時に数百万件の注文データを投入するため、起動まで数分かかります。

SET client_min_messages = warning;

CREATE TABLE users (
  id    bigint PRIMARY KEY,
  name  text   NOT NULL,
  email text   NOT NULL UNIQUE
);

CREATE TABLE products (
  id    bigint  PRIMARY KEY,
  name  text    NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL CHECK (stock >= 0)
);

CREATE SEQUENCE order_number_seq START 10000001;

CREATE TABLE orders (
  id           bigserial   PRIMARY KEY,
  order_number text        NOT NULL DEFAULT ('ORD-' || nextval('order_number_seq')),
  user_id      bigint      NOT NULL REFERENCES users (id),
  product_id   bigint      NOT NULL REFERENCES products (id),
  quantity     integer     NOT NULL CHECK (quantity > 0),
  amount       integer     NOT NULL,
  status       text        NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ユーザー
INSERT INTO users (id, name, email) VALUES
  (1, '田中 一郎', 'tanaka@example.com'),
  (2, '佐藤 花子', 'sato@example.com');

INSERT INTO users (id, name, email)
SELECT g, 'ユーザー' || g, 'user' || g || '@example.com'
FROM generate_series(3, 1000) AS g;

-- 商品
INSERT INTO products (id, name, price, stock) VALUES
  (1, 'ステンレスボトル',           2980,  500),
  (2, 'ワイヤレスイヤホン',        12800,  300),
  (3, 'リュックサック',             8900,  200),
  (4, 'コーヒー豆 定期便',          1980, 1000),
  (5, 'デスクライト',               6480,  150),
  (6, 'ノートPCスタンド',           4200,  400),
  (7, 'ロボット掃除機',            39800,   80),
  (8, '【数量限定】記念モデル腕時計', 24000,  10);

-- 過去90日分の注文(一般ユーザー)
INSERT INTO orders (user_id, product_id, quantity, amount, status, created_at)
SELECT s.user_id, s.product_id, s.quantity, s.quantity * p.price, 'paid', s.created_at
FROM (
  SELECT 3 + floor(random() * 998)::int        AS user_id,
         1 + floor(random() * 7)::int          AS product_id,
         1 + floor(random() * 2)::int          AS quantity,
         now() - random() * interval '90 days' AS created_at
  FROM generate_series(1, 3000000)
) AS s
JOIN products p ON p.id = s.product_id;

-- 佐藤さんの注文(長年の常連客)
INSERT INTO orders (user_id, product_id, quantity, amount, status, created_at)
SELECT 2, p.id, 1, p.price, 'paid', now() - g * interval '14 hours'
FROM generate_series(1, 1200) AS g
JOIN products p ON p.id = 1 + (g % 7);

-- 田中さんの注文
INSERT INTO orders (user_id, product_id, quantity, amount, status, created_at)
SELECT 1, p.id, 1, p.price, 'paid', now() - g * interval '9 days'
FROM generate_series(1, 5) AS g
JOIN products p ON p.id = g;

-- インデックス
CREATE INDEX idx_orders_user_id_created_at ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_order_number ON orders (order_number);

ANALYZE users, products, orders;
