import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=1000))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.clock.install(time="2026-11-23T12:00:00")
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    t=pg.inner_text("#vToday"); assert "Утро" in t and "Обед" in t and "Вечер" in t, t[:300]
    pg.click(".td-core"); pg.wait_for_timeout(200)
    t=pg.inner_text("#vToday"); print(t[:200].replace("\n"," | ")); assert "Утро" not in t and "Обед" not in t and "Зал" not in t and "Вечер" not in t
    pg.click(".td-seg [data-tm=cal]"); pg.wait_for_timeout(300)
    t=pg.inner_text("#vToday"); assert "Обед" not in t and "Ужин" not in t
    pg.screenshot(path="/tmp/core_off.png")
    pg.reload(); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    assert pg.get_attribute(".td-core","aria-pressed")=="false" and "Обед" not in pg.inner_text("#vToday")
    pg.click(".td-core"); pg.wait_for_timeout(200)
    t=pg.inner_text("#vToday"); assert "Обед" in t and "Утро" in t
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
