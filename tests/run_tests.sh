#!/bin/bash
# runs the active Playwright suite; prints PASS/FAIL per test
# SKIP="test63.py"  — пропустить (известные падения); RETRY=1 — повторить упавший один раз (мигающие)
cd "$(dirname "$0")"; fail=0
for f in test*.py; do
  case " $SKIP " in *" $f "*) echo "SKIP $f"; continue;; esac
  for try in $(seq 0 ${RETRY:-0}); do
    out=$(timeout 90 python3 $f 2>&1); last=$(echo "$out" | tail -1)
    if echo "$last" | grep -q "ERRORS: \[\]\|^\[\]$"; then ok=1; break; else ok=0; fi
  done
  if [ $ok = 1 ]; then echo "PASS $f"; else echo "FAIL $f :: $(echo "$out" | grep -m1 -E 'Error|assert' | cut -c1-120)"; fail=1; fi
done
exit $fail
