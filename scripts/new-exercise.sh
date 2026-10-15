#!/usr/bin/env bash
# バグを仕込んだ演習用リポジトリを生成する
#   使い方: scripts/new-exercise.sh -s <stack> -b <B01,B03,...|all> -o <出力先> [--no-git]
#           scripts/new-exercise.sh --list
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  cat <<USAGE >&2
使い方:
  $0 -s <stack> -b <バグID(カンマ区切り) | all> -o <出力先> [--no-git]
  $0 --list

  stack : node-react | rails-vue | java-react
  例    : $0 -s node-react -b B01,B03,B05 -o ../exercise-2026-tanaka
USAGE
  exit 1
}

list_bugs() {
  for d in "$ROOT"/bugs/B*/; do
    id="$(basename "$d")"
    title="$(head -n 1 "$d/answer.md" | sed 's/^# *//')"
    printf '%-26s %s\n' "$id" "$title"
  done
}

stack=""; bugs=""; out=""; use_git=1
while [ $# -gt 0 ]; do
  case "$1" in
    -s) stack="$2"; shift 2 ;;
    -b) bugs="$2"; shift 2 ;;
    -o) out="$2"; shift 2 ;;
    --no-git) use_git=0; shift ;;
    --list) list_bugs; exit 0 ;;
    *) usage ;;
  esac
done
[ -n "$stack" ] && [ -n "$bugs" ] && [ -n "$out" ] || usage

if [ "$bugs" = "all" ]; then
  bugs="$(cd "$ROOT/bugs" && ls -d B* | cut -c1-3 | paste -sd, -)"
fi

"$ROOT/scripts/assemble.sh" "$stack" "$out"

IFS=',' read -r -a ids <<< "$bugs"
for id in "${ids[@]}"; do
  dir="$(ls -d "$ROOT"/bugs/"$id"-*/ 2>/dev/null | head -n 1 || true)"
  if [ -z "$dir" ]; then
    echo "バグが見つかりません: $id" >&2; rm -rf "$out"; exit 1
  fi
  patch_file="$dir/patches/$stack.patch"
  [ -f "$patch_file" ] || patch_file="$dir/patches/common.patch"
  if [ ! -f "$patch_file" ]; then
    echo "$id には $stack 用のパッチがありません" >&2; rm -rf "$out"; exit 1
  fi
  if ! patch -p1 -s --no-backup-if-mismatch -d "$out" < "$patch_file"; then
    echo "パッチの適用に失敗しました: $patch_file" >&2; rm -rf "$out"; exit 1
  fi
done

# チケット(症状カード)を、バグIDがわからない名前で並び順をシャッフルして配置
mkdir -p "$out/チケット"
# shuf や mapfile がない macOS 標準の環境でも動くように、awk で並べ替える
shuffled=()
while IFS= read -r id; do shuffled+=("$id"); done \
  < <(printf '%s\n' "${ids[@]}" | awk 'BEGIN { srand() } { print rand() "\t" $0 }' | sort -n | cut -f2-)
echo "出題記録(若手には見せないでください)"
i=1
for id in "${shuffled[@]}"; do
  dir="$(ls -d "$ROOT"/bugs/"$id"-*/ | head -n 1)"
  cp "$dir/symptom.md" "$out/チケット/チケット-$i.md"
  printf '  チケット-%d = %s\n' "$i" "$(basename "$dir")"
  i=$((i + 1))
done

if [ "$use_git" = 1 ]; then
  git -C "$out" init -q -b main
  git -C "$out" add -A
  git -C "$out" -c user.name="debug-dojo" -c user.email="debug-dojo@example.com" commit -q -m "initial commit"
fi
echo "演習用リポジトリを作成しました: $out"
