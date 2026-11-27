# таймлайн на телефоне: перетаскивание долгим нажатием (touch-события): со склада на час, по таймлайну, обратно на склад
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
JS_TOUCH="""async ([sel,toSel,dx,dy,hold])=>{
  const src=document.querySelector(sel);const r=src.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;
  const ev=(type,t,px,py)=>t.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,composed:true,pointerId:7,pointerType:'touch',isPrimary:true,clientX:px,clientY:py,button:0,buttons:type==='pointerup'?0:1}));
  ev('pointerdown',src,x,y);await new Promise(r=>setTimeout(r,hold));
  let tx,ty;
  if(toSel){const t=document.querySelector(toSel).getBoundingClientRect();tx=t.left+t.width/2+dx;ty=t.top+dy}else{tx=x+dx;ty=y+dy}
  const N=8;for(let i=1;i<=N;i++){document.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',isPrimary:true,clientX:x+(tx-x)*i/N,clientY:y+(ty-y)*i/N,buttons:1}));await new Promise(r=>setTimeout(r,16))}
  document.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:7,pointerType:'touch',isPrimary:true,clientX:tx,clientY:ty}));
}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=402,height=812),is_mobile=True,has_touch=True).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];const m=(id,n,o)=>Object.assign(task({name:n,min:30},{type:'дела',where:'today',ord:S.tasks.length}),{id},o||{});
      S.tasks.push(m('s1','Склад-задача'),m('t1','На сетке',{at:'11:00'}));UI.sys='дела';UI.env='timeline';UI.view='tasks';save();render()}""")
    pg.wait_for_selector('.tl .slot')
    pg.evaluate("()=>document.querySelector('.tl').scrollIntoView()");pg.wait_for_timeout(200)
    # 1) со склада на сетку: склад ниже сетки — сначала прокрутим так, чтобы были видны оба
    pg.evaluate("()=>window.scrollTo(0,document.querySelector('.tl').getBoundingClientRect().top+scrollY+40)")
    tl=pg.evaluate("()=>{const r=document.querySelector('.tl').getBoundingClientRect();return [r.top,r.bottom]}")
    print("tl",tl)
    # перетаскиваем «На сетке» на 13:00 (вниз на 2 часа = 112px)
    pg.evaluate(JS_TOUCH,['.tl .slot [data-cid=t1]',None,0,112,500]);pg.wait_for_timeout(300)
    at=pg.evaluate("()=>byId('t1').at");print("after move",at)
    assert at in("12:45","13:00","13:15"),at
    # 2) со склада на сетку: склад закреплён сверху, сетка видна под ним
    pg.evaluate("()=>window.scrollTo(0,document.querySelector('.tl').getBoundingClientRect().top+scrollY+300)");pg.wait_for_timeout(250)
    st=pg.evaluate("()=>{const r=document.querySelector('.tls').getBoundingClientRect();return [r.top,r.bottom,getComputedStyle(document.querySelector('.tls')).position]}")
    assert st[2]=="sticky" and 0<=st[0]<=20 and st[1]<420,st
    pg.evaluate(JS_TOUCH,['.tls [data-cid=s1]',None,0,300,500]);pg.wait_for_timeout(300)
    at=pg.evaluate("()=>byId('s1').at");assert at,"со склада на сетку не перетащилось"
    # 3) поля ввода не меньше 16px (иначе iOS приближает страницу)
    pg.evaluate("()=>{UI.env='list';UI.open='s1';render()}");pg.wait_for_timeout(200)
    small=pg.evaluate("()=>[...document.querySelectorAll('input,textarea,select')].filter(n=>!['checkbox','radio','range','color'].includes(n.type)&&parseFloat(getComputedStyle(n).fontSize)<16).map(n=>n.className||n.tagName)")
    assert small==[],small
    pg.click('#fab button >> nth=0');pg.wait_for_timeout(250)
    small=pg.evaluate("()=>[...document.querySelectorAll('.fbpop textarea,.fbpop input')].map(n=>parseFloat(getComputedStyle(n).fontSize))")
    assert small and min(small)>=16,small
    assert errs==[],errs
    print("ERRORS:",errs)
