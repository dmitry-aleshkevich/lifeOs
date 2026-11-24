# v2 канбан: новая задача сразу в режиме ввода, без времени; время на карточке; плюсы; в Делах нет «Работа»
import json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[],"routines":{},"projects":[{"id":"d1","name":"Дом","color":"blue"},{"id":"dw","name":"Работа","color":"gray","kind":"work"}],
    "work":{"projects":[{"id":"p1","name":"Эроника","color":"violet"}],"tasks":[{"id":"w1","name":"Сцена","project":"p1","status":"todo","min":2}]}}
def S(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=1000)).new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    # Дела: нет проекта «Работа»
    pg.click("#sysSeg button:has-text('Дела')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    assert pg.locator('.col[data-board="project"] h3:has-text("Работа")').count()==0
    # + Задача → сразу поле ввода
    pg.locator('.col[data-board="status"][data-key="today"] .add').click(); pg.wait_for_timeout(200)
    assert pg.locator("input.nmi").count()==1 and pg.evaluate("document.activeElement.className")=="nmi"
    pg.keyboard.type("Купить хлеб"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    t=[x for x in S(pg) if x["name"]=="Купить хлеб"][0]; assert t["min"]==0 and t["where"]=="today"
    c=pg.locator(f'.status-only .card[data-cid="{t["id"]}"], .col[data-board="status"] .card[data-cid="{t["id"]}"]'); assert c.count()==1
    # плюсы пред/пост есть, подзадача создаётся
    c.hover(); assert c.locator(".plus").count()==2
    c.locator(".pl-bot").click(force=True); pg.wait_for_selector(".sub-new"); pg.fill(".sub-new","Достать деньги"); pg.press(".sub-new","Enter"); pg.wait_for_timeout(200)
    assert any(x["name"]=="Достать деньги" and x["link"]==t["id"] for x in S(pg))
    # без времени: секундомер идёт на карточке
    pg.evaluate("window.__off=0")
    pg.locator(f'.col[data-board="status"] .card[data-cid="{t["id"]}"] > .top > .kp').click(); pg.wait_for_timeout(100)
    pg.evaluate("window.__off=65000"); pg.wait_for_timeout(700)
    assert pg.locator(f'.col[data-board="status"] .card[data-cid="{t["id"]}"] > .top > .kp').inner_text().strip().startswith("⏸ 1:0"), pg.locator(f'.col[data-board="status"] .card[data-cid="{t["id"]}"] > .top > .kp').inner_text()
    # ПКМ на кнопке: выбор времени у незапущенной задачи — работа, таймер с обратным отсчётом
    pg.click("#sysSeg button:has-text('Работа')"); pg.wait_for_timeout(300)
    k=pg.locator('.card[data-cid="w1"] > .top > .kp'); assert "2:00" in k.inner_text() or "2 мин" in k.inner_text()
    k.click(); pg.wait_for_timeout(100); pg.evaluate("window.__off+=70000"); pg.wait_for_timeout(700)
    assert "0:50" in pg.locator('.card[data-cid="w1"] > .top > .kp').inner_text() or "0:5" in pg.locator('.card[data-cid="w1"] > .top > .kp').inner_text()
    assert not errs, errs
print("ERRORS: []")
