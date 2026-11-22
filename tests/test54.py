from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","ТЕСТ ЗАДАЧА 10м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(200)
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(400)
    pg.locator(".pk-col li.task:has-text('ТЕСТ ЗАДАЧА') .name").first.click(); pg.wait_for_timeout(300)
    assert pg.locator("li.task.tdopen").count()==1
    pg.mouse.click(5,850); pg.wait_for_timeout(300)
    assert pg.locator("li.task.tdopen").count()==0
print("ERRORS:",errs)
