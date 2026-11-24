# v2: Канбан — перетаскивание блоков проектов: ручка видна, порядок меняется с первого раза, текст не выделяется
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело А","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(400)
    pg.evaluate("()=>{S.seedMorning=true;S.projects=[{id:'p1',name:'Первый',type:'дела',color:'blue'},{id:'p2',name:'Второй',type:'дела',color:'green'},{id:'p3',name:'Третий',type:'дела',color:'red'}];save();UI.env='kanban';render()}")
    pg.wait_for_timeout(300)
    keys=lambda: pg.evaluate("[...document.querySelectorAll('.col[data-board=project]')].map(c=>c.dataset.key).filter(Boolean)")
    assert keys()==["p1","p2","p3"],keys()
    assert pg.locator(".pdrag .grip").count()>=3
    h1=pg.locator('.col[data-key="p1"] h3').bounding_box();h3=pg.locator('.col[data-key="p3"] h3').bounding_box()
    pg.mouse.move(h1["x"]+40,h1["y"]+h1["height"]/2);pg.mouse.down();pg.mouse.move(h1["x"]+120,h1["y"]+10,steps=4)
    assert pg.evaluate("document.body.classList.contains('drag')")
    pg.mouse.move(h3["x"]+60,h3["y"]+h3["height"]/2,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
    assert keys()==["p2","p3","p1"],keys()
    assert pg.evaluate("getSelection().toString()")=="" and not pg.evaluate("document.body.classList.contains('drag')")
    assert errs==[],errs
    print("ERRORS:",errs)
