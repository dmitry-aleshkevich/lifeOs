# описание на карточке: 2 строки, «ещё ▾» раскрывает/сворачивает, запоминается; у короткого тега нет
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
LONG="Очень длинное описание задачи. "*30
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""l=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];const m=(id,n,d)=>Object.assign(task({name:n,min:20,desc:d},{type:'дела',where:'today',ord:S.tasks.length}),{id});
      S.tasks.push(m('lg','Длинное',l),m('sh','Короткое','коротко'));UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""",LONG)
    for env in ['list','kanban']:
        pg.evaluate("e=>{UI.env=e;render()}",env);pg.wait_for_timeout(200)
        vis=lambda i:pg.evaluate("i=>{const g=document.querySelector('.dtag[data-did='+i+']');return !!g&&!g.hidden}",i)
        assert vis('lg') and not vis('sh'),env
        h1=pg.evaluate("()=>document.querySelector('.desc[data-did=lg]').getBoundingClientRect().height")
        pg.click('.dtag[data-did=lg]');pg.wait_for_timeout(200)
        h2=pg.evaluate("()=>document.querySelector('.desc[data-did=lg]').getBoundingClientRect().height")
        assert h2>h1+14,(env,h1,h2)
        assert 'свернуть' in pg.inner_text('.dtag[data-did=lg]')
        assert pg.evaluate("()=>JSON.parse(localStorage.getItem('lifeos.v2b.descx')).includes('lg')")
        assert pg.evaluate("()=>!UI.open")          # клик по тегу не раскрывает саму карточку
        pg.click('.dtag[data-did=lg]');pg.wait_for_timeout(200)
        assert pg.evaluate("()=>document.querySelector('.desc[data-did=lg]').getBoundingClientRect().height")<=h1+1
    assert errs==[],errs
    print("ERRORS:",errs)
