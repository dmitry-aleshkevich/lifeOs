# v2: раскрытие карточки, правка полей, чек-лист, подзадачи, удаление + Cmd+Z, быстрый ввод сверху и снизу
import sys, json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[{"id":"a","name":"Задача А","where":"today","min":10},{"id":"b","name":"Задача Б","where":"today","min":20}],
    "routines":{},"work":{"tasks":[],"projects":[]},"projects":[{"id":"home","name":"Дом","color":"orange","kind":"home"}]}
def S(pg): return pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")
def T(pg,i): return next(t for t in S(pg) if t["id"]==i)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=900)); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_timeout(400)
    cardA=lambda: pg.locator('.card:has-text("Задача А")').first
    # раскрытие по клику на карточку; одна открытая
    cardA().locator(".txt").click(position=dict(x=300,y=10)); assert pg.locator(".panel").count()==1
    pg.locator('.card:has-text("Задача Б")').first.locator(".txt").click(position=dict(x=300,y=10)); assert pg.locator(".panel").count()==1
    assert pg.locator('.card.open:has-text("Задача Б")').count()==1
    cardA().locator(".txt").click(position=dict(x=300,y=10))
    # описание, длительность, время, чек-лист
    pg.fill(".panel .pdesc","Купить молоко"); pg.locator(".panel .pdesc").blur(); pg.wait_for_timeout(200)
    assert T(pg,"a")["desc"]=="Купить молоко"
    pg.locator('.panel .chipb[data-min="25"]').click(); pg.wait_for_timeout(200)
    assert T(pg,"a")["min"]==25 and "25 мин" in pg.locator('.mins[data-tid="a"]').inner_text()
    pg.fill(".panel .ptime","09:30"); pg.locator(".panel .ptime").blur(); pg.wait_for_timeout(200); assert T(pg,"a")["at"]=="09:30"
    pg.fill(".panel .cl-new","Пункт 1"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.fill(".panel .cl-new","Пункт 2"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert len(T(pg,"a")["check"])==2
    pg.locator(".panel .cli input[type=checkbox]").first.check(); pg.wait_for_timeout(200)
    assert T(pg,"a")["check"][0]["done"] is True
    # подзадача «после»
    pg.click('.panel .chipb[data-rel="post"]'); pg.fill(".panel .sub-new","Подзадача"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert any(t["link"]=="a" and t["rel"]=="post" for t in S(pg))
    # правка названия кликом по тексту
    pg.locator('.card.open .nm').first.click(); pg.fill(".nmi","Задача А2"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert T(pg,"a")["name"]=="Задача А2"
    # удаление и Cmd+Z
    n0=len(S(pg)); pg.click(".panel .chipb.danger"); pg.wait_for_timeout(200); assert len(S(pg))<n0-1   # родитель + подзадача
    pg.keyboard.press("Control+z"); pg.wait_for_timeout(300); assert len(S(pg))==n0, (len(S(pg)),n0)
    # быстрый ввод: сверху (в начало) и снизу (в конец)
    pg.fill('.qa[data-pos="top"] input',"Мытьё 18:10 15м #дом"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    t=[x for x in S(pg) if x["name"]=="Мытьё"][0]; assert t["at"]=="18:10" and t["min"]==15 and t["project"]=="home", t
    assert pg.locator(".card").first.inner_text().startswith("") and "Мытьё" in pg.locator(".card").first.inner_text()
    pg.fill('.qa[data-pos="bottom"] input',"Последняя"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert S(pg)[-1]["name"]=="Последняя"
    # кнопка ▶ в поле: создаёт и запускает секундомер; с длительностью — отсчёт
    pg.fill('.qa[data-pos="bottom"] input',"Секундомер"); pg.click('.qa[data-pos="bottom"] .qp'); pg.wait_for_timeout(700)
    sw=[x for x in S(pg) if x["name"]=="Секундомер"][0]; assert sw["tm"] and sw["tm"]["sw"] and sw["tm"]["run"], sw
    pg.fill('.qa[data-pos="top"] input',"С отсчётом"); pg.click('.qa[data-pos="top"] .qp',button="right"); pg.click('.pop button:has-text("25 мин")')
    pg.click('.qa[data-pos="top"] .qp'); pg.wait_for_timeout(700)
    cd=[x for x in S(pg) if x["name"]=="С отсчётом"][0]; assert cd["min"]==25 and cd["tm"] and not cd["tm"]["sw"], cd
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
