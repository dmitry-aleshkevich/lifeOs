from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","ААА 10м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
    li=pg.locator("li.task:has-text('ААА')").first; li.scroll_into_view_if_needed()
    li.locator(".mins").click(); pg.wait_for_timeout(800)
    assert pg.locator("li.task .mins.live").count()==1
    pg.locator("li.task:has-text('ААА') .check").first.click(); pg.wait_for_timeout(900)
    print("live after done:", pg.locator("li.task .mins.live").count(), "timer hidden:", pg.evaluate("document.getElementById('timer').hidden"))
    print("done:", pg.locator("li.task.done:has-text('ААА')").count())
    pg.locator("li.task.done:has-text('ААА')").first.screenshot(path="/tmp/done.png"); pg.mouse.click(5,850); pg.keyboard.press("Control+z"); pg.wait_for_timeout(500)
    print("done after undo:", pg.locator("li.task.done:has-text('ААА')").count(), pg.locator("li.task:has-text('ААА')").count())
print("ERRORS:",errs)
