import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{},"projects":[],"work":{"projects":[{"id":"p1","name":"Э","color":"violet"}],"tasks":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=800)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    pg.click("#sysSeg button:has-text('Работа')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    n=lambda: pg.locator('.col[data-board="status"] .card').count()
    pg.locator('.col[data-board="status"] .add').first.click(); pg.wait_for_timeout(200); assert n()==1
    pg.mouse.click(5,700); pg.wait_for_timeout(200); assert n()==0,n()
    pg.locator('.col[data-board="status"] .add').first.click(); pg.keyboard.type("Тест"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200); assert n()==1
    h=pg.locator('.col[data-board="status"] .card').first.bounding_box()["height"]; print("h",h)
    assert not errs,errs
print("ERRORS: []")
