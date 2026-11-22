import sys, json
from playwright.sync_api import sync_playwright
from dnd import drag
errs=[]
STUB="""
window.__cb=null;
window.claude={use:async(n)=>n==='db'?{collection:()=>({doc:()=>({set:async()=>{},onSnapshot:(cb,er)=>{window.__cb=cb;}})})}:{id:async()=>'u1'}};
window.__fire=()=>{const d=JSON.parse(localStorage.getItem('lifeos.v1'));window.__cb({exists:true,metadata:{fromCache:false,hasPendingWrites:false},data:()=>d});};
"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=1000))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.add_init_script(STUB)
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.click("#views button:has-text('Работа')"); pg.wait_for_timeout(300)
    pg.locator(".wcol").first.locator(".wnewbtn").click(); pg.keyboard.type("Первая"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.keyboard.type("Втор"); pg.evaluate("window.__fire()"); pg.wait_for_timeout(300)   # cloud echo mid-typing
    assert pg.evaluate("document.activeElement.value")=="Втор","lost typing"
    pg.keyboard.type("ая"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.keyboard.type("Третья"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert pg.locator(".wcol").first.locator(".wcard").count()==3
    # subtask chain
    card=pg.locator(".wcol").first.locator(".wcard").first
    card.hover(); pg.wait_for_timeout(200)
    # 1: note + 4: sum
    pg.evaluate("()=>{const s=JSON.parse(localStorage.getItem('lifeos.v1'));const ts=s.work.tasks.filter(t=>t.status==='todo');ts[0].note='Описание задачи\\nвторая строка';ts[0].est=30;ts[1].est=45;s.updatedAt=Date.now();localStorage.setItem('lifeos.v1',JSON.stringify(s));}")
    pg.reload(); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.click("#views button:has-text('Работа')"); pg.wait_for_timeout(300)
    print("sum:",pg.locator(".wcol").first.locator(".wsumt").inner_text()); assert "1 ч 15" in pg.locator(".wcol").first.locator(".wsumt").inner_text()
    assert pg.locator(".wcn").count()==1 and "Описание" in pg.locator(".wcn").inner_text()
    pg.screenshot(path="/tmp/work1.png")
    # 3: archive drag
    n0=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).work.projects.filter(p=>p.archived).length")
    pg.click("button.act:has-text('Архив')"); pg.wait_for_timeout(300)
    src=pg.locator(".wpcols:not(.wacols) .wpcol .wph").nth(0); name=src.inner_text()
    dst=pg.locator(".wacols"); assert dst.count()==1
    a=src.bounding_box(); bx=dst.bounding_box()
    pg.mouse.move(a["x"]+30,a["y"]+a["height"]/2); pg.mouse.down()
    for i in range(1,16): pg.mouse.move(a["x"]+30+(bx["x"]+100-a["x"]-30)*i/15, a["y"]+(bx["y"]+30-a["y"])*i/15); pg.wait_for_timeout(20)
    pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
    n1=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).work.projects.filter(p=>p.archived).length"); print("archived",n0,"->",n1); assert n1==n0+1
    # back
    src=pg.locator(".wacols .wpcol .wph").nth(0); dst=pg.locator(".wpcols:not(.wacols)")
    a=src.bounding_box(); bx=dst.bounding_box()
    pg.mouse.move(a["x"]+30,a["y"]+a["height"]/2); pg.mouse.down()
    for i in range(1,16): pg.mouse.move(a["x"]+30+(bx["x"]+300-a["x"]-30)*i/15, a["y"]+(bx["y"]+60-a["y"])*i/15); pg.wait_for_timeout(20)
    pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
    n2=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).work.projects.filter(p=>p.archived).length"); print("back",n2); assert n2==n0
    pg.screenshot(path="/tmp/work2.png")
    # 6: morning hidden when all done
    pg.click("#views button:has-text('Сегодня')"); pg.wait_for_timeout(300)
    assert "Утро" in pg.inner_text("#vToday")
    pg.evaluate("()=>{const s=JSON.parse(localStorage.getItem('lifeos.v1'));s.routines.morning.forEach(t=>t.done=true);s.updatedAt=Date.now();localStorage.setItem('lifeos.v1',JSON.stringify(s));}")
    pg.reload(); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    assert "Утро" not in pg.inner_text("#vToday"),pg.inner_text("#vToday")[:200]
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
