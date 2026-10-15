## 技術スタック

- フロントエンド:React + TypeScript(Vite)
- バックエンド:Java 21 + Spring Boot 3(`backend/src/main/java/`)
- DB:PostgreSQL 16

`frontend/src/` はコンテナにマウントされているため、保存すると自動で反映されます。バックエンドのコードを変更した場合は、`docker compose up -d --build backend` で再ビルドしてください。
