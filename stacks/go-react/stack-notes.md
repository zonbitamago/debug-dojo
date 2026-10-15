## 技術スタック

- フロントエンド:React + TypeScript(Vite)
- バックエンド:Go + net/http + pgx(`backend/`)
- DB:PostgreSQL 16

`frontend/src/` はコンテナにマウントされているため、保存すると自動で反映されます。バックエンドのコードを変更した場合は、`docker compose up -d --build backend` で再ビルドしてください。
