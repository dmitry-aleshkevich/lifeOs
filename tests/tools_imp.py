# Remove unnecessary !important: bisect over rules; a rule keeps !important only if removing it changes a screenshot.
# Rules whose selector matches nothing in the covered states are left untouched (untested).
import re, os, sys, subprocess, json, hashlib
from playwright.sync_api import sync_playwright
CSS = open('src/app.css', encoding='utf8').read()
# locate rules with !important: (start,end) of each declaration block + selector
rules = []
for m in re.finditer(r'([^{}]+)\{([^{}]*!important[^{}]*)\}', CSS):
    rules.append((m.start(2), m.end(2), ' '.join(re.sub(r'/\*.*?\*/', '', m.group(1), flags=re.S).split())))
print(len(rules), 'rules with !important', flush=True)
def variant(strip):
    out = []; last = 0
    for i, (a, b, sel) in enumerate(rules):
        if i in strip: out.append(CSS[last:a]); out.append(CSS[a:b].replace(' !important', '').replace('!important', '')); last = b
    out.append(CSS[last:]); return ''.join(out)
INIT = "localStorage.setItem('lifeos.focus.v1','plan'); document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';document.head.appendChild(st)})"
def states(pg, vp, shot, mark):
    pg.goto("file:///home/claude/work/lo/archive/v1/index.html"); pg.wait_for_timeout(600); pg.set_default_timeout(4000)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    for n in ["Магазин 18:00 40м", "Купить 10м"]: pg.fill("#tdQa", n); pg.press("#tdQa", "Enter"); pg.wait_for_timeout(120)
    shot('today'); mark()
    pg.locator("li.task:has-text('Магазин') .name").first.click(); pg.wait_for_timeout(250); shot('open'); mark()
    pg.locator("li.task:has-text('Купить') .mins").first.click(); pg.wait_for_timeout(700)
    pg.evaluate("document.querySelectorAll('.mins.live').forEach(e=>e.textContent='00:00')"); shot('run'); mark()
    pg.locator("li.task:has-text('Купить') .mins.live").first.click(); pg.wait_for_timeout(300)
    pg.mouse.click(3, vp['height'] - 3); pg.wait_for_timeout(200)
    for v in ["tasks", "work", "habits", "stats", "map", "scen"]:
        pg.evaluate(f"document.querySelector('#views button[data-v={v}]')?.click() || (window.__sv && __sv('{v}'))"); pg.wait_for_timeout(450); shot(v); mark()
    pg.evaluate("document.querySelector('#views button[data-v=tasks]')?.click()"); pg.wait_for_timeout(400)
    pg.locator(".pk-col li.task .name").first.click(); pg.wait_for_timeout(250); shot('plan_open'); mark()
def run(css, collect=False):
    open('src/app.css', 'w', encoding='utf8').write(css); subprocess.run(['python3', 'build.py'], capture_output=True)
    hashes = []; matched = set()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for name, vp in [("d", dict(width=1300, height=900)), ("m", dict(width=390, height=844))]:
            ctx = b.new_context(viewport=vp, has_touch=(name == "m")); pg = ctx.new_page(); pg.clock.set_fixed_time("2026-11-22T14:00:00"); pg.add_init_script(INIT)
            shot = lambda tag: (pg.evaluate("document.querySelectorAll('.mins.live,.tin-time,#eveBan').forEach(e=>e.textContent='0')"), hashes.append(tag + hashlib.md5(pg.screenshot(full_page=True)).hexdigest()))
            def mark():
                if not collect: return
                sels = [r[2] for r in rules]
                res = pg.evaluate("(s)=>s.map(x=>{try{return document.querySelector(x.replace(/::?[a-z-]+(\\([^)]*\\))?/g,(m)=>m.startsWith(':not')?m:''))?1:0}catch(e){return 0}})", sels)
                for i, r in enumerate(res):
                    if r: matched.add(i)
            try: states(pg, vp, shot, mark)
            except Exception as e: hashes.append('ERR'); ctx.close(); b.close(); return hashes, matched
            ctx.close()
        b.close()
    return hashes, matched
base, matched = run(CSS, collect=True)
again, _ = run(CSS)
bad=[a[:12] for a,b2 in zip(base,again) if a!=b2]; assert not bad, ('not deterministic', bad)
cand = sorted(matched); print(len(cand), 'testable rules', flush=True)
need = []
def check(group):
    h, _ = run(variant(set(group) | set(safe)))
    return h == base
safe = []
def bisect(group):
    if not group: return
    if check(group): safe.extend(group); print('safe +', len(group), flush=True); return
    if len(group) == 1: need.append(group[0]); print('needed:', rules[group[0]][2][:60], flush=True); return
    mid = len(group) // 2; bisect(group[:mid]); bisect(group[mid:])
try:
    bisect(cand)
finally:
    final = variant(set(safe)); open('src/app.css', 'w', encoding='utf8').write(final); subprocess.run(['python3', 'build.py'], capture_output=True)
    print('stripped', len(safe), 'kept', len(need), 'untested', len(rules) - len(cand))
