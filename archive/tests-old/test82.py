# v2: в Списке («Дела») четыре группы видны всегда, в пустую можно перетащить задачу
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Альфа","where":"today"}],"routines":{},"projects":[],"work":{"projects":[],"tasks":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=900,height=900)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    assert [pg.locator(f'.ghead[data-where="{k}"]').count() for k in ("today","tomorrow","backlog","wait")]==[1,1,1,1]
    s=pg.locator('.card[data-cid="a"]').bounding_box(); h=pg.locator('.ghead[data-where="wait"]').bounding_box()
    pg.mouse.move(s["x"]+330,s["y"]+6); pg.mouse.down(); pg.mouse.move(s["x"]+320,s["y"]+12,steps=3)
    pg.mouse.move(h["x"]+h["width"]/2,h["y"]+h["height"]/2,steps=12); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
    t=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks.find(t=>t.id==='a').where"); assert t=="wait",t
    assert not errs,errs
print("ERRORS: []")
