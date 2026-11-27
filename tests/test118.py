# кнопка запущенного таймера: значок ⏸ — пауза/продолжить, остальное (время) — задача выполнена
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];CORE.show=false;for(const i of ['x','y'])S.tasks.push(Object.assign(task({name:'Т'+i,min:25},{type:'дела',where:'today',ord:S.tasks.length}),{id:i}));UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
    pill=lambda i:pg.locator(f'.card[data-cid={i}] .mins').first
    pill('x').click();pg.wait_for_timeout(200)           # не запущена → старт
    assert pg.evaluate("()=>!!(byId('x').tm&&byId('x').tm.run)")
    assert pill('x').locator('.pi').count()==1 and pill('x').locator('.pt').count()==1
    pill('x').locator('.pi').click();pg.wait_for_timeout(150)   # значок → пауза
    assert pg.evaluate("()=>!!byId('x').tm&&!byId('x').tm.run&&!byId('x').done")
    pill('x').locator('.pi').click();pg.wait_for_timeout(150)   # значок → продолжить
    assert pg.evaluate("()=>byId('x').tm.run")
    pg.wait_for_timeout(1200);assert pg.evaluate("()=>!byId('x').done")   # перерисовка таймером не ломает
    pill('x').locator('.pt').click();pg.wait_for_timeout(200)   # время → готово
    assert pg.evaluate("()=>byId('x').done&&!byId('x').tm"),pg.evaluate("()=>JSON.stringify(byId('x'))")
    # на паузе клик по времени тоже завершает
    pill('y').click();pg.wait_for_timeout(100);pill('y').locator('.pi').click();pg.wait_for_timeout(100)
    pill('y').locator('.pt').click();pg.wait_for_timeout(150);assert pg.evaluate("()=>byId('y').done")
    assert errs==[],errs;print("ERRORS:",errs)
