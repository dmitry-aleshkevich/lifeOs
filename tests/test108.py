# Alt + бросок в другую версию сценария = копия (оригинал остаётся, подзадачи копируются)
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1400,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];
      S.scen=[{id:'t-x',kind:'custom',name:'Уборка',icon:'',versions:[{id:'std',name:'Стандарт'},{id:'v2',name:'Быстро'}]}];
      const m=(id,n,o)=>Object.assign(task({name:n,min:5,desc:'д'},{type:'сценарий',sc:'t-x',sv:'std',where:'',ord:S.tasks.length}),{id},o||{});
      S.tasks.push(m('p1','Пыль'),m('k1','Тряпка',{link:'p1',rel:'pre'}));
      UI.view='scen';UI.scenTab='scen';save();render()}""")
    pg.wait_for_selector('.scol .card[data-cid=p1]')
    c=pg.locator('.scol .card[data-cid=p1]').bounding_box();tg=pg.locator('.scol').nth(1).bounding_box()
    pg.keyboard.down('Alt')
    pg.mouse.move(c['x']+60,c['y']+c['height']/2);pg.mouse.down();pg.mouse.move(c['x']+80,c['y']+40,steps=3)
    pg.mouse.move(tg['x']+tg['width']/2,tg['y']+90,steps=8);pg.mouse.up();pg.keyboard.up('Alt');pg.wait_for_timeout(250)
    r=pg.evaluate("()=>[S.tasks.filter(t=>t.sv==='std').length,S.tasks.filter(t=>t.sv==='v2').map(t=>[t.name,t.desc,!!t.link,t.rel||''])]")
    assert r[0]==2,r
    assert sorted(x[0] for x in r[1])==['Пыль','Тряпка'] and any(x[2] for x in r[1]),r
    ids=pg.evaluate("()=>S.tasks.map(t=>t.id)");assert len(ids)==len(set(ids))==4
    assert errs==[],errs
    print("ERRORS:",errs)
