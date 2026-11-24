# v2: чек-лист по тегу, перетаскивание задачи на чужой «+» (в подзадачи, между родителями, обратно), стопка скрытых предзадач сверху
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Альфа","where":"today","check":[{"text":"п1","done":False},{"text":"п2","done":True}]},
 {"id":"b","name":"Бета","where":"today"},{"id":"c","name":"Гамма","where":"today"}],"routines":{},"projects":[],"work":{"projects":[],"tasks":[]}}
def T(pg): return {t["id"]:t for t in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")}
def drag(pg,src,dst,steps=12):
    s=pg.locator(src).bounding_box(); d=pg.locator(dst).bounding_box()
    pg.mouse.move(s["x"]+330,s["y"]+6); pg.mouse.down(); pg.mouse.move(s["x"]+300,s["y"]+10,steps=3)
    pg.mouse.move(d["x"]+d["width"]/2,d["y"]+d["height"]/2,steps=steps); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=900,height=1000)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    # чек-лист: тег показывает/скрывает пункты
    assert pg.locator('.card[data-cid="a"] .cklist').count()==0
    pg.locator('.card[data-cid="a"] .cktag').click(); pg.wait_for_timeout(200); assert pg.locator('.card[data-cid="a"] .ckrow').count()==2
    pg.locator('.card[data-cid="a"] .cktag').click(); pg.wait_for_timeout(200); assert pg.locator('.card[data-cid="a"] .cklist').count()==0
    # Гамма → «+» после Альфы
    drag(pg,'.card[data-cid="c"]','.card[data-cid="a"] > .pl-bot')
    t=T(pg); assert t["c"]["link"]=="a" and t["c"]["rel"]=="post", t["c"]
    # подзадачу Гамма → «+» до Беты (другой родитель, пред)
    drag(pg,'.card[data-cid="c"]','.card[data-cid="b"] > .pl-top')
    t=T(pg); assert t["c"]["link"]=="b" and t["c"]["rel"]=="pre", t["c"]
    # скрытая предзадача: стопка сверху
    pg.locator('.card[data-cid="b"] > .pl-top').click(force=True); pg.wait_for_timeout(200)
    assert "stackt" in pg.locator('.card[data-cid="b"]').get_attribute("class")
    # подзадача на канбан — становится самостоятельной
    pg.locator('.card[data-cid="b"] > .pl-top').click(force=True); pg.wait_for_timeout(200)
    pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    s=pg.locator('.card[data-cid="c"]').bounding_box(); col=pg.locator('.col[data-board="status"][data-key="tomorrow"]').bounding_box()
    pg.mouse.move(s["x"]+s["width"]-80,s["y"]+6); pg.mouse.down(); pg.mouse.move(s["x"]+s["width"]-90,s["y"]+12,steps=3)
    pg.mouse.move(col["x"]+col["width"]/2,col["y"]+80,steps=12); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
    t=T(pg); assert t["c"]["link"]=="" and t["c"]["where"]=="tomorrow", t["c"]
    assert not errs,errs
print("ERRORS: []")
