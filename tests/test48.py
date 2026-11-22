import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=390,height=844),device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.clock.install(time="2026-11-23T12:00:00")
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    nav=pg.evaluate("document.querySelector('#views').getBoundingClientRect().height"); print("nav h",nav); assert nav<100
    vis=pg.evaluate("[...document.querySelectorAll('#views button')].filter(b=>b.offsetParent).map(b=>b.innerText.trim())"); print(vis); assert vis==["Сегодня","План","Работа","Ещё",""]
    pg.locator("#navPlus").tap(); pg.wait_for_timeout(300); assert pg.is_visible("#qinlIn") or pg.is_visible("#qa"); pg.keyboard.press("Escape")
    assert not pg.is_visible("#bugBtn")
    # long press on task -> menu
    pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(200); li=pg.locator("li.task").nth(1); li.scroll_into_view_if_needed(); bb=li.bounding_box()
    pg.evaluate("""([x,y])=>{const el=document.elementFromPoint(x,y);const t=new Touch({identifier:1,target:el,clientX:x,clientY:y});el.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));}""",[bb["x"]+120,bb["y"]+bb["height"]/2])
    pg.wait_for_timeout(700); m=pg.locator(".wmenu, [role=menu]").count(); print("menus",m); assert m>0
    pg.screenshot(path="/tmp/m3_menu.png")
    pg.keyboard.press("Escape"); pg.mouse.click(5,300); pg.wait_for_timeout(200)
    pg.locator("#views button:has-text('Ещё')").tap(); pg.wait_for_timeout(300); pg.locator("[role=menuitem]:has-text('Сценарии')").tap(); pg.wait_for_timeout(500)
    w=pg.evaluate("document.documentElement.scrollWidth"); print("scen width",w); assert w<=390
    pg.screenshot(path="/tmp/m3_scen.png")
    pg.locator("#views button:has-text('Сегодня')").tap(); pg.wait_for_timeout(300)
    pg.locator(".td-gear").tap(); pg.wait_for_timeout(200); assert pg.locator(".tp-a:has-text('Баг')").count()==1
    pg.mouse.click(5,600); pg.wait_for_timeout(200)
    pg.screenshot(path="/tmp/m3_today.png")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
