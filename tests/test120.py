# автозапуск по порядку на экране; перенос в новый день (Завтра→Сегодня, со вчера красным); сумма ч:мм в колонке; без тех. надписей
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    # без технических надписей
    assert pg.locator('#again').count()==0 and 'Данные — отдельная копия' not in pg.inner_text('body') and 'Скопировать из беты' not in pg.inner_text('body')
    # порядок рутины: переставили r3 перед r2 → после r1 стартует r3
    run=lambda i:pg.evaluate(f"()=>!!(byId('{i}').tm&&byId('{i}').tm.run)")
    pg.evaluate("""()=>{S.morningOnly=false;S.tasks=[];CORE.show=true;['r1','r2','r3'].forEach((id,i)=>S.tasks.push(Object.assign(task({name:'П'+i,min:5},{type:'дела',where:'today',routine:'morning',ord:i}),{id})));
      const x=S.tasks.splice(2,1)[0];S.tasks.splice(1,0,x);S.day.phase='morning';UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
    pg.evaluate("()=>complete(byId('r1'))");pg.wait_for_timeout(200);assert run('r3') and not run('r2')
    # новый день
    pg.evaluate("""()=>{S.tasks=[];S.day.phase='day';const m=(id,w,x)=>S.tasks.push(Object.assign(task({name:id,min:30},Object.assign({type:'дела',where:w,ord:S.tasks.length},x||{})),{id}));
      m('y',  'today');m('tm','tomorrow');m('dt','backlog',{due:dayISO()});m('bk','backlog');m('yd','today',{done:true});
      S.day.iso='2000-01-01';dayRoll();render()}""")
    w=lambda i:pg.evaluate(f"()=>byId('{i}').where")
    assert w('y')=='today' and w('tm')=='today' and w('dt')=='today' and w('bk')=='backlog'
    assert pg.evaluate("()=>[!!byId('y').carry,!!byId('tm').carry,!!byId('yd').carry]")==[True,False,False]
    assert pg.locator('.card[data-cid=y].carry').count()==1 and pg.locator('.card[data-cid=y] .carrytag').count()==1 and pg.locator('.card[data-cid=tm].carry').count()==0
    pg.evaluate("()=>complete(byId('y'))");assert pg.locator('.card[data-cid=y].carry').count()==0
    # сумма в колонке канбана
    pg.evaluate("""()=>{S.tasks=[];UI.sys='работа';UI.env='kanban';[['a','todo',90],['b','todo',45],['c','doing',20]].forEach(([id,st,m],i)=>S.tasks.push(Object.assign(task({name:id,min:m},{type:'работа',status:st,ord:i}),{id})));save();render()}""")
    sums=pg.evaluate("()=>[...document.querySelectorAll('.kb .col h3')].map(h=>[h.dataset.k||'',(h.querySelector('.hsum')||{}).textContent])")
    assert ['2:15'] == [s for _,s in sums if s=='2:15'] and any(s=='0:20' for _,s in sums),sums
    assert errs==[],errs;print("ERRORS:",errs)
