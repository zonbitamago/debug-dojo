#!/usr/bin/env bash
# 新しいバグのパッチを作る
#   1. scripts/assemble.sh <stack> <作業ディレクトリ> で正解版を組み立てる
#   2. 作業ディレクトリのコードにバグを仕込む
#   3. scripts/make-patch.sh <stack> <作業ディレクトリ> > bugs/Bxx-xxx/patches/<stack>.patch
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
stack="${1:-}"; edited="${2:-}"
if [ -z "$stack" ] || [ ! -d "$edited" ]; then
  echo "使い方: $0 <stack> <バグを仕込んだ作業ディレクトリ>" >&2
  exit 1
fi
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
"$ROOT/scripts/assemble.sh" "$stack" "$tmp/a"
ln -s "$(cd "$edited" && pwd)" "$tmp/b"
cd "$tmp"
diff -ruN -x node_modules -x target -x tmp -x log -x .git -x dist -x Gemfile.lock -x 'チケット' a b/ \
  | sed -e 's#^+++ b//#+++ b/#' || true
