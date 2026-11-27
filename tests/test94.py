# v2b: шаблоны дня (ядро + фильтр LifeCore), привычки с редактором, итоги
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]},"habits":[{"id":"smoke","name":"Без сигарет"},{"id":"gym","name":"Зал","days":[1,3,5]}],"habitLog":{}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    # среда 25.11.2026 12:00 → обед-a, ужин (зал только пн/ср/пт: среда → зал есть, обед-b)
    pg.evaluate("()=>{window.__off=new Date(2026,10,25,12).getTime()-Date.now();S.tasks=S.tasks.filter(t=>!t.tpl);S.planGen='';render()}");pg.wait_for_timeout(200)
    names=pg.evaluate("()=>S.tasks.filter(t=>t.tpl&&!t.link).map(t=>t.name).join('|')")
    assert names=="Зал 🏋️|Обед 🍽️|Ужин 🍽️",names   # среда: зал + обед-b + ужин
    assert pg.evaluate("()=>S.tasks.filter(t=>t.tpl&&t.link).length")==4   # Готовка и Посуда на обед и ужин
    assert pg.locator(".card[data-cid]:has-text('ядро')").count()==3
    # фильтр LifeCore скрывает ядро
    pg.click("#cbtn");assert pg.locator(".card:has-text('ядро')").count()==0 and pg.locator(".card[data-cid=a]").count()==1
    pg.click("#cbtn");assert pg.locator(".card:has-text('ядро')").count()==3
    # на следующий день блоки пересоздаются без дублей, невыполненные вчерашние убираются
    pg.evaluate("()=>{window.__off+=864e5;render()}");pg.wait_for_timeout(200)
    assert pg.evaluate("()=>S.tasks.filter(t=>t.tpl&&!t.link).map(t=>t.tplDay).every(d=>d==='2026-11-26')")
    assert pg.evaluate("()=>S.tasks.filter(t=>t.tpl&&!t.link).length")==2   # четверг: обед-a + ужин
    # привычки
    pg.click("#viewSeg button:has-text('Привычки')")
    assert pg.locator(".hwrap").count()==2
    today=pg.evaluate("()=>dayISO()")
    pg.click(f".hwrap[data-hid=smoke] .dot[data-d='{today}']")
    assert pg.evaluate("()=>habitDone('smoke',dayISO())")
    # редактор: добавить, переименовать, дни, порядок, удалить
    pg.click("#habedit");pg.fill("#newhab","Читать");pg.press("#newhab","Enter")
    assert pg.evaluate("()=>S.habits.map(h=>h.name).join()")=="Без сигарет,Зал,Читать"
    pg.locator(".hwrap").nth(2).locator(".hin").first.fill("Читать 20 мин");pg.keyboard.press("Tab")
    pg.locator(".hwrap").nth(2).locator("[data-day='0']").click()
    assert pg.evaluate("()=>S.habits[2].name")=="Читать 20 мин" and 0 not in pg.evaluate("()=>S.habits[2].days")
    pg.locator(".hwrap").nth(2).locator(".ib",has_text="↑").click()
    assert pg.evaluate("()=>S.habits[1].name")=="Читать 20 мин"
    pg.locator(".hwrap").nth(1).locator(".ib.danger").click();pg.locator(".hwrap").nth(1).locator(".ib.danger").click()
    assert pg.evaluate("()=>S.habits.map(h=>h.name).join()")=="Без сигарет,Зал"
    pg.click("#habedit")
    # итоги и шаблоны открываются, шаблон редактируется
    pg.evaluate("()=>{logT({project:'',routine:''},600000);render()}")
    pg.click("#viewSeg button:has-text('Итоги')");assert pg.locator(".tile").count()==4 and pg.locator(".brow").count()>=3
    pg.click("#wprev");assert pg.locator("#wnext").is_enabled()
    pg.click("#viewSeg button:has-text('Сценарии')");pg.click("#scenTabs button:has-text('Шаблоны')");assert pg.locator(".plb").count()==4
    pg.click("#pladd");assert pg.locator(".plb").count()==5
    pg.click("#viewSeg button:has-text('Дела')");assert pg.locator("#envSeg").is_visible()
    assert errs==[],errs
    print("ERRORS:",errs)
