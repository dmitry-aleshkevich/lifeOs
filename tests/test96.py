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
    assert pg.locator(".xc[data-sid]").count()==3          # Утро, Вечер, Уборка
    assert pg.locator(".xc[data-sid=morning] .col[data-ver]").count()==3
    # редактор: пункт с чек-листом, версия, применение к утру
    pg.fill(".xc[data-sid=morning] .col[data-ver=home] [data-add]","Зарядка 15м");pg.press(".xc[data-sid=morning] .col[data-ver=home] [data-add]","Enter")
    assert pg.evaluate("()=>S.scen[0].versions.find(v=>v.id==='home').items.map(i=>i.name+i.min).join()")=="Душ10,Чай5,Зарядка15"
    pg.locator(".xc[data-sid=morning] .col[data-ver=home] .scit").nth(2).locator("details summary").click()
    pg.locator(".xc[data-sid=morning] .col[data-ver=home] .scit").nth(2).locator("textarea").fill("Отжимания\nПресс");pg.keyboard.press("Tab")
    pg.fill(".xc[data-sid=morning] .col[data-ver=home] .scit >> nth=2 >> input[placeholder^='+ после']","Душ 5м");pg.press(".xc[data-sid=morning] .col[data-ver=home] .scit >> nth=2 >> input[placeholder^='+ после']","Enter")
    pg.click(".xc[data-sid=morning] .col[data-ver=home] [data-a=apply]")
    assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&!t.link).map(t=>t.name).join()")=="Душ,Чай,Зарядка"
    assert pg.evaluate("()=>S.tasks.find(t=>t.name==='Зарядка').check.length")==2 and pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&t.link).length")==1
    # вечер добавляется вниз, не заменяя
    pg.click(".xc[data-sid=evening] .col >> nth=0 >> [data-a=apply]");assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='evening'&&!t.link).length")==2
    # свой сценарий → задача с подзадачами в «Сегодня»
    pg.click(".xc[data-sid=t-clean] .col >> nth=0 >> [data-a=apply]")
    assert pg.evaluate("()=>{const p=S.tasks.find(t=>t.name==='Уборка 🧹');return !!p&&S.tasks.filter(t=>t.link===p.id).length===3&&p.where==='today'}")
    pg.click(".xc[data-sid=t-clean] .col >> nth=0 >> [data-a=mode]");pg.click(".xc[data-sid=t-clean] .col >> nth=0 >> [data-a=apply]")
    assert pg.evaluate("()=>S.tasks.filter(t=>t.name==='Уборка 🧹'&&t.check&&t.check.length===3).length")==1
    # новая версия и удаление
    pg.click(".xc[data-sid=evening] [data-a=addver]");assert pg.locator(".xc[data-sid=evening] .col").count()==2
    pg.click(".xc[data-sid=evening] .col >> nth=1 >> [data-a=delver]");assert pg.locator(".xc[data-sid=evening] .col").count()==1
    # выбор версии на утреннем экране
    pg.click("#viewSeg button:has-text('Дела')")
    pg.evaluate("()=>{S.morningOnly=true;S.day.phase='morning';render()}")
    assert pg.locator("#scchips [data-ver]").count()==3
    pg.click("#scchips [data-ver=fast]");assert pg.evaluate("()=>S.tasks.filter(t=>t.routine==='morning'&&!t.link).map(t=>t.name).join()")=="Умыться"
    assert errs==[],errs
    print("ERRORS:",errs)
