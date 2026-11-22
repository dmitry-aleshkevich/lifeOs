import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); ctx=b.new_context(viewport=dict(width=1300,height=900),permissions=["clipboard-read","clipboard-write"]); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(500)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.click("#bugBtn"); assert pg.is_visible("#bugPop")
    assert pg.input_value(".bg-tag").startswith("Сегодня"),pg.input_value(".bg-tag")
    pg.fill(".bg-ta","Кнопка плюс слишком мелкая"); pg.keyboard.press("Control+Enter")
    pg.click("#views button:has-text('Работа')"); pg.wait_for_timeout(300)
    pg.wait_for_timeout(200); print(pg.input_value(".bg-tag"))
    pg.click(".bg-ty .chip[data-t=bug]"); pg.fill(".bg-ta","Карточка не тянется"); pg.click(".bg-add")
    assert pg.locator(".bg-ls li").count()==2
    pg.click(".bg-tz"); pg.wait_for_timeout(300)
    t=pg.input_value(".bg-out"); print(t)
    assert "Кнопка плюс" in t and "Карточка" in t and "## Работа" in t
    assert pg.evaluate("navigator.clipboard.readText()")==t
    pg.reload(); pg.wait_for_timeout(400); pg.click("#bugBtn"); assert pg.locator(".bg-ls li").count()==2
    pg.screenshot(path="/tmp/bug.png")
    pg.keyboard.press("Escape"); assert not pg.is_visible("#bugPop")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
