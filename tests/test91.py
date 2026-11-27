# v2b (Beta 2.0): копия данных из беты, бета не меняется, переключатель из трёх
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(500)
    assert pg.locator(".vsw a").count()==3
    before=pg.evaluate("()=>localStorage.getItem('lifeos.v2')")
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(500)
    assert pg.locator(".vsw").count()==0
    assert pg.locator(".card[data-cid=a]").count()==1
    pg.evaluate("()=>{S.tasks.find(t=>t.id==='a').name='Изменено';save();render()}")
    assert pg.evaluate("()=>localStorage.getItem('lifeos.v2')")==before  # бета не тронута
    assert "lifeos.v2b" in pg.evaluate("()=>Object.keys(localStorage).join()")
    pg.reload();pg.wait_for_selector('#viewSeg button');assert pg.locator(".card[data-cid=a] .nm").inner_text()=="Изменено"
    assert errs==[],errs
    print("ERRORS:",errs)
