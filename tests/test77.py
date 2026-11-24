# v2: подзадачи видны в канбане, порядок проектов тянется, нет выбора времени в панели, окно ввода закрывается кликом мимо
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{},"projects":[],"work":{"projects":[{"id":"p1","name":"Эроника","color":"violet"},{"id":"p2","name":"Голубева","color":"orange"}],
 "tasks":[{"id":"w1","name":"Сцена","project":"p1","status":"todo","min":20}]}}
def P(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).projects.map(p=>p.id)")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=1000)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    pg.click("#sysSeg button:has-text('Работа')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    c=pg.locator('.col[data-board="status"] .card[data-cid="w1"]'); c.hover()
    c.locator(".pl-bot").click(force=True); pg.wait_for_selector(".sub-new")
    # клик мимо закрывает окно
    pg.mouse.click(5,500); pg.wait_for_timeout(200); assert pg.locator(".sub-new").count()==0
    c.hover(); c.locator(".pl-bot").click(force=True); pg.fill(".sub-new","Подзадача"); pg.press(".sub-new","Enter"); pg.wait_for_timeout(200)
    assert pg.locator('.col[data-board="status"] .card[data-sub="1"]:has-text("Подзадача")').count()==1
    # панель без выбора длительности
    pg.locator('.col[data-board="status"] .card[data-cid="w1"] .nm').click(position=dict(x=200,y=5)) if False else None
    pg.locator('.col[data-board="status"] .card[data-cid="w1"] .txt').click(position=dict(x=5,y=30)); pg.wait_for_timeout(200)
    assert pg.locator(".panel").count()>=1 and pg.locator(".panel .chipb[data-min]").count()==0 and pg.locator(".panel .pnum").count()==0
    pg.mouse.click(5,500); pg.wait_for_timeout(200)
    # порядок проектов
    assert P(pg)[:2]==["p1","p2"]
    a=pg.locator('.col[data-board="project"][data-key="p1"] h3').bounding_box(); t=pg.locator('.col[data-board="project"][data-key="p2"]').bounding_box()
    pg.mouse.move(a["x"]+10,a["y"]+a["height"]/2); pg.mouse.down(); pg.mouse.move(a["x"]+30,a["y"]+a["height"]/2,steps=4)
    pg.mouse.move(t["x"]+t["width"]/2,a["y"]+a["height"]/2,steps=10); pg.mouse.up(); pg.wait_for_timeout(300)
    assert P(pg)[:2]==["p2","p1"], P(pg)
    assert not errs, errs
print("ERRORS: []")
