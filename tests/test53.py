from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","ТЕСТ ЗАДАЧА 10м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
    li=pg.locator("li.task:has-text('ТЕСТ ЗАДАЧА')").first
    li.scroll_into_view_if_needed(); m=li.locator(".mins"); a=m.bounding_box()
    li.hover(); pg.wait_for_timeout(300); b2=m.bounding_box()
    assert a==b2,(a,b2)
    bb=li.bounding_box(); pg.mouse.move(bb["x"]+bb["width"]-12,bb["y"]+12); pg.wait_for_timeout(300)
    x=li.locator(".xbtn"); print(x.evaluate("e=>getComputedStyle(e).opacity"), li.locator(".pen:not(.xbtn)").evaluate_all("l=>l.map(e=>getComputedStyle(e).display)"))
    assert m.bounding_box()==a
    x.click(); pg.wait_for_timeout(300); print(pg.locator("li.task:has-text('ТЕСТ ЗАДАЧА')").count())
print("ERRORS:",errs)
