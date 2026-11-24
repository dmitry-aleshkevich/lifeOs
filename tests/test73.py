# v2: «+» сверху/снизу (до и после без сворачивания), перетаскивание порядка, время падает в список после выбора, итоговое время выполненной
import sys, json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[{"id":"a","name":"Задача А","where":"today","min":10},{"id":"b","name":"Задача Б","where":"today","min":20},
             {"id":"c","name":"Задача В","where":"today","min":30}],
    "routines":{},"work":{"tasks":[],"projects":[]},"projects":[]}
def S(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")
def order(pg): return [t["id"] for t in S(pg) if t["id"] in "abc"]
def T(pg,i): return next(t for t in S(pg) if t["id"]==i)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=900)); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_timeout(400)
    cardB=lambda: pg.locator('.card:has-text("Задача Б")').first
    # «+» над и под карточкой: сначала «до», потом без сворачивания «после»
    cardB().hover(); cardB().locator(".pl-top").click(); pg.fill(".card .subqa.pre .sub-new","До Б"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert any(t["name"]=="До Б" and t["rel"]=="pre" and t["link"]=="b" for t in S(pg))
    cardB().hover(); cardB().locator(".pl-bot").click(); pg.fill(".card .subqa.post .sub-new","После Б"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert any(t["name"]=="После Б" and t["rel"]=="post" and t["link"]=="b" for t in S(pg))
    texts=pg.locator(".card .nm").all_inner_texts(); assert texts.index("До Б")<texts.index("Задача Б")<texts.index("После Б"), texts
    pg.keyboard.press("Escape")
    # перетаскивание: А вниз под В
    a=pg.locator('.card:has-text("Задача А")').first.bounding_box(); c=pg.locator('.card:has-text("Задача В")').first.bounding_box()
    pg.mouse.move(a["x"]+400,a["y"]+a["height"]/2); pg.mouse.down(); pg.mouse.move(a["x"]+400,a["y"]+a["height"]/2+30,steps=5)
    pg.mouse.move(a["x"]+400,c["y"]+c["height"]-4,steps=10); pg.wait_for_timeout(100); assert pg.is_visible(".dropline")
    pg.mouse.up(); pg.wait_for_timeout(300)
    assert order(pg)==["b","c","a"], order(pg)
    # Cmd+Z возвращает порядок
    pg.keyboard.press("Control+z"); pg.wait_for_timeout(300); assert order(pg)==["a","b","c"], order(pg)
    # простой клик по названию после drag-логики всё ещё правит текст
    pg.locator('.card:has-text("Задача В") .nm').first.click(); assert pg.is_visible(".nmi"); pg.keyboard.press("Escape")
    # текст + выбор времени = задача сразу в списке
    pg.fill('.qa[data-pos="top"] input',"Сразу в список"); pg.click('.qa[data-pos="top"] .qp',button="right"); pg.click('.pop button:has-text("15 мин")'); pg.wait_for_timeout(300)
    t=[x for x in S(pg) if x["name"]=="Сразу в список"]; assert t and t[0]["min"]==15 and not t[0]["tm"], t
    # итоговое время выполненной (идёт таймер, отметили готово)
    pg.locator('.mins[data-tid="a"]').click(); pg.wait_for_timeout(500)
    pg.evaluate("window.__off=(window.__off||0)+125000"); pg.wait_for_timeout(700)
    pg.locator('.card:has-text("Задача А") .ck').click(); pg.wait_for_timeout(400)
    txt=pg.locator('.card.done:has-text("Задача А") .done-t').inner_text(); assert txt.startswith("2:0") and "из 10 мин" in txt, txt
    assert "early" in pg.locator('.card.done:has-text("Задача А") .done-t').get_attribute("class")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
