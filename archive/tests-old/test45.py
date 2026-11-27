import sys
from playwright.sync_api import sync_playwright
errs=[]
def dragli(pg, src, dst, below):
    a=src.bounding_box(); b=dst.bounding_box()
    pg.mouse.move(a["x"]+10,a["y"]+a["height"]/2); pg.mouse.down()
    ty=b["y"]+(b["height"]*0.8 if below else b["height"]*0.2)
    for i in range(1,13): pg.mouse.move(a["x"]+10, a["y"]+a["height"]/2+(ty-a["y"]-a["height"]/2)*i/12); pg.wait_for_timeout(20)
    pg.mouse.up(); pg.wait_for_timeout(250)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=1000))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.click("#views button:has-text('Сценарии')"); pg.wait_for_timeout(300)
    assert pg.locator(".sce-l .sce-b[data-a=up]:visible").count()==0
    # task scenario: move Кухня(0) below Одежда(2)
    ul=pg.locator(".tp-b").first.locator(".sce-l")
    dragli(pg, ul.locator("li").nth(0), ul.locator("li").nth(2), True)
    names=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tpls[0].items.map(x=>x.name)"); print(names); assert names==["Комната","Одежда","Кухня"]
    # morning scenario: move last to first
    ul=pg.locator(".sce-c").nth(1).locator(".sce-l"); n=ul.locator("li").count()
    before=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).mScen[1].items.map(x=>x.name)")
    dragli(pg, ul.locator("li").nth(n-1), ul.locator("li").nth(0), False)
    after=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).mScen[1].items.map(x=>x.name)"); print(after[:3])
    assert after[0]==before[-1] and len(after)==len(before)
    # inputs still editable (no drag on input click)
    inp=pg.locator(".tp-b").first.locator(".sce-in").first; inp.click(); inp.fill("Комната2"); inp.press("Tab"); pg.wait_for_timeout(200)
    assert pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tpls[0].items[0].name")=="Комната2"
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
