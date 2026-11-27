from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=900,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","Магазин 18:00 40м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
    pg.locator("li.task:has-text('Магазин')").first.locator(".name").click(); pg.wait_for_timeout(200)
    pg.locator("li.task.tdopen .tdx-pi").nth(3).click(); pg.locator("#wmenu button:has-text('Рост')").click(); pg.wait_for_timeout(300)
    pg.locator("li.task:has-text('Магазин')").first.screenshot(path="/tmp/s.png")
    pg.locator(".td-list").last.screenshot(path="/tmp/s2.png")
print(errs)
