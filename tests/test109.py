# серый счётчик «через N мин» слева от кнопки времени; прошло — «опоздание»; не показывается где не нужно
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{const d=new Date();d.setHours(15,0,5,0);window.__off=d.getTime()-Date.now();
      S.morningOnly=false;S.day.phase='day';S.tasks=[];
      const m=(id,n,o)=>Object.assign(task({name:n,min:20},{type:'дела',where:'today',ord:S.tasks.length}),{id},o||{});
      S.tasks.push(m('f','Бюджет',{at:'15:39'}),m('l','Поздняя',{at:'14:50'}),m('far','Далеко',{at:'20:00'}),m('dn','Сделана',{at:'15:30',done:true}),
        m('tm','Идёт',{at:'15:20',tm:{run:true,sw:false,t0:Date.now()}}),m('tmr','Завтра',{at:'15:30',due:dayOf(NOW()+864e5),where:'tomorrow'}),m('no','Без времени'));
      GF.tomorrow=true;UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
    pg.wait_for_selector('.cdn')
    g=lambda i:pg.evaluate("i=>{const n=document.querySelector('[data-cid='+i+'] .cdn');return n?[n.textContent,n.classList.contains('late')]:null}",i)
    f=g('f');assert f and f[0] in("через 39 мин","через 40 мин") and not f[1],f
    l=g('l');assert l and l[0].startswith("опоздание 9 мин") or l[0].startswith("опоздание 10 мин"),l
    assert l[1]
    for i in ['far','dn','tm','tmr','no']:assert g(i) is None,(i,g(i))
    # канбан: счётчик помещается (в нижней строке карточки); таймлайн — нет
    pg.evaluate("()=>{UI.env='kanban';render()}");pg.wait_for_timeout(200)
    k=pg.evaluate("()=>{const n=document.querySelector('.kb [data-cid=f] .cdn');if(!n)return null;const r=n.getBoundingClientRect(),c=n.closest('.card').getBoundingClientRect();return r.right<=c.right+1&&r.left>=c.left}");assert k,k
    pg.evaluate("()=>{UI.env='timeline';render()}");pg.wait_for_timeout(200)
    assert pg.evaluate("()=>document.querySelectorAll('.tl .cdn').length")==0
    # тикает: через 20 минут «через 39» → «через 19»
    pg.evaluate("()=>{UI.env='list';render();window.__off+=20*60000;refreshCdn()}")
    t=pg.evaluate("()=>document.querySelector('[data-cid=f] .cdn').textContent");assert t in("через 19 мин","через 20 мин"),t
    assert errs==[],errs
    print("ERRORS:",errs)
