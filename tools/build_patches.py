# 正解版のコードから、tools/bug_edits.py の定義に従って全バグのパッチを再生成する
#   使い方: python3 tools/build_patches.py
import os, shutil, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from bug_edits import EDITS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STACKS = ["node-react", "rails-vue", "java-react", "go-react"]

def apply(tree, edits):
    for rel, old, new in edits:
        p = os.path.join(tree, rel)
        s = open(p, encoding="utf-8").read()
        n = s.count(old)
        if n != 1:
            raise SystemExit(f"{rel}: 置換対象が{n}件 ({old[:50]!r})")
        open(p, "w", encoding="utf-8").write(s.replace(old, new))

for bug, by_stack in EDITS.items():
    pdir = os.path.join(ROOT, "bugs", bug, "patches")
    shutil.rmtree(pdir, ignore_errors=True)
    os.makedirs(pdir)
    targets = ["common"] if "common" in by_stack else STACKS
    for target in targets:
        stack = "node-react" if target == "common" else target
        with tempfile.TemporaryDirectory() as tmp:
            work = os.path.join(tmp, "work")
            subprocess.run([f"{ROOT}/scripts/assemble.sh", stack, work], check=True)
            apply(work, by_stack[target])
            out = subprocess.run([f"{ROOT}/scripts/make-patch.sh", stack, work],
                                 check=True, capture_output=True, text=True).stdout
        if not out.strip():
            raise SystemExit(f"{bug}/{target}: 差分が空です")
        open(os.path.join(pdir, f"{target}.patch"), "w", encoding="utf-8").write(out)
        print(f"{bug:28s} {target:11s} {out.count(chr(10)):4d} lines")
