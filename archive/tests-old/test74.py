# v2 канбан «Работа»: задача как тикет (проект ⇄ статус), «Очистить», статус по таймеру, Список = очередь
import sys, json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[],"routines":{},"projects":[],
    "work":{"projects":[{"id":"p1","name":"Эроника","color":"violet"},{"id":"p2","name":"Голубева","color":"orange"}],
            "tasks":[{"id":"w1","name":"Сцена 1","project":"p1","status":"","min":20},{"id":"w2","name":"Сцена 2","project":"p1","status":"","min":20},
                     {"id":"w3","name":"Без проекта","project":"","status":"todo","min":15},{"id":"w4","name":"Рилс","project":"p2","status":"todo","min":30}]}}
def S(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")
def T(pg,i): return next(t for t in S(pg) if t["id"]==i)
def drag(pg,card,col):
    a=pg.locator(f'.card[data-cid="{card}"]').first.bounding_box(); c=pg.locator(col).first.bounding_box()
    pg.mouse.move(a["x"]+60,a["y"]+a["height"]/2); pg.mouse.down(); pg.mouse.move(a["x"]+70,a["y"]+a["height"]/2+20,steps=4)
    pg.mouse.move(c["x"]+c["width"]/2,c["y"]+90,steps=12); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1500,height=1000)); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_timeout(400)
    pg.click("#sysSeg button:has-text('Работа')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    st=lambda k: f'.col[data-board="status"][data-key="{k}"]'; pr=lambda k: f'.col[data-board="project"][data-key="{k}"]'
    assert pg.locator(st("todo")+" .card").count()==2 and pg.locator(st("doing")+" .card").count()==0
    assert pg.locator(pr("p1")+" .card").count()==2 and pg.locator(pr("p2")+" .card").count()==0, "тикет: задача со статусом не видна в проекте"
    # проект → статус
    drag(pg,"w1",st("todo")); assert T(pg,"w1")["status"]=="todo"
    assert pg.locator(pr("p1")+" .card").count()==1
    # «Очистить» в «В работу»: w1 и w4 возвращаются в проекты, w3 без проекта остаётся
    pg.click(st("todo")+" .clr"); pg.wait_for_timeout(300)
    assert T(pg,"w1")["status"]=="" and T(pg,"w4")["status"]=="" and T(pg,"w3")["status"]=="todo"
    assert pg.locator(pr("p2")+" .card").count()==1
    # статус → проект (обратный перенос)
    drag(pg,"w3",pr("p2")); assert T(pg,"w3")["project"]=="p2" and T(pg,"w3")["status"]==""
    # снова в работу: w4; Список показывает очередь
    drag(pg,"w4",st("todo")); assert T(pg,"w4")["status"]=="todo"
    pg.click("#envSeg button:has-text('Список')"); pg.wait_for_timeout(300)
    assert pg.locator('.card[data-cid="w4"]').count()==1 and pg.locator('.card[data-cid="w1"]').count()==0
    # старт таймера: статус «В процессе», в списке «Сейчас»
    pg.locator('.mins[data-tid="w4"]').click(); pg.wait_for_timeout(500)
    assert T(pg,"w4")["status"]=="doing"
    assert "сейчас" in pg.inner_text("#view").lower()
    # пауза → «Жду», в списке остаётся
    pg.locator('.mins[data-tid="w4"]').click(); pg.wait_for_timeout(500)
    assert T(pg,"w4")["status"]=="wait" and pg.locator('.card[data-cid="w4"]').count()==1
    # продолжить → снова «В процессе»; готово → «Готово»
    pg.locator('.mins[data-tid="w4"]').click(); pg.wait_for_timeout(400); assert T(pg,"w4")["status"]=="doing"
    pg.locator('.card[data-cid="w4"] .ck').click(); pg.wait_for_timeout(400)
    assert T(pg,"w4")["status"]=="done" and pg.locator('.card[data-cid="w4"]').count()==0
    pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    assert pg.locator(st("done")+' .card[data-cid="w4"]').count()==1
    pg.click(st("done")+" .clr"); pg.wait_for_timeout(300)
    assert T(pg,"w4")["archived"] is True and pg.locator('.card[data-cid="w4"]').count()==0
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
