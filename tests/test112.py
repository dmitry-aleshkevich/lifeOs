# масштаб таймлайна: Shift+колесо на компьютере, щипок на телефоне; пределы 24..160; запоминается
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
PINCH="""async ([d0,d1])=>{
  const tl=document.querySelector('.tl'),r=tl.getBoundingClientRect(),cx=r.left+r.width/2,cy=Math.max(r.top,60)+200;
  const T=(id,x,y)=>new Touch({identifier:id,target:tl,clientX:x,clientY:y,radiusX:5,radiusY:5});
  const fire=(type,ts)=>tl.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches:ts,targetTouches:ts,changedTouches:ts}));
  fire('touchstart',[T(1,cx-d0/2,cy),T(2,cx+d0/2,cy)]);
  for(let i=1;i<=6;i++){const d=d0+(d1-d0)*i/6;fire('touchmove',[T(1,cx-d/2,cy),T(2,cx+d/2,cy)]);await new Promise(r=>setTimeout(r,30))}
  fire('touchend',[]);
}"""
def setup(pg,mobile):
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];S.tasks.push(Object.assign(task({name:'Зал',min:60,at:'15:00'},{type:'дела',where:'today',ord:1}),{id:'g'}));UI.sys='дела';UI.env='timeline';UI.view='tasks';save();render()}""")
    pg.wait_for_selector('.tl .slot')
hr=lambda pg:pg.evaluate("()=>document.querySelector('.tl .hr').getBoundingClientRect().height")
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));setup(pg,False)
    assert round(hr(pg))==56
    pg.mouse.move(600,400);pg.keyboard.down('Shift');pg.mouse.wheel(0,-120);pg.wait_for_timeout(150);pg.keyboard.up('Shift')
    assert hr(pg)>56,hr(pg)
    for _ in range(20):
        pg.keyboard.down('Shift');pg.mouse.wheel(0,-120);pg.keyboard.up('Shift');pg.wait_for_timeout(30)
    assert round(hr(pg))==160,hr(pg)
    for _ in range(40):
        pg.keyboard.down('Shift');pg.mouse.wheel(0,120);pg.keyboard.up('Shift');pg.wait_for_timeout(30)
    assert round(hr(pg))==24,hr(pg)
    assert pg.evaluate("()=>localStorage.getItem('lifeos.v2b.tlpx')")=="24"
    pg.reload();pg.wait_for_selector('.tl .slot');assert round(hr(pg))==24    # запомнилось
    # без Shift колесо просто листает — масштаб не меняется
    pg.mouse.wheel(0,120);pg.wait_for_timeout(100);assert round(hr(pg))==24
    # телефон: щипок
    pg2=b.new_context(viewport=dict(width=402,height=812),is_mobile=True,has_touch=True).new_page();pg2.on("pageerror",lambda e:errs.append(str(e)));setup(pg2,True)
    pg2.evaluate(PINCH,[80,200]);pg2.wait_for_timeout(200)
    assert hr(pg2)>56*1.8,hr(pg2)
    pg2.evaluate(PINCH,[200,40]);pg2.wait_for_timeout(200)
    assert hr(pg2)<80,hr(pg2)
    assert errs==[],errs
    print("ERRORS:",errs)
