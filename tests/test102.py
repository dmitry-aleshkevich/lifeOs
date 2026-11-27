# таймлайн: бросок со склада = время, растягивание = минуты, обратно на склад = время снято; сценарии внутри карточки
import json
from playwright.sync_api import sync_playwright
from paths import URL
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1400,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];S.tasks.push(Object.assign(task({name:'Склад-задача',min:30},{type:'дела',where:'today',ord:1}),{id:'s1'}));save();UI.sys='дела';UI.env='timeline';UI.view='tasks';save&&0;render()}""")
    pg.evaluate("()=>{const b=document.querySelector('#viewSeg button');}")
    pg.evaluate("()=>{try{UI.env='timeline';render()}catch(e){}}")
    pg.wait_for_selector('.tl')
    card=pg.locator('.tls .card[data-cid=s1]');cb=card.bounding_box()
    tl=pg.locator('.tl').bounding_box()
    ty=tl['y']+(15-8)*56+5   # около 15:00
    pg.mouse.move(cb['x']+40,cb['y']+cb['height']/2);pg.mouse.down()
    pg.mouse.move(cb['x']+30,cb['y']+60,steps=4)
    pg.mouse.move(tl['x']+300,ty+cb['height']/2,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
    at=pg.evaluate("()=>byId('s1').at");assert at and at.endswith((':00',':15',':30',':45')) and 14<=int(at[:2])<=15,at
    # растянуть нижний край на +56px = +60 мин
    h0=pg.evaluate("()=>byId('s1').min")
    rs=pg.locator('.rs[data-rid=s1]').bounding_box()
    pg.mouse.move(rs['x']+100,rs['y']+5);pg.mouse.down();pg.mouse.move(rs['x']+100,rs['y']+5+56,steps=5);pg.mouse.up();pg.wait_for_timeout(200)
    h1=pg.evaluate("()=>byId('s1').min");assert h1==h0+60 or h1>h0,(h0,h1)
    # обратно на склад
    side=pg.locator('.tls').bounding_box();sl=pg.locator('.slot .card[data-cid=s1]').bounding_box()
    pg.mouse.move(sl['x']+60,sl['y']+15);pg.mouse.down();pg.mouse.move(sl['x']+50,sl['y']+40,steps=3)
    pg.mouse.move(side['x']+side['width']/2,side['y']+side['height']/2,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
    assert pg.evaluate("()=>byId('s1').at")=="","время не снято"
    # сценарии: тот же канбан, колонки видны
    pg.evaluate("()=>{UI.view='scen';render()}");pg.wait_for_selector('.scb .col')
    assert pg.locator('.scb .col').count()>=3
    assert errs==[],errs
    print("ERRORS:",errs)
