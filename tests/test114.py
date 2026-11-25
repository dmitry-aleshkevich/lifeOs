# плавающее окно «Дальше / Вечер»: отсчёт до ближайшей задачи, овертайм, вечер до полуночи, «–» сворачивает, телефон — полоска
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
def setup(pg):
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{const d=new Date();d.setHours(21,21,0,0);window.__off=d.getTime()-Date.now();
      S.morningOnly=false;S.day.phase='day';S.tasks=[];
      S.tasks.push(Object.assign(task({name:'Свести бюджет',min:30,at:'22:00'},{type:'дела',where:'today',ord:0}),{id:'b'}),
                   Object.assign(task({name:'Умыться',min:5},{type:'дела',routine:'evening',where:'today',ord:1}),{id:'e1'}));
      DNB.min=false;UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));setup(pg)
    pg.wait_for_selector('#dnb:not([hidden])')
    t=lambda sel:pg.inner_text('#dnb '+sel)
    assert 'Свести бюджет' in t('.rn .dl') and t('.rn .dt').startswith(('38:','39:')),(t('.rn .dl'),t('.rn .dt'))
    assert t('.re .dt').startswith('2:'),t('.re .dt')
    assert pg.locator('#evb').count()==1 and 'ещё 1' in t('.re .ds')
    # тикает
    a=t('.rn .dt');pg.wait_for_timeout(2200);assert t('.rn .dt')!=a
    # опоздание: задача на 21:00, сейчас 21:21 → красное, плюс
    pg.evaluate("()=>{byId('b').at='21:00';render()}")
    assert t('.rn .dt').startswith('+21:') and 'Опоздание' in t('.rn .dl') and pg.evaluate("()=>document.querySelector('#dnb .rn').classList.contains('late')")
    # вечер за час до полуночи краснеет
    pg.evaluate("()=>{const d=new Date();d.setHours(23,10,0,0);window.__off=d.getTime()-Date.now();render()}")
    assert pg.evaluate("()=>document.getElementById('dnb').classList.contains('late')")
    # свернуть «–» → пилюля, помнится; клик — развернуть
    pg.click('#dnb .dx');assert pg.evaluate("()=>document.getElementById('dnb').classList.contains('min')")
    assert pg.is_visible('#dnb .dm') and not pg.is_visible('#dnb .rn')
    assert pg.evaluate("()=>JSON.parse(localStorage.getItem('lifeos.v2b.dnb')).min")==True
    pg.click('#dnb');assert not pg.evaluate("()=>document.getElementById('dnb').classList.contains('min')")
    # «Начать вечер» из окна
    pg.click('#evb');pg.wait_for_timeout(200);assert pg.evaluate("()=>S.day.phase")=="evening"
    # на экранах не про задачи и при закрытом дне окна нет
    pg.evaluate("()=>{S.day.phase='day';UI.view='habits';render()}");assert not pg.is_visible('#dnb')
    pg.evaluate("()=>{UI.view='tasks';S.day.phase='closed';render()}");assert not pg.is_visible('#dnb')
    # телефон: полоска сверху на всю ширину, контент сдвинут
    pg2=b.new_context(viewport=dict(width=390,height=800),is_mobile=True,has_touch=True).new_page();pg2.on("pageerror",lambda e:errs.append(str(e)));setup(pg2)
    pg2.wait_for_selector('#dnb:not([hidden])')
    r=pg2.evaluate("()=>{const r=document.getElementById('dnb').getBoundingClientRect();return [r.left,r.right,r.top,r.bottom,parseFloat(document.body.style.paddingTop)||0,innerWidth]}")
    assert r[0]<=12 and r[1]>=r[5]-12 and r[2]<=14 and r[4]>=r[3]-2,r
    assert errs==[],errs
    print("ERRORS:",errs)
