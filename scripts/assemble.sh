#!/usr/bin/env bash
# 正解版(バグなし)のアプリ一式を、指定したスタックで組み立てる
#   使い方: scripts/assemble.sh <stack> <出力先ディレクトリ>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

stack="${1:-}"; out="${2:-}"
if [ -z "$stack" ] || [ -z "$out" ]; then
  echo "使い方: $0 <node-react|rails-vue|java-react|go-react> <出力先>" >&2
  exit 1
fi
case "$stack" in
  node-react|java-react|go-react) frontend=frontend-react ;;
  rails-vue)             frontend=frontend-vue ;;
  *) echo "未対応のスタックです: $stack" >&2; exit 1 ;;
esac
if [ -e "$out" ]; then
  echo "出力先がすでに存在します: $out" >&2
  exit 1
fi

mkdir -p "$out"
cp -R "$ROOT/shared/db"           "$out/db"
cp -R "$ROOT/shared/payment-mock" "$out/payment-mock"
cp -R "$ROOT/shared/$frontend"    "$out/frontend"
cp -R "$ROOT/stacks/$stack/backend" "$out/backend"
cp "$ROOT/stacks/$stack/docker-compose.yml" "$out/docker-compose.yml"
cp -R "$ROOT/shared/exercise-kit/調査ログ" "$out/調査ログ"
cat "$ROOT/shared/exercise-kit/README.head.md" \
    "$ROOT/stacks/$stack/stack-notes.md" \
    "$ROOT/shared/exercise-kit/README.tail.md" > "$out/README.md"
cp "$ROOT/shared/exercise-kit/gitignore" "$out/.gitignore"
