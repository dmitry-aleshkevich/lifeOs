# Plan: marquee select 2 cards, drag both to another column
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(400)
    pg.locator(".pk-col[data-k=today] .pk-add").click()
    for n in ("А1","Б2","В3"): pg.keyboard.type(n+" 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    c=pg.locator(".pk-col[data-k=today]").bounding_box(); l=pg.locator(".pk-col[data-k=today] li.task")
    r1=l.nth(0).bounding_box(); r2=l.nth(1).bounding_box()
    pg.mouse.move(c["x"]+c["width"]-4, r1["y"]-8); pg.mouse.down(); pg.mouse.move(c["x"]+c["width"]-60, r2["y"]+r2["height"]-4, steps=8)
    print("band", pg.locator(".pk-band").count(), "sel-mid", pg.locator("li.pk-sel").count()); pg.mouse.up(); pg.wait_for_timeout(200)
    n=pg.locator("li.pk-sel").count(); print("selected",n); assert n==2
    pg.locator(".pk-col[data-k=today]").screenshot(path="/tmp/ms.png")
    # drag selected card to tomorrow
    src=l.nth(0); dst=pg.locator(".pk-col[data-k=tomorrow]"); src.drag_to(dst); pg.wait_for_timeout(500)
    t=pg.evaluate("[...document.querySelectorAll('.pk-col[data-k=tomorrow] li.task .name')].map(e=>e.textContent.trim())"); print("tomorrow",t); assert set(t)>={"А1","Б2"}
    assert pg.locator(".pk-col[data-k=today] li.task").count()==1
print("ERRORS:",errs)
