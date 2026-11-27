# v2 Дела: тикет-логика проект ⇄ План, «Очистить» на «Сегодня»
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"А","project":"d1","where":"","min":10},{"id":"b","name":"Б","project":"","where":"today","min":10}],"routines":{},
    "projects":[{"id":"d1","name":"Дом","color":"blue"}],"work":{"projects":[],"tasks":[]}}
def T(pg,i): return next(t for t in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks") if t["id"]==i)
def drag(pg,card,col):
    a=pg.locator(f'.card[data-cid="{card}"]').first.bounding_box(); c=pg.locator(col).first.bounding_box()
    pg.mouse.move(a["x"]+60,a["y"]+a["height"]/2); pg.mouse.down(); pg.mouse.move(a["x"]+70,a["y"]+a["height"]/2+20,steps=4)
    pg.mouse.move(c["x"]+c["width"]/2,c["y"]+90,steps=12); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=1000)).new_page()
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    pg.evaluate("()=>{const s=JSON.parse(localStorage.getItem('lifeos.v2'));s.tasks.find(t=>t.id==='a').where='';localStorage.setItem('lifeos.v2',JSON.stringify(s))}"); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    pg.click("#sysSeg button:has-text('Дела')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    st=lambda k: f'.col[data-board="status"][data-key="{k}"]'; pr=lambda k: f'.col[data-board="project"][data-key="{k}"]'
    assert pg.locator(pr("d1")+' .card[data-cid="a"]').count()==1 and pg.locator(pr("")+' .card[data-cid="b"]').count()==0
    drag(pg,"a",st("today")); assert T(pg,"a")["where"]=="today" and pg.locator(pr("d1")+" .card").count()==0
    pg.click(st("today")+" .clr"); pg.wait_for_timeout(300)
    assert T(pg,"a")["where"]=="" and T(pg,"b")["where"]=="today"
    drag(pg,"b",pr("d1")); assert T(pg,"b")["project"]=="d1" and T(pg,"b")["where"]==""
print("ERRORS: []")
