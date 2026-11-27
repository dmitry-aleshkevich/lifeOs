# время текстом: завтра в 9, в пт 18:00, через 2 часа; поповер понимает слова
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];UI.env='list';UI.view='tasks';save();render()}")
    P=lambda s:pg.evaluate("s=>parseWhen(s)",s)
    tm=pg.evaluate("()=>[dayOf(NOW()),dayOf(NOW()+864e5)]")
    r=P("Созвон завтра в 9");assert r['rest']=="Созвон" and r['at']=="09:00" and r['due']==tm[1],r
    r=P("Спорт в 9:30 вечера");assert r['at']=="21:30" and r['due']=="",r
    r=P("Отчёт в пт 18:00");assert r['due']>tm[0] and r['rest']=="Отчёт 18:00",r   # 18:00 разбирает parseQuick
    r=P("Купить в 5 магазинах");assert r['at']=="" and r['rest']=="Купить в 5 магазинах",r
    r=P("позвонить через 2 часа")
    assert r['rest']=="позвонить" and r['at'] and r['due'],r
    q=pg.evaluate("()=>parseQuick('Созвон завтра в пт 18:10 15м')");assert q['at']=="18:10" and q['min']==15 and q['due'],q
    # быстрый ввод создаёт задачу с датой «завтра»
    pg.evaluate("()=>{UI.qa.top.txt='Встреча завтра в 9';addQuick('top',false)}")
    t=pg.evaluate("()=>S.tasks.find(t=>t.name==='Встреча')");assert t['at']=="09:00" and t['due']==tm[1] and t['where']=="tomorrow",t
    # поповер: слова в поле времени
    tid=t['id'];pg.evaluate("i=>{GF.tomorrow=true;GF.backlog=true;UI.open=i;UI.dt=i;UI.dtd=null;render()}",tid);pg.wait_for_selector('.ptime')
    pg.fill('.ptime','послезавтра в 14:30');pg.keyboard.press('Enter');pg.wait_for_timeout(200)
    t=pg.evaluate("i=>byId(i)",tid);assert t['at']=="14:30" and t['due']>tm[1],t
    assert errs==[],errs
    print("ERRORS:",errs)
