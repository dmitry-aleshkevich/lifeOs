# окружение помнится отдельно для каждого вида: Дела — список, Работа — канбан
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
    env=lambda:pg.evaluate("()=>UI.env")
    tab=lambda n:pg.locator('#viewSeg button',has_text=n).first.click()
    tab("Работа");pg.click('#envSeg button[title*="Канбан"], #envSeg button:has(.sr:text("Канбан"))');assert env()=="kanban"
    tab("Дела");assert env()=="list",env()
    tab("Работа");assert env()=="kanban",env()
    pg.evaluate("()=>{const e=[...document.querySelectorAll('#envSeg button')].find(b=>b.textContent.includes('Таймлайн'));e.click()}");assert env()=="timeline"
    tab("Дела");assert env()=="list";tab("Работа");assert env()=="timeline"
    pg.reload();pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    tab("Дела");assert env()=="list",env();tab("Работа");assert env()=="timeline",env()
    assert errs==[],errs;print("ERRORS:",errs)
