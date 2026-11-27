# части дня: чипы в поповере и слова «утром/вечером» в тексте
import json
from playwright.sync_api import sync_playwright
from paths import URL
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("()=>{S.morningOnly=false;S.day.phase='day';UI.sys='дела';UI.env='list';UI.view='tasks';UI.open='a';UI.dt='a';UI.dtd=null;save();render()}")
    pg.wait_for_selector('.dtp-parts')
    pg.click('.dtp-parts [data-part=e]');pg.wait_for_timeout(100)
    assert pg.evaluate("()=>UI.dtd.at")=="19:00"
    pg.click('.dtp-ap');pg.wait_for_timeout(150)
    assert pg.evaluate("()=>byId('a').at")=="19:00"
    r=pg.evaluate("()=>[parseWhen('Зарядка завтра утром'),parseWhen('Чай днём'),parseWhen('Кино вечером в 21:00 ')]")
    assert r[0]['at']=="08:00" and r[0]['due'] and r[0]['rest']=="Зарядка",r
    assert r[1]['at']=="13:00",r
    assert r[2]['at']=="19:00" or r[2]['at']=="21:00",r
    pg.evaluate("()=>{S.parts={e:'20:30'};}");assert pg.evaluate("()=>parseWhen('Ужин вечером')['at']")=="20:30"
    assert errs==[],errs
    print("ERRORS:",errs)
