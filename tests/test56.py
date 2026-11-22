from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    for n in ["ААА 10м","БББ 10м"]: pg.fill("#tdQa",n); pg.press("#tdQa","Enter"); pg.wait_for_timeout(200)
    order=lambda: pg.evaluate("[...document.querySelectorAll('.td-list > li.task .name')].map(e=>e.textContent.trim()).filter(x=>/^(ААА|БББ)/.test(x))")
    print(pg.evaluate("[...document.querySelectorAll('li.task')].filter(l=>/ААА/.test(l.textContent)).map(l=>l.parentElement.tagName+'.'+l.parentElement.className+' < '+l.parentElement.parentElement.className)"))
    print("init",order()); a=pg.locator("li.task:has-text('ААА')").first; bb=pg.locator("li.task:has-text('БББ')").first
    a.scroll_into_view_if_needed(); A=a.bounding_box(); B=bb.bounding_box()
    pg.mouse.move(A["x"]+200,A["y"]+A["height"]/2); pg.mouse.down(); pg.mouse.move(A["x"]+200,B["y"]+B["height"]-2,steps=8); pg.mouse.up(); pg.wait_for_timeout(300)
    print(order()); bb.scroll_into_view_if_needed(); pg.evaluate("window.scrollBy(0,150)"); pg.screenshot(path="/tmp/td.png")
    pg.wait_for_timeout(1500); pg.reload(); pg.wait_for_timeout(900); print(order())
    assert pg.locator("li.task.tdopen").count()==0
print("ERRORS:",errs)
