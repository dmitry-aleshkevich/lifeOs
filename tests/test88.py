# v2: окно «Проекты» — порядок перетаскиванием, глазок скрывает блок и архивирует задачи, «показать» возвращает
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(400)
    pg.evaluate("""()=>{S.seedMorning=true;S.projects=[{id:'p1',name:'Первый',type:'дела',color:'blue'},{id:'p2',name:'Второй',type:'дела',color:'green'},{id:'p3',name:'Третий',type:'дела',color:'red'},{id:'w1',name:'Рабочий',type:'работа',color:'blue'}];
      S.tasks=[Object.assign(task({name:'Т1'},{project:'p2',where:'today'}),{})];save();UI.env='kanban';render()}""")
    keys=lambda: pg.evaluate("[...document.querySelectorAll('.col[data-board=project]')].map(c=>c.dataset.key).filter(Boolean)")
    assert keys()==["p1","p2","p3"],keys()
    pg.click("#pbtn");assert pg.locator(".prow").count()==3
    g=pg.locator('.prow[data-pid="p1"] .pg').bounding_box();t=pg.locator('.prow[data-pid="p3"]').bounding_box()
    pg.mouse.move(g["x"]+8,g["y"]+8);pg.mouse.down();pg.mouse.move(g["x"]+8,t["y"]+t["height"]-2,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
    assert keys()==["p2","p3","p1"],keys()
    assert pg.evaluate("S.projects.filter(p=>p.type==='работа').length")==1
    # скрыть второй: блок и задачи в архиве
    pg.click('.prow[data-pid="p2"] .pe');pg.wait_for_timeout(200)
    assert keys()==["p3","p1"],keys() and pg.evaluate("S.tasks[0].archived")==True
    assert pg.locator('.card:has-text("Т1")').count()==0
    pg.click('.prow[data-pid="p2"] .pe');pg.wait_for_timeout(200)
    assert "p2" in keys() and pg.evaluate("S.tasks[0].archived")==False and pg.locator('.card:has-text("Т1")').count()>=1
    pg.click("text=Скрыть все");assert keys()==[];pg.click("text=Показать все");assert len(keys())==3
    pg.keyboard.press("Escape");assert pg.locator("#ppop").count()==0
    assert errs==[],errs
    print("ERRORS:",errs)
