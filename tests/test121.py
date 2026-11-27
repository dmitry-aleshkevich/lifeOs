# карточка «Далат» внизу утреннего экрана: превью зоны, крестик до завтра, тап — крупно
import json
from playwright.sync_api import sync_playwright
from paths import URL
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
PX="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("""async(px)=>{const s=await mpStore('readwrite');
      s.put({id:'d1',type:'img',src:px,x:100,y:3800,w:600,h:400,z:1});s.put({id:'d2',type:'text',text:'Кроссовый мотоцикл',x:900,y:4000,fs:80,color:'#fff',z:2});
      s.put({id:'b1',type:'img',src:px,x:100,y:2000,w:600,h:400,z:1});s.put({id:'m1',type:'text',text:'Вилла',x:100,y:100,fs:80,z:1});
      await new Promise(r=>setTimeout(r,200))}""",PX)
    setup="""()=>{WMC=null;S.tasks=[];['r1','r2'].forEach((id,i)=>S.tasks.push(Object.assign(task({name:'П'+i,min:5},{type:'дела',where:'today',routine:'morning',ord:i}),{id})));S.morningOnly=true;S.day.phase='morning';localStorage.removeItem(WM_KEY);render()}"""
    pg.evaluate(setup);pg.wait_for_selector('#wmc')
    assert pg.locator('#wmc .wmw img').count()==1 and pg.locator('#wmc .wmw .wmtx').count()==1 and 'Кроссовый' in pg.inner_text('#wmc')   # только зона Далат
    # внизу: после списка рутины
    assert pg.evaluate("()=>{const m=document.querySelector('.mscr'),c=document.getElementById('wmc'),l=m.querySelector('.rhead');return c.getBoundingClientRect().top>l.getBoundingClientRect().bottom}")
    sc=pg.evaluate("()=>document.querySelector('#wmc .wmw').style.transform");assert 'scale(' in sc and 'translateY(-3600px)' in sc,sc
    # тап — крупно, ещё тап — закрыть
    pg.click('#wmc .wmp',position=dict(x=20,y=40));pg.wait_for_selector('#wmo');pg.click('#wmo',position=dict(x=3,y=3));assert pg.locator('#wmo').count()==0
    # крестик: пропадает и не возвращается при перерисовке; на следующий день снова
    pg.click('#wmc .wmx');assert pg.locator('#wmc').count()==0
    pg.evaluate("()=>render()");pg.wait_for_timeout(300);assert pg.locator('#wmc').count()==0
    pg.evaluate("()=>{localStorage.setItem(WM_KEY,JSON.stringify('2000-01-01'));render()}");pg.wait_for_selector('#wmc')
    # в Далате пусто → карточки нет
    pg.evaluate("""async()=>{const s=await mpStore('readwrite');s.delete('d1');s.delete('d2');await new Promise(r=>setTimeout(r,200));WMC=null;localStorage.removeItem(WM_KEY);render()}""");pg.wait_for_timeout(400)
    assert pg.locator('#wmc').count()==0
    assert errs==[],errs;print("ERRORS:",errs)
