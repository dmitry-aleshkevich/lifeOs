# кнопка «Сегодня» рядом с «Фокус»: только сегодняшние задачи; рутины — по LifeCore, не по «Сегодня»
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];const m=(id,n,w)=>Object.assign(task({name:n,min:10},{type:'дела',where:w,ord:S.tasks.length}),{id});
      S.tasks.push(m('t1','Сегодняшняя','today'),m('t2','Завтрашняя','tomorrow'),m('t3','Из дел','backlog'));CORE.show=false;GF.tomorrow=true;GF.backlog=true;
      UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
    vis=lambda:pg.evaluate("()=>[...document.querySelectorAll('#view .card .nm')].map(n=>n.textContent)")
    assert set(vis())>={'Сегодняшняя','Завтрашняя','Из дел'}
    assert pg.is_visible('#tbtn') and pg.is_visible('#fbtn')
    pg.click('#tbtn');pg.wait_for_timeout(150)
    assert vis()==['Сегодняшняя'],vis()
    assert pg.evaluate("()=>document.getElementById('tbtn').classList.contains('on')")
    assert pg.evaluate("()=>[...document.querySelectorAll('#view .ghead.fold')].length")==1
    # LifeCore по-прежнему сам прячет/показывает рутины (не «Сегодня»)
    n0=pg.evaluate("()=>document.querySelectorAll('#view .card').length")
    pg.click('#cbtn');pg.wait_for_timeout(150)
    assert pg.evaluate("()=>CORE.show")==True
    pg.click('#tbtn');pg.wait_for_timeout(150)
    assert 'Завтрашняя' in vis()
    # запоминается
    pg.click('#tbtn');pg.reload();pg.wait_for_selector('#tbtn.on',state='attached')
    # в других окружениях и в «Работе» кнопки нет
    pg.evaluate("()=>{UI.env='kanban';render()}");assert not pg.is_visible('#tbtn')
    pg.evaluate("()=>{UI.env='list';UI.sys='работа';render()}");assert not pg.is_visible('#tbtn')
    assert errs==[],errs
    print("ERRORS:",errs)
