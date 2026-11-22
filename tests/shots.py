# snapshot of main screens for before/after comparison: python3 shots.py <outdir>
import sys, os
from playwright.sync_api import sync_playwright
out=sys.argv[1]; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    for name,vp in [("d",dict(width=1300,height=900)),("m",dict(width=390,height=844))]:
        ctx=b.new_context(viewport=vp, has_touch=(name=="m")); pg=ctx.new_page(); pg.on("pageerror",lambda e:print("PAGEERROR",name,e))
        pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan'); Date.now=(()=>{const r=Date.now;const o=new Date('2026-11-22T14:00:00').getTime()-r();return ()=>r()+o})()")
        pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
        if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
        pg.fill("#tdQa","Магазин 18:00 40м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{out}/{name}_today.png", full_page=True)
        pg.locator("li.task:has-text('Магазин') .name").first.click(); pg.wait_for_timeout(300)
        pg.locator("li.task:has-text('Магазин')").first.screenshot(path=f"{out}/{name}_open.png")
        pg.mouse.click(3,vp["height"]-3); pg.wait_for_timeout(200)
        for v in ["tasks","work","habits","stats","map"]:
            try:
                pg.evaluate(f"document.querySelector('#views button[data-v={v}]')?.click()"); pg.wait_for_timeout(500)
                pg.screenshot(path=f"{out}/{name}_{v}.png", full_page=True)
            except Exception as e: print(v,e)
        ctx.close()
print("shots ok")
