# v2: «задача одна» — подзадачи и карточка одинаковы в Списке, Канбане и «Без времени»; создание задач идёт одним путём
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{},"projects":[],"work":{"projects":[{"id":"p1","name":"Э","color":"violet"}],
 "tasks":[{"id":"w1","name":"Родитель","project":"p1","status":"todo","min":20}]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    pg.click("#sysSeg button:has-text('Работа')"); pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    c=pg.locator('.col[data-board="status"] .card[data-cid="w1"]'); c.hover()
    # подзадача после и до, тремя входами: окно «+», быстрый ввод, кнопка «+ Задача»
    c.locator(".pl-bot").click(force=True); pg.fill(".sub-new","После"); pg.press(".sub-new","Enter"); pg.wait_for_timeout(200)
    c.hover(); c.locator("> .pl-top").click(force=True); pg.fill(".sub-new","До"); pg.press(".sub-new","Enter"); pg.wait_for_timeout(200)
    T=lambda: pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks.map(t=>[t.name,t.type,t.status,t.project,t.link,t.rel])")
    tasks={t[0]:t for t in T()}
    assert tasks["После"][1:]==["работа","todo","p1","w1","post"], tasks["После"]
    assert tasks["До"][1:]==["работа","todo","p1","w1","pre"], tasks["До"]
    def xs(sel): return [round(pg.locator(sel).nth(i).bounding_box()["x"]) for i in range(pg.locator(sel).count())]
    kx=xs('.col[data-board="status"] .card'); assert len(set(kx))==1, kx   # никто не сдвинут
    # Список: тоже без сдвига
    pg.click("#envSeg button:has-text('Список')"); pg.wait_for_timeout(300)
    lx=xs('#view .card, main .card'); assert len(lx)>=3 and len(set(lx))==1, lx
    assert not errs,errs
print("ERRORS: []")
