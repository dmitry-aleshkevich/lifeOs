# закреплённое меню; задача сценария без времени не получает 00:30; теги Утро/Вечер скрывают настройку сценариев
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=700)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    # меню закреплено
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';for(let i=0;i<40;i++)S.tasks.push(Object.assign(task({name:'З'+i,min:10},{type:'дела',where:'today',ord:i+5}),{id:'z'+i}));UI.sys='дела';UI.env='list';UI.view='tasks';save();render()}""")
    pg.mouse.move(600,400);pg.mouse.wheel(0,1500);pg.wait_for_timeout(300)
    assert pg.evaluate("()=>scrollY")>300
    r=pg.evaluate("()=>{const a=document.getElementById('viewSeg').getBoundingClientRect(),e=document.getElementById('envSeg').getBoundingClientRect();return [a.top,a.bottom,e.top,e.bottom]}")
    assert r[0]>=0 and r[3]<=140,r
    # время якоря пусто → пост-задача без времени
    pg.evaluate("""()=>{S.tasks=[];const a=Object.assign(task({name:'Якорь',min:30},{type:'дела',where:'today',ord:0}),{id:'an'}),k=Object.assign(task({name:'После',min:10},{type:'дела',where:'today',ord:1}),{id:'kk',link:'an',rel:'post'});S.tasks.push(a,k);save();render()}""")
    assert pg.evaluate("()=>byId('kk').at")=="" ,pg.evaluate("()=>byId('kk').at")
    pg.evaluate("()=>{byId('an').at='10:00';save()}");assert pg.evaluate("()=>byId('kk').at")=="10:30"
    pg.evaluate("()=>{byId('an').at='';save()}");assert pg.evaluate("()=>byId('kk').at")=="","авто-время должно сниматься"
    # теги сценариев
    pg.evaluate("()=>{UI.view='scen';UI.scenTab='scen';render()}")
    n=lambda:pg.locator('.scsec').count()
    n0=n();assert n0>=3 and pg.locator('#scflt button').count()==2
    pg.click('#scflt [data-hide=morning]');assert n()==n0-1
    pg.click('#scflt [data-hide=evening]');assert n()==n0-2
    pg.reload();pg.wait_for_selector('#viewSeg button');pg.evaluate("()=>{UI.view='scen';UI.scenTab='scen';render()}");assert n()==n0-2
    pg.click('#scflt [data-hide=morning]');pg.click('#scflt [data-hide=evening]');assert n()==n0
    assert errs==[],errs;print("ERRORS:",errs)
