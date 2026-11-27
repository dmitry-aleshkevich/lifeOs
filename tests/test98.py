# баги: перенос наверх колонки, где первой стоит предзадача; кнопки скрыть/показать у выполненного родителя
import json
from playwright.sync_api import sync_playwright
from paths import URL
V1={"tasks":[],"routines":{"morning":[],"evening":[]},"work":{"tasks":[]}}
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1400,height=1000)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    # предзадача лежит в конце массива (как после «+ до»), родитель — раньше
    pg.evaluate("""()=>{const mk=(n,o)=>task({name:n},Object.assign({type:'работа',status:'todo'},o));
      const P=mk('Парент',{}),T=mk('Другая',{status:'wait'}),K=mk('Пред',{link:P.id,rel:'pre'});
      S.tasks=[P,T,K];save();UI.sys='работа';UI.view='tasks';UI.env='kanban';render()}""")
    names=lambda:pg.evaluate("()=>[...document.querySelectorAll('.col[data-board=status][data-key=todo] .card')].map(c=>c.querySelector('.nm').textContent)")
    assert names()==['Пред','Парент']
    a=pg.locator(".col[data-key=wait] .card .nm").first.bounding_box();k=pg.locator(".col[data-board=status][data-key=todo] .card").first.bounding_box()
    pg.mouse.move(a["x"]+20,a["y"]+10);pg.mouse.down();pg.mouse.move(a["x"]+40,a["y"]+40,steps=4);pg.mouse.move(k["x"]+30,k["y"]+6,steps=10);pg.mouse.up();pg.wait_for_timeout(200)
    assert names()==['Другая','Пред','Парент'],names()
    # выполненный родитель: кнопка скрыть/показать видна и работает
    pg.evaluate("()=>{S.tasks.forEach(t=>{t.type='дела';t.where='today';t.status=''});S.tasks.find(t=>t.name==='Парент').done=true;UI.sys='дела';UI.env='list';render()}")
    c=pg.locator(".card[data-cid]:has(.nm:text-is('Парент'))");c.hover()
    assert c.locator(".plus.arr").count()>=1
    c.locator(".plus.arr").first.click();pg.wait_for_timeout(100)
    assert pg.locator(".card:has(.nm:text-is('Пред'))").count()==0
    assert errs==[],errs
    print("ERRORS:",errs)
