# отметки из бота (bot-checkins): приложение отмечает пункт утра по stepId, повтор не ломает, снятие отметки работает
from playwright.sync_api import sync_playwright
from paths import URL
INIT="""window.__cb=null;window.claude={use:async(n)=>({collection:()=>({doc:()=>({onSnapshot:(cb)=>{window.__cb=cb},set:async()=>{}}),onSnapshot(){}})})};
if(!localStorage.getItem('lifeos.v2b'))localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}))"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script(INIT);pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(600)
    assert pg.evaluate("()=>typeof window.__cb")=="function"
    r=pg.evaluate("""()=>{scenInit();const mo=S.scen.find(s=>s.kind==='morning');const v=mo.versions[0];
      ['Душ','Зубы'].forEach((n,i)=>S.tasks.push(task({name:n,min:5},{type:'сценарий',sc:mo.id,sv:v.id,where:'',ord:i})));scenApply(mo,v);
      const items=botDocs()['bot-morning'].morning.today.items,a=items[0],bb=items[1];
      const ev=(i,done,at)=>({schema:1,days:{[S.day.iso]:[{item:i,kind:'morning',done,at,by:'bot'}]}});
      window.__cb({exists:true,data:()=>ev(a.stepId,true,Date.now())});
      const r1=[byId(a.id).done,byId(bb.id).done];
      window.__cb({exists:true,data:()=>ev(a.stepId,true,Date.now())});
      window.__cb({exists:true,data:()=>({schema:1,days:{'1999-01-01':[{item:bb.stepId,kind:'morning',done:true,at:1}]}})});
      const r2=byId(bb.id).done;
      window.__cb({exists:true,data:()=>ev(a.stepId,false,Date.now()+5000)});
      return {r1,r2,r3:byId(a.id).done}}""")
    print(r);assert r['r1']==[True,False] and r['r2']==False and r['r3']==False
    b.close();print(errs);assert not errs
