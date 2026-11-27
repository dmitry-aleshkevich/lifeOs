# таймлайн: пересекающиеся задачи встают рядом (без наложения); мобильная вёрстка без горизонтального скролла
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=390,height=844),is_mobile=True,has_touch=True).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];const m=(id,n,min,at)=>Object.assign(task({name:n,min,at},{type:'дела',where:'today',ord:S.tasks.length}),{id});
      S.tasks.push(m('t1','Зал',60,'15:00'),m('t2','Обед',30,'15:00'),m('t3','Посуда',10,'15:30'),m('t4','Отдельно',30,'19:00'));UI.sys='дела';UI.env='timeline';UI.view='tasks';save();render()}""")
    pg.wait_for_selector('.tl .slot')
    r=pg.evaluate("""()=>{const q=(id)=>document.querySelector('.slot [data-cid='+id+']').closest('.slot').getBoundingClientRect();return ['t1','t2','t3','t4'].map(i=>{const r=q(i);return [r.left,r.right,r.top,r.bottom]})}""")
    ov=lambda a,b:a[0]<b[1]-1 and b[0]<a[1]-1 and a[2]<b[3]-1 and b[2]<a[3]-1
    assert not any(ov(r[i],r[j]) for i in range(4) for j in range(i+1,4)),r
    w=pg.evaluate("()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]");assert w[0]<=w[1],w
    for env in ['list','kanban','calendar']:
        pg.evaluate("e=>{UI.env=e;render()}",env);pg.wait_for_timeout(150)
        w=pg.evaluate("()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]");assert w[0]<=w[1],(env,w)
    assert errs==[],errs
    print("ERRORS:",errs)
