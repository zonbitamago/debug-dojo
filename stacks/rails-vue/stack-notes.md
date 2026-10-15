## 技術スタック

- フロントエンド:Vue 3 + TypeScript(Vite)
- バックエンド:Ruby on Rails 7.2(API モード、`backend/app/`)
- DB:PostgreSQL 16

`backend/app/`、`backend/config/`、`frontend/src/` はコンテナにマウントされています。`app/` 以下の変更は自動で反映されます。`config/` を変更した場合は `docker compose restart backend` で再起動してください。
