
## 調査に使える手段

ログを見る

```bash
docker compose logs -f backend
docker compose logs -f payment-mock
```

実行されたSQLをログに出す:`docker-compose.yml` の `backend` の `LOG_SQL` を `"1"` にして、`docker compose up -d backend` で再起動します。

DBに直接つなぐ

```bash
docker compose exec db psql -U app shop
```

`EXPLAIN ANALYZE` でクエリの実行計画を確認することもできます。

APIを直接呼ぶ

```bash
curl -s http://localhost:8080/api/orders -H 'X-User-Id: 2' | head -c 300
curl -s -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' -H 'X-User-Id: 1' \
  -d '{"productId": 1, "quantity": 1}'
```

## データを初期状態に戻す

```bash
docker compose down -v
docker compose up --build
```

`-v` を付けるとDBのデータが削除され、次回起動時に初期データが再投入されます。`db/init.sql` を変更した場合も、この手順で反映してください。
