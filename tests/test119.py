# «Готово» → следующая задача стартует сразу: фокус, утро, вечер; «Отмена» снимает запуск
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    run=lambda i:pg.evaluate(f"()=>!!(byId('{i}').tm&&byId('{i}').tm.run)")
    for ph,rk in (("morning","morning"),("evening","evening")):
        pg.evaluate(f"""()=>{{S.morningOnly=false;S.tasks=[];CORE.show=true;['r1','r2','r3'].forEach((id,i)=>S.tasks.push(Object.assign(task({{name:'П'+i,min:5}},{{type:'дела',where:'today',routine:'{rk}',ord:i}}),{{id}})));S.day.phase='{ph}';UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}}""")
        pg.evaluate("()=>complete(byId('r1'))");pg.wait_for_timeout(200)
        assert run('r2') and not run('r3'),ph
        assert pg.is_visible('#toast')
        pg.evaluate("()=>complete(byId('r2'))");pg.wait_for_timeout(200);assert run('r3'),ph
    # отмена
    pg.evaluate("""()=>{S.tasks=[];['r1','r2'].forEach((id,i)=>S.tasks.push(Object.assign(task({name:'П'+i,min:5},{type:'дела',where:'today',routine:'morning',ord:i}),{id})));S.day.phase='morning';save();render()}""")
    pg.evaluate("()=>complete(byId('r1'))");pg.wait_for_timeout(200);assert run('r2')
    pg.click('#toast button');pg.wait_for_timeout(150);assert not run('r2')
    # вне утра/вечера и без фокуса — не стартует
    pg.evaluate("""()=>{S.tasks=[];['r1','r2'].forEach((id,i)=>S.tasks.push(Object.assign(task({name:'Д'+i,min:5},{type:'дела',where:'today',ord:i}),{id})));S.day.phase='day';save();render()}""")
    pg.evaluate("()=>complete(byId('r1'))");pg.wait_for_timeout(150);assert not run('r2')
    assert errs==[],errs;print("ERRORS:",errs)
