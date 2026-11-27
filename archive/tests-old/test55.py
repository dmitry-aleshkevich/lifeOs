from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","ТЕСТ ЗАДАЧА 10м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
    li=pg.locator("li.task:has-text('ТЕСТ ЗАДАЧА')").first
    li.locator(".name").click(); pg.wait_for_timeout(300)
    assert pg.locator("li.task.tdopen .tdx-pi").count()==5
    assert pg.locator("li.tdopen button:has-text('Старт')").count()==0
    li=pg.locator("li.task.tdopen"); print("pill visible", li.locator(".go .mins").is_visible())
    li.locator(".tdx-pi").nth(2).click(); pg.locator("#wmenu button:has-text('30 мин')").click(); pg.wait_for_timeout(300)
    assert "30 мин" in pg.locator("li.task:has-text('ТЕСТ ЗАДАЧА') .mins").first.inner_text()
    pg.locator("li.task:has-text('ТЕСТ ЗАДАЧА') .mins").first.click(); pg.wait_for_timeout(1200)
    pg.screenshot(path="/tmp/run.png")
    m=pg.locator("li.task .mins.live"); print(m.count(), m.first.inner_text() if m.count() else None)
    if m.count(): m.first.click(); pg.wait_for_timeout(500); print("paused", pg.locator("li.task .mins.live.paused").count())
print("ERRORS:",errs)
