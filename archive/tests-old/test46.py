import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=900))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.clock.install(time="2026-11-23T20:30:00"); pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    assert pg.locator("#eveBan").count()==0
    pg.clock.fast_forward("01:00:00"); pg.wait_for_timeout(300)
    t=pg.inner_text("#eveBan"); print(t.replace("\n"," | ")); assert ("2:30" in t or "2:29" in t) and "ещё 7" not in t
    pg.screenshot(path="/tmp/eve.png")
    pg.click(".eb-x"); pg.wait_for_timeout(100); assert "min" in pg.get_attribute("#eveBan","class")
    pg.reload(); pg.wait_for_timeout(500); assert "min" in pg.get_attribute("#eveBan","class")
    pg.click("#eveBan"); pg.wait_for_timeout(100); assert "min" not in pg.get_attribute("#eveBan","class")
    pg.clock.fast_forward("01:45:00"); pg.wait_for_timeout(300); assert "late" in pg.get_attribute("#eveBan","class")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
