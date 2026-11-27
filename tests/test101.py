# цепочка до/после: время пре- и пост-задач считается от якоря
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
    g=lambda i:pg.evaluate("i=>byId(i).at",i)
    pg.evaluate("""()=>{S.tasks=[];const m=(id,n,min,o)=>Object.assign(task({name:n,min},{type:'дела',where:'today',ord:S.tasks.length}),{id},o||{});
      S.tasks.push(m('c','Готовка',20,{link:'o',rel:'pre'}),m('o','Обед',30,{at:'15:00'}),m('d','Посуда',10,{link:'o',rel:'post'}));save();render()}""")
    assert (g('c'),g('o'),g('d'))==("14:40","15:00","15:30"),(g('c'),g('d'))
    pg.evaluate("()=>{byId('o').at='16:00';save()}")
    assert (g('c'),g('d'))==("15:40","16:30")   # цепочка поехала вместе
    pg.evaluate("()=>{byId('d').at='17:00';delete byId('d').aa;byId('o').at='15:00';save()}")
    assert (g('c'),g('d'))==("14:40","17:00")   # своё время у задачи не трогается
    pg.evaluate("()=>{byId('o').at='';save()}")
    assert g('c')=="" and g('d')=="17:00"
    assert errs==[],errs
    print("ERRORS:",errs)
