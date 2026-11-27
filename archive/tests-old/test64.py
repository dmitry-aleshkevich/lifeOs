# Plan: select all by marquee, Backspace / button delete everything at once
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.evaluate("""()=>{const j=JSON.parse(localStorage.getItem('lifeos.v1'));for(let i=0;i<30;i++)j.tasks.push({id:'q'+i,name:'Q'+i,min:5,done:false,spent:0,note:'',project:'',where:['today','tomorrow'][i%2],sessions:0,acc:0,waitUntil:'',doneAt:0,due:'',at:''});localStorage.setItem('lifeos.v1',JSON.stringify(j));}""")
    pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(500)
    cnt=lambda: pg.locator(".pk-col li.task").count()
    n0=cnt(); print("before",n0)
    bb=pg.locator(".pk-cols").bounding_box(); pg.mouse.move(bb["x"]+bb["width"]-3,bb["y"]-4); pg.mouse.down(); pg.mouse.move(bb["x"]+4,890,steps=10); pg.wait_for_timeout(2500); pg.mouse.up(); pg.wait_for_timeout(300)
    print("sel",pg.locator("li.pk-sel").count(), "bar", pg.locator("#pkbulk").count()); assert pg.locator("li.pk-sel").count()==30
    pg.keyboard.press("Backspace"); pg.wait_for_timeout(500)
    pg.evaluate("window.scrollTo(0,0)")
    print("after",cnt()); assert cnt()==0
    pg.locator("#toast button, .toast button").first.click(); pg.wait_for_timeout(400); print("undo",cnt()); assert cnt()==n0
    bb=pg.locator(".pk-cols").bounding_box(); pg.mouse.move(bb["x"]+bb["width"]-3,bb["y"]-4); pg.mouse.down(); pg.mouse.move(bb["x"]+4,890,steps=10); pg.wait_for_timeout(2500); pg.mouse.up(); pg.wait_for_timeout(300)
    pg.locator("#pkbulk button[data-a=del]").click(); pg.wait_for_timeout(500); print("button",cnt()); assert cnt()==0
print("ERRORS:",errs)
