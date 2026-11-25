# сценарий = обычные задачи: ПКМ по времени, чекбокс, таймер работают; «Применить» даёт чистую копию
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1400,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];
      S.scen=[{id:'t-x',kind:'custom',name:'Уборка',icon:'',versions:[{id:'std',name:'Стандарт'}]}];
      S.tasks.push(Object.assign(task({name:'Пыль',min:10,at:'12:00',desc:'тряпка',check:[{text:'шкаф',done:false}]},{type:'сценарий',sc:'t-x',sv:'std',where:''}),{id:'z1'}));
      UI.view='scen';UI.scenTab='scen';save();render()}""")
    pg.wait_for_selector('.scol .card[data-cid=z1]')
    pill=pg.locator('.scol .card[data-cid=z1] .mins')
    pill.click(button='right');pg.wait_for_selector('.pop')
    pg.locator('.pop button',has_text='25 мин').click();pg.wait_for_timeout(150)
    assert pg.evaluate("()=>byId('z1').min")==25
    # клик по кнопке времени запускает таймер на шаблоне
    pg.locator('.scol .card[data-cid=z1] .mins').click();pg.wait_for_timeout(200)
    assert pg.evaluate("()=>!!(byId('z1').tm&&byId('z1').tm.run)")
    pg.locator('.scol .card[data-cid=z1] .mins').click(button='right');pg.wait_for_selector('.pop')
    pg.locator('.pop button',has_text='Пауза').click();pg.wait_for_timeout(100)
    # чекбокс кликается
    pg.locator('.scol .card[data-cid=z1] .ck').first.click();pg.wait_for_timeout(150)
    assert pg.evaluate("()=>byId('z1').done")==True
    # «Применить» → чистая копия в Сегодня
    pg.locator('.scol [data-a=apply], .scol .chipb.on').first.click();pg.wait_for_timeout(300)
    n=pg.evaluate("()=>S.tasks.filter(t=>t.type==='дела'&&t.name==='Пыль').map(t=>[t.done,!!t.tm,t.min,t.at,t.desc,t.check.length,t.check[0]&&t.check[0].done])")
    assert n==[[False,False,25,'12:00','тряпка',1,False]],n
    assert errs==[],errs
    print("ERRORS:",errs)
