# v2b: сценарии — версии, редактор, применение (утро заменяет, вечер добавляется, свой → задача с подзадачами)
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{"morning":[{"id":"m1","name":"Душ","min":10}],"evening":[{"id":"e1","name":"Зубы","min":3}]},
    "mScen":[{"id":"fast","name":"Быстро","icon":"⚡","items":[{"name":"Умыться","min":2}]},{"id":"home","name":"Дома","icon":"🏠","items":[{"name":"Душ","min":10},{"name":"Чай","min":5}]},{"id":"custom","name":"Кастом","icon":"✨","items":[]}]}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.click("#viewSeg button:has-text('Сценарии')")
    assert pg.locator(".scsec[data-sid]").count()==3          # Утро, Вечер, Уборка
    assert pg.locator(".scsec[data-sid=morning] .col[data-ver]").count()==3
    # пункты — обычные задачи типа «сценарий»; в списках и канбане их нет
    assert pg.evaluate("()=>S.tasks.filter(t=>t.type==='сценарий'&&t.sc==='morning'&&t.sv==='home'&&!t.link).map(t=>t.name+t.min).join()")=="Душ10,Чай5"
    assert pg.locator(".scsec[data-sid=morning] .col[data-ver=home] h3 .cnt").inner_text()=="15 мин"
    # новая задача в колонке, до/после через «+» карточки, как в Делах
    pg.click(".scsec[data-sid=morning] .col[data-ver=home] [data-a=addtask]");pg.keyboard.type("Зарядка");pg.keyboard.press("Enter");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>S.tasks.some(t=>t.type==='сценарий'&&t.sv==='home'&&t.name==='Зарядка')")
    cid=pg.evaluate("()=>S.tasks.find(t=>t.type==='сценарий'&&t.name==='Зарядка').id")
    pg.hover(f".card[data-cid='{cid}']");pg.click(f".card[data-cid='{cid}'] .pl-bot");pg.wait_for_timeout(200);pg.keyboard.type("Планка 5м");pg.keyboard.press("Enter");pg.wait_for_timeout(100)
    pg.click(".scsec[data-sid=morning] .col[data-ver=home] [data-a=apply]")
    assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&!t.link).map(t=>t.name).join()")=="Душ,Чай,Зарядка"
    assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&t.link).length")==1
    # вечер добавляется вниз, не заменяя
    n0=pg.evaluate("()=>S.tasks.filter(t=>t.routine==='evening'&&!t.link).length")
    pg.click(".scsec[data-sid=evening] .col >> nth=0 >> [data-a=apply]");assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='evening'&&!t.link).length")>n0
    # свой сценарий: набор задач в «Сегодня», без общего родителя
    pg.click(".scsec[data-sid=t-clean] .col >> nth=0 >> [data-a=apply]")
    assert pg.evaluate("()=>['Кухня','Комната','Одежда'].every(n=>S.tasks.some(t=>t.name===n&&t.type==='дела'&&t.where==='today'&&!t.routine))")
    # новая версия копирует задачи, удаление версии убирает и задачи
    pg.click(".scsec[data-sid=evening] [data-a=addver]");assert pg.locator(".scsec[data-sid=evening] .col").count()==2
    assert pg.evaluate("()=>S.tasks.filter(t=>t.type==='сценарий'&&t.sc==='evening').length")>=2
    pg.click(".scsec[data-sid=evening] .col >> nth=1 >> [data-a=delver]");assert pg.locator(".scsec[data-sid=evening] .col").count()==1
    # перетаскивание задачи в другую версию
    pg.locator(".scsec[data-sid=morning] .col[data-ver=home] .card .nm >> nth=0").scroll_into_view_if_needed();pg.evaluate("()=>scrollBy(0,-150)");pg.wait_for_timeout(100)
    a=pg.locator(".scsec[data-sid=morning] .col[data-ver=home] .card .nm >> nth=0").bounding_box();t2=pg.locator(".scsec[data-sid=morning] .col[data-ver=fast]").bounding_box()
    pg.mouse.move(a["x"]+20,a["y"]+10);pg.mouse.down();pg.mouse.move(a["x"]+40,a["y"]+40,steps=4);pg.mouse.move(t2["x"]+t2["width"]/2,t2["y"]+60,steps=8);pg.mouse.up();pg.wait_for_timeout(150)
    assert pg.evaluate("()=>S.tasks.some(t=>t.type==='сценарий'&&t.name==='Душ'&&t.sv==='fast')")
    # подсказка в «Новой задаче»
    pg.click("#viewSeg button:has-text('Дела')");pg.fill(".qa[data-pos=top] input","Убо")
    assert pg.locator(".qsug .qs").count()==1
    pg.press(".qa[data-pos=top] input","Enter")
    assert pg.evaluate("()=>S.tasks.filter(t=>t.name==='Кухня'&&t.type==='дела').length")==2
    # Ctrl+Enter — обычная задача
    pg.fill(".qa[data-pos=top] input","Убор");pg.press(".qa[data-pos=top] input","Control+Enter")
    assert pg.evaluate("()=>S.tasks.some(t=>t.name==='Убор'&&t.type==='дела')")
    # выбор версии на утреннем экране
    pg.evaluate("()=>{S.morningOnly=true;S.day.phase='morning';render()}")
    assert pg.locator("#scchips [data-ver]").count()==3
    pg.click("#scchips [data-ver=fast]");assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&!t.link).map(t=>t.name).join()").startswith("Умыться")
    assert errs==[],errs
    print("ERRORS:",errs)
