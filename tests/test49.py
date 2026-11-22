import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=390,height=844),device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    assert not pg.is_visible("#fab")
    pg.screenshot(path="/tmp/m4_today.png")
    pg.locator("#navPlus").tap(); pg.wait_for_timeout(300); assert pg.is_visible("#qa"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.locator("#views button:has-text('Работа')").tap(); pg.wait_for_timeout(400)
    pg.locator("#navPlus").tap(); pg.wait_for_timeout(300); print("work menu", pg.locator(".wfabm, .wmenu").count()); assert pg.locator(".wfabm, .wmenu").count()>0
    pg.screenshot(path="/tmp/m4_work.png")
    pg.set_viewport_size(dict(width=1300,height=900)); pg.wait_for_timeout(300); assert not pg.is_visible("#navPlus")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
