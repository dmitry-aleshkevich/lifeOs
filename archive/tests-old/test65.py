# ТЗ v8: undo in Plan, no text selection in marquee, check centered, Поработать delete, clear-done btn, no work tasks in focus, ghost 25m pill
import sys; sys.path.insert(0,'/tmp')
from playwright.sync_api import sync_playwright
errs=[]
SETUP="""()=>{const j=JSON.parse(localStorage.getItem('lifeos.v1'));const t0=j.work.tasks[0];j.work.tasks.push({...t0,id:'zz1',name:'Статус',status:'doing',ord:99,parent:'',est:30});localStorage.setItem('lifeos.v1',JSON.stringify(j));}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1200,height=900)); pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.goto("file:///home/claude/work/lo/index.html"); pg.evaluate(SETUP); pg.reload(); pg.wait_for_timeout(900)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    # 6: focus mode never lists work tasks
    pg.evaluate("localStorage.setItem('lifeos.focus.v1','focus')"); pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    txt=pg.locator("#vToday").inner_text(); print("focus has Статус:", "Статус" in txt); assert "Статус" not in txt
    pg.evaluate("localStorage.setItem('lifeos.focus.v1','plan')"); pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    # 3: check mark centred
    pg.locator("li.task:has-text('Поработать') .check").first.click(); pg.wait_for_timeout(300)
    d=pg.evaluate("""()=>{const c=document.querySelector('li.task:not(.lnc) .check[aria-pressed=true]')||[...document.querySelectorAll('li.task.done .check')][0];const r=c.getBoundingClientRect(),s=c.querySelector('svg').getBoundingClientRect();return [(s.x+s.width/2)-(r.x+r.width/2),(s.y+s.height/2)-(r.y+r.height/2)]}""")
    print("check offset",d); assert abs(d[0])<1 and abs(d[1])<1
    # 5: clear-done button near LifeCore
    assert pg.locator(".td-ctl #clearDone").count()==1
    pg.locator("#clearDone").click(); pg.wait_for_timeout(400)
    assert pg.locator("li.task:has-text('Поработать')").count()==0, "Поработать must stay gone after clear"
    pg.wait_for_timeout(500); assert pg.locator("li.task:has-text('Поработать')").count()==0
    # 4: delete via ✕ also sticks (new page state)
    pg.evaluate("()=>{const j=JSON.parse(localStorage.getItem('lifeos.v1'));delete j.workAutoOff;localStorage.setItem('lifeos.v1',JSON.stringify(j));}"); pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    li=pg.locator("li.task:has-text('Поработать')").first; li.hover(); li.locator(".xbtn").click(force=True); pg.wait_for_timeout(500)
    assert pg.locator("li.task:has-text('Поработать')").count()==0
    # 7/8: ghost add: no placeholder, 25 min pill, editable
    pg.mouse.click(5,500); pg.keyboard.press("n"); pg.wait_for_timeout(300)
    assert pg.get_attribute("#qinlIn","placeholder") in (None,""); assert pg.locator(".qinl .qf-m b").inner_text()=="25"
    pg.keyboard.type("Т1"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    pg.locator(".qinl .qf-m").click(); pg.keyboard.type("40"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert pg.evaluate("document.activeElement.id")=="qinlIn"; pg.keyboard.type("Т2"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300); pg.keyboard.press("Escape")
    mins=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tasks.filter(t=>/^Т[12]$/.test(t.name)).map(t=>t.name+t.min)"); print(mins); assert mins==["Т125","Т240"]
    # 1: Plan undo of delete/move
    pg.evaluate("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(500)
    n0=pg.locator(".pk-col li.task").count()
    li=pg.locator(".pk-col[data-k=today] li.task:has-text('Т1')").first; li.hover(); li.locator(".xbtn").click(force=True); pg.wait_for_timeout(600)
    assert pg.locator(".pk-col li.task").count()==n0-1
    pg.mouse.click(5,600); pg.keyboard.press("Control+z"); pg.wait_for_timeout(500)
    assert pg.locator(".pk-col li.task").count()==n0, "ctrl+z after delete"
    # Russian layout: code stays KeyZ, key 'я'
    li=pg.locator(".pk-col[data-k=today] li.task:has-text('Т2')").first; li.hover(); li.locator(".xbtn").click(force=True); pg.wait_for_timeout(600)
    pg.evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'я',code:'KeyZ',metaKey:true,bubbles:true}))"); pg.wait_for_timeout(500)
    assert pg.locator(".pk-col li.task").count()==n0, "cmd+я after delete"
    # 2: no text selection while marquee
    bb=pg.locator(".pk-cols").bounding_box(); pg.mouse.move(bb["x"]+bb["width"]-3,bb["y"]-4); pg.mouse.down(); pg.mouse.move(bb["x"]+10,bb["y"]+bb["height"]-4,steps=8)
    sel=pg.evaluate("String(getSelection())"); pg.mouse.up(); print("selected text:",repr(sel)); assert sel.strip()==""
print("ERRORS:",errs)
