#!/usr/bin/env bash
# すべてのバグのパッチが、単独でも全部まとめても適用できるかを確認する
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
status=0

for stack in node-react rails-vue java-react go-react; do
  all_ok=1
  "$ROOT/scripts/assemble.sh" "$stack" "$tmp/$stack-all" >/dev/null
  for dir in "$ROOT"/bugs/B*/; do
    id="$(basename "$dir")"
    patch_file="$dir/patches/$stack.patch"
    [ -f "$patch_file" ] || patch_file="$dir/patches/common.patch"
    if [ ! -f "$patch_file" ]; then
      echo "NG  $stack  $id  パッチがありません"; status=1; continue
    fi
    "$ROOT/scripts/assemble.sh" "$stack" "$tmp/$stack-$id" >/dev/null
    if patch -p1 -s --dry-run -d "$tmp/$stack-$id" < "$patch_file" >/dev/null; then
      echo "OK  $stack  $id"
    else
      echo "NG  $stack  $id  単独で適用できません"; status=1
    fi
    if ! patch -p1 -s --no-backup-if-mismatch -d "$tmp/$stack-all" < "$patch_file" >/dev/null; then
      all_ok=0
    fi
  done
  if [ "$all_ok" = 1 ]; then echo "OK  $stack  全バグ同時適用"; else echo "NG  $stack  全バグ同時適用で競合"; status=1; fi
done
exit $status
