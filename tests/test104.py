# сценарии = канбан: рамка выделяет несколько задач, перенос между версиями
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
      ['p1','p2','p3'].forEach((id,i)=>S.tasks.push(Object.assign(task({name:'Зад'+i,min:5},{type:'сценарий',sc:'t-x',sv:'std',where:'',ord:i}),{id})));
      UI.env='timeline';UI.view='scen';UI.scenTab='scen';save();render()}""")
    pg.wait_for_selector('.scol .card[data-cid=p1]')
    a=pg.locator('.scol .card[data-cid=p1]').bounding_box();c=pg.locator('.scol .card[data-cid=p3]').bounding_box()
    col=pg.locator('.scol').first.bounding_box()
    x0=col['x']+col['width']-6                       # пустое поле справа в колонке
    pg.mouse.move(x0,a['y']-2);pg.mouse.down();pg.mouse.move(a['x']+20,c['y']+c['height']+4,steps=8);pg.mouse.up();pg.wait_for_timeout(200)
    n=pg.evaluate("()=>SEL.size");assert n>=2,n
    # перенос выделенных в другую версию
    sel=pg.locator('.scol .card[data-cid=p1]').bounding_box();tgt=pg.locator('.scol').nth(1).bounding_box()
    pg.mouse.move(sel['x']+60,sel['y']+10);pg.mouse.down();pg.mouse.move(sel['x']+80,sel['y']+40,steps=3)
    pg.mouse.move(tgt['x']+tgt['width']/2,tgt['y']+80,steps=8);pg.mouse.up();pg.wait_for_timeout(250)
    moved=pg.evaluate("()=>S.tasks.filter(t=>t.sv==='v2').length");assert moved>=2,moved
    assert errs==[],errs
    print("ERRORS:",errs)
