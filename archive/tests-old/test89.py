# v2: Канбан не прыгает влево при добавлении задачи; поля доски по краю страницы; окна багов/заметок внизу и оба видны; окно проектов закрывается кликом мимо
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1500,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(400)
    pg.evaluate("()=>{S.seedMorning=true;S.projects=[%s];save();UI.sys='работа';UI.env='kanban';render()}"%",".join("{id:'p%d',name:'Проект %d',type:'работа',color:'blue'}"%(i,i) for i in range(1,9)))
    pg.wait_for_timeout(300)
    # поле слева = край контента страницы
    first=pg.locator('.col[data-board=project]').first.bounding_box()["x"];h1=pg.locator("h1").bounding_box()["x"]
    assert abs(first-h1)<3,(first,h1)
    # прокрутка вправо + добавление задачи не сбрасывает её
    pg.evaluate("document.querySelectorAll('.kb')[1].scrollLeft=900");pg.wait_for_timeout(400)
    sx=pg.evaluate("document.querySelectorAll('.kb')[1].scrollLeft");assert sx>500,sx
    pg.evaluate("makeTask({name:'Новая'},{project:'p6',status:''});render()");pg.wait_for_timeout(300)
    assert abs(pg.evaluate("document.querySelectorAll('.kb')[1].scrollLeft")-sx)<30
    # кнопка проектов в панели, на одной линии с меню
    yb=pg.locator("#pbtn").bounding_box();ys=pg.locator("#envSeg").bounding_box()
    assert abs((yb["y"]+yb["height"]/2)-(ys["y"]+ys["height"]/2))<3,(yb,ys)
    pg.click("#pbtn");assert pg.locator("#ppop").count()==1
    pg.mouse.click(1300,700);pg.wait_for_timeout(100);assert pg.locator("#ppop").count()==0
    # окна внизу, оба видны
    pg.click('#fab button[data-kind="bug"]');pg.click('#fab button[data-kind="note"]')
    a=pg.locator('.fbpop[data-kind="bug"]').bounding_box();c=pg.locator('.fbpop[data-kind="note"]').bounding_box()
    assert a and c and a["y"]+a["height"]>800 and c["y"]+c["height"]>800 and (a["x"]+a["width"]<=c["x"]+2 or c["x"]+c["width"]<=a["x"]+2)
    assert errs==[],errs
    print("ERRORS:",errs)
