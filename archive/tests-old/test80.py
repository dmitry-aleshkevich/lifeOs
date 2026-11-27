# v2: раскрытая карточка — описание, чек-лист, подвал с датой/временем (серым) и кнопка-календарик; на свёрнутой времени нет
import json,datetime
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Задача","where":"today"}],"routines":{},"projects":[],"work":{"projects":[],"tasks":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    c=pg.locator('.card[data-cid="a"]'); c.click(position=dict(x=330,y=6)); pg.wait_for_timeout(200)
    assert pg.locator(".panel .ptime").count()==0 and pg.locator(".panel .pdate").count()==0   # поля спрятаны
    btn=pg.locator(".panel .dtbtn"); assert btn.count()==1 and "set" not in btn.get_attribute("class")
    # порядок: описание, чек-лист, подвал
    ys=[pg.locator(f".panel {s}").first.bounding_box()["y"] for s in (".pdesc",".cl-new",".pfoot")]; assert ys==sorted(ys),ys
    btn.click(); pg.fill(".panel .ptime","18:10")
    tm=(datetime.date.today()+datetime.timedelta(days=1)).isoformat(); pg.fill(".panel .pdate",tm); pg.wait_for_timeout(200)
    assert "завтра · 18:10" in pg.locator(".panel .dtbtn").inner_text(), pg.locator(".panel .dtbtn").inner_text()
    # свёрнутая: времени на карточке нет
    pg.mouse.click(5,800); pg.wait_for_timeout(200)
    assert pg.locator('.card[data-cid="a"] .at').count()==0
    assert not errs,errs
print("ERRORS: []")
