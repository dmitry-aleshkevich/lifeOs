# v2: свёртка по клику в пустое место, ПКМ на плашке (длительность / +время), подзадачи с кнопкой времени и цепочкой, звук после перезагрузки, чек-лист
import sys, json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[{"id":"a","name":"Задача А","where":"today","min":10},{"id":"b","name":"Задача Б","where":"today","min":0}],
    "routines":{},"work":{"tasks":[],"projects":[]},"projects":[]}
def S(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")
def T(pg,i): return next(t for t in S(pg) if t["id"]==i)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=900)); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_timeout(400)
    # 1. свёртка по пустому месту
    pg.locator('.card:has-text("Задача А")').first.locator(".txt").click(position=dict(x=300,y=10)); assert pg.locator(".panel").count()==1
    pg.mouse.click(5,880); pg.wait_for_timeout(200); assert pg.locator(".panel").count()==0, "не свернулась"
    # клик внутри панели не сворачивает
    pg.locator('.card:has-text("Задача А")').first.locator(".txt").click(position=dict(x=300,y=10))
    pg.locator('.panel .chipb[data-min="25"]').click(); pg.wait_for_timeout(200); assert pg.locator(".panel").count()==1
    # 2. ПКМ без таймера: настройка длительности; с таймером: добавление времени
    pg.mouse.click(5,880); pg.wait_for_timeout(200)
    pg.locator('.mins[data-tid="a"]').click(button="right")
    assert pg.is_visible('.pop button:has-text("30 мин")') and not pg.is_visible('.pop button:has-text("+ 5 мин")')
    pg.click('.pop button:has-text("30 мин")'); pg.wait_for_timeout(200); assert T(pg,"a")["min"]==30 and not T(pg,"a")["tm"]
    pg.locator('.mins[data-tid="a"]').click(); pg.wait_for_timeout(600)
    pg.locator('.mins[data-tid="a"]').click(button="right"); assert pg.is_visible('.pop button:has-text("+ 5 мин")') and not pg.is_visible('.pop button:has-text("45 мин")')
    pg.keyboard.press("Escape"); pg.mouse.click(5,880)
    # 3. подзадачи: кнопка времени справа, Enter — сразу следующая
    pg.locator('.card:has-text("Задача А")').first.locator(".txt").click(position=dict(x=300,y=10))
    pg.click('.panel .chipb[data-rel="post"]'); assert pg.is_visible(".panel .subqa .qp")
    pg.fill(".panel .sub-new","Раз"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert pg.is_visible(".panel .sub-new") and pg.evaluate("document.activeElement.className")=="sub-new", "поле не осталось для следующей"
    pg.click(".panel .subqa .qp",button="right"); pg.click('.pop button:has-text("15 мин")')
    pg.fill(".panel .sub-new","Два"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    subs=[t for t in S(pg) if t["link"]=="a"]; assert [x["name"] for x in subs]==["Раз","Два"] and subs[1]["min"]==15, subs
    # pre-подзадача тоже
    pg.locator(".panel .sub-new").press("Escape"); pg.wait_for_timeout(200)
    pg.click('.panel .chipb[data-rel="pre"]'); assert pg.is_visible(".panel .subqa .qp")
    pg.locator(".panel .sub-new").press("Escape"); pg.wait_for_timeout(200); assert pg.locator(".panel").count()==1, "Esc в поле подзадачи закрыл карточку"
    # 5. чек-лист: отмеченный пункт серый, зачёркнутый, галочка зелёная
    pg.fill(".panel .cl-new","Пункт"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.locator(".panel .cli input[type=checkbox]").first.check(); pg.wait_for_timeout(200)
    assert pg.locator(".panel .cli.done").count()==1
    assert "line-through" in pg.eval_on_selector(".panel .cli.done .clt","e=>getComputedStyle(e).textDecorationLine")
    # 4. звук: таймер идёт, страницу перезагрузили, первый же жест будит звук
    pg.reload(); pg.wait_for_timeout(500)
    assert pg.evaluate("window.__ac()") in (None,"suspended")
    pg.mouse.click(5,880); pg.wait_for_timeout(500); st=pg.evaluate("window.__ac()"); assert st=="running", st
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
