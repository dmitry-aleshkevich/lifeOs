# «В календарь»: запись в Google Calendar (OAuth и сеть подменены)
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Созвон","where":"today","at":"15:30","min":45},{"id":"b","name":"Без времени","where":"today"}],"routines":{"morning":[],"evening":[]}}
STUB="""window.__calls=[];window.google={accounts:{oauth2:{initTokenClient:(o)=>({requestAccessToken:()=>setTimeout(()=>o.callback({access_token:'tok',expires_in:3600}),10)})}}};
window.prompt=()=> 'test-client-id';
window.fetch=async(u,o)=>{if(String(u).includes("googleapis"))window.__calls.push({u,m:o&&o.method,b:o&&o.body,a:o&&o.headers&&o.headers.Authorization});return {ok:true,status:200,json:async()=>({id:'ev1'})}}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("()=>{window.__off=new Date(2026,10,25,12).getTime()-Date.now();S.tasks=S.tasks.filter(t=>!t.tpl);S.planGen='';render()}");pg.wait_for_timeout(200)
    pg.evaluate(STUB)
    pg.click(".card[data-cid=a] .nm >> nth=0") if False else pg.click(".card[data-cid=a]",position={"x":300,"y":10});pg.wait_for_selector(".card[data-cid=a] .gcb")
    pg.click(".card[data-cid=a] .gcb");pg.wait_for_timeout(300)
    c=pg.evaluate("()=>window.__calls");assert len(c)==1 and c[0]["m"]=="POST" and c[0]["a"]=="Bearer tok" and c[0]["u"].endswith("/calendars/primary/events")
    body=json.loads(c[0]["b"]);assert body["summary"]=="Созвон" and body["start"]["dateTime"].endswith("T15:30:00") and body["end"]["dateTime"].endswith("T16:15:00"),body
    assert pg.evaluate("()=>byId('a').gcal")=="ev1"
    # повторное нажатие обновляет событие, а не создаёт второе
    pg.click(".card[data-cid=a]",position={"x":300,"y":10});pg.click(".card[data-cid=a]",position={"x":300,"y":10}) if False else None
    pg.evaluate("()=>{UI.open='a';render()}");pg.click(".card[data-cid=a] .gcb");pg.wait_for_timeout(300)
    c=pg.evaluate("()=>window.__calls");assert len(c)==2 and c[1]["m"]=="PATCH" and c[1]["u"].endswith("/events/ev1")
    # без времени — не отправляем
    pg.evaluate("()=>{UI.open='b';render()}");pg.click(".card[data-cid=b] .gcb");pg.wait_for_timeout(200)
    assert len(pg.evaluate("()=>window.__calls"))==2
    # кнопка «День в календарь»
    pg.evaluate("()=>{byId('a').gcal='';byId('b').at='18:00';byId('b').gcal='';UI.open=null;render()}")
    pg.click(".gday");pg.wait_for_timeout(600)
    c=pg.evaluate("()=>window.__calls");n=[json.loads(x["b"])["summary"] for x in c[2:]];print(n);assert len(c)==11   # 2 + все задачи дня со временем (шаблоны и цепочки до/после)
    assert errs==[],errs
    print("ERRORS:",errs)
