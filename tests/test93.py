# v2b: календарь — месяц/неделя, склад, перенос на день пишет дату и группу
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Сегодняшняя","where":"today"},{"id":"b","name":"Без даты","where":"backlog"},{"id":"c","name":"С датой","where":"backlog","due":"2026-11-27"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("()=>{window.__off=new Date(2026,10,25,12).getTime()-Date.now();S.tasks=S.tasks.filter(t=>!t.tpl);S.planGen='';UI.env='calendar';render()}")
    assert pg.locator(".caltitle").inner_text()=="Ноябрь 2026"
    assert pg.locator(".day[data-date='2026-11-27'] .dots").get_attribute("data-n")=="1" and pg.locator(".day[data-date='2026-11-27'] .card").count()==0
    pg.hover(".day[data-date='2026-11-27'] .dots");assert "Ноябрь" not in pg.locator("#dpop").inner_text() and pg.locator("#dpop div").count()>=2   # всплывает список дня
    pg.mouse.move(5,5);assert pg.locator("#dpop").count()==0
    pg.click("[data-mode=week]");assert pg.locator(".day[data-date='2026-11-27'] .card[data-cid=c]").count()==1
    assert pg.locator(".day.today").get_attribute("data-date")=="2026-11-25"
    st=pg.locator(".store .card");assert st.count()==2 and st.first.get_attribute("data-cid")=="a"   # сегодняшние первыми
    # перетащить «Без даты» на 28 ноября
    def drag(sel,tsel):
        a=pg.locator(sel).bounding_box();t=pg.locator(tsel).bounding_box()
        pg.mouse.move(a["x"]+60,a["y"]+a["height"]/2);pg.mouse.down();pg.mouse.move(a["x"]+30,a["y"]+30,steps=4);pg.mouse.move(t["x"]+t["width"]/2,t["y"]+t["height"]/2,steps=8);pg.mouse.up();pg.wait_for_timeout(150)
    drag(".store .card[data-cid=b] .nm",".day[data-date='2026-11-28']")
    assert pg.evaluate("()=>byId('b').due")=="2026-11-28" and pg.evaluate("()=>byId('b').where")=="backlog"
    assert pg.locator(".store .card[data-cid=b]").count()==0
    # на завтра → группа «Завтра»; на сегодня → «Сегодня»
    drag(".day[data-date='2026-11-28'] .card[data-cid=b] .nm",".day[data-date='2026-11-26']")
    assert pg.evaluate("()=>byId('b').where")=="tomorrow"
    drag(".day[data-date='2026-11-26'] .card[data-cid=b] .nm",".day[data-date='2026-11-25']")
    assert pg.evaluate("()=>byId('b').where")=="today"
    # обратно на склад — дата снимается
    drag(".day[data-date='2026-11-25'] .card[data-cid=b] .nm",".store")
    assert pg.evaluate("()=>byId('b').due")=="" 
    # неделя и навигация
    assert pg.locator(".day").count()==7 and pg.locator(".caltitle").inner_text()=="23 – 29 ноября"
    pg.click("#calnext");assert pg.locator(".day").first.get_attribute("data-date")=="2026-11-30"
    pg.click("#caltoday");assert pg.locator(".day[data-date='2026-11-25']").count()==1
    pg.click("[data-mode=month]");pg.click("#calnext");assert pg.locator(".caltitle").inner_text()=="Декабрь 2026"
    # «+» на дне создаёт задачу с датой
    pg.click("#caltoday");pg.locator(".day[data-date='2026-11-29']").hover();pg.click(".day[data-date='2026-11-29'] .dadd");pg.keyboard.type("Новая");pg.keyboard.press("Enter");pg.wait_for_timeout(100)

    assert errs==[],errs
    print("ERRORS:",errs)
