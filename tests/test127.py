# возвращение в приложение: realtime мог пропасть, пока телефон спал, — отметки бота и os2 перечитываются; снятая вручную отметка не возвращается
import json
from playwright.sync_api import sync_playwright
from paths import ROOT, URL
FAKE=open(ROOT/"fake_sb.js",encoding="utf8").read()
# «вернулись в приложение»: событие как при переключении из Telegram
BACK="()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))}"
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page();errs=[]
    pg.clock.install()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.route("**/@supabase/supabase-js@2",lambda r:r.fulfill(body=FAKE,content_type="application/javascript"))
    pg.add_init_script("if(!localStorage.getItem('lifeos.v2b')&&!localStorage.getItem('lifeos.v1'))localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}));localStorage.setItem('__fakesess',JSON.stringify({user:{id:'u'}}))")
    pg.goto(URL+"/index.html");pg.wait_for_selector('#viewSeg button');pg.clock.run_for(2000)
    ids=pg.evaluate("""()=>{scenInit();const ev=S.scen.find(s=>s.kind==='evening'),v=ev.versions[0];
      S.tasks=S.tasks.filter(t=>!(t.type==='сценарий'&&t.sc===ev.id));
      ['Кухня','Сумка'].forEach((n,i)=>S.tasks.push(task({name:n,min:5},{type:'сценарий',sc:ev.id,sv:v.id,where:'',ord:i})));scenApply(ev,v);save();render();
      return botDocs()['bot-morning'].evening.today.items}""")
    pg.clock.run_for(3000)
    a,bb=ids
    done=lambda i:pg.evaluate("i=>byId(i).done",i)
    # бот записал отметку, а сигнал не дошёл
    pg.evaluate("s=>{window.__db['bot-checkins']={schema:1,days:{[S.day.iso]:[{item:s,kind:'evening',done:true,at:Date.now(),by:'bot'}]}};window.__save()}",a['stepId'])
    pg.clock.run_for(3000);assert done(a['id'])==False
    pg.evaluate(BACK);pg.clock.run_for(3000)
    assert done(a['id'])==True and done(bb['id'])==False,"отметка бота не применилась при возвращении"
    assert pg.evaluate("i=>window.__db.os2.s.tasks.find(t=>t.id===i).done",a['id'])==True
    # сняли отметку в приложении: старое событие бота её не возвращает, ни при возвращении, ни после перезагрузки
    pg.evaluate("i=>{const t=byId(i);t.done=false;t.doneAt=0;save();render()}",a['id']);pg.clock.run_for(3000)
    pg.evaluate(BACK);pg.clock.run_for(3000);assert done(a['id'])==False,"снятая отметка вернулась"
    pg.reload();pg.wait_for_selector('#viewSeg button');pg.clock.run_for(3000);assert done(a['id'])==False,"вернулась после перезагрузки"
    # новое нажатие в боте (более позднее) снова отмечает
    pg.clock.run_for(60000)
    pg.evaluate("s=>{window.__db['bot-checkins']={schema:1,days:{[S.day.iso]:[{item:s,kind:'evening',done:true,at:Date.now(),by:'bot'}]}};window.__save()}",a['stepId'])
    pg.evaluate(BACK);pg.clock.run_for(3000);assert done(a['id'])==True
    # пока приложение спало, другое устройство изменило os2
    pg.clock.run_for(15000)
    pg.evaluate("()=>{const d=JSON.parse(JSON.stringify(window.__db.os2));d.at=Date.now()+1000;d.s.tasks.push(Object.assign(task({name:'С другого устройства'}),{type:'дела',where:'today'}));window.__db.os2=d;window.__save()}")
    pg.evaluate(BACK);pg.wait_for_function("()=>typeof S!=='undefined'&&S.tasks.some(t=>t.name==='С другого устройства')",timeout=8000)
    assert errs==[],errs
    print("ERRORS:",errs)
    b.close()
