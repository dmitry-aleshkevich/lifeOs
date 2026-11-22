#!/bin/bash
# runs the active Playwright suite; prints PASS/FAIL per test
cd /home/claude/work/lo; fail=0
for f in test*.py; do
  out=$(timeout 90 python3 $f 2>&1); last=$(echo "$out" | tail -1)
  if [ $? -eq 0 ] && echo "$last" | grep -q "ERRORS: \[\]\|^\[\]$"; then echo "PASS $f"; else echo "FAIL $f :: $(echo "$out" | grep -m1 -E 'Error|assert' | cut -c1-120)"; fail=1; fi
done
exit $fail
