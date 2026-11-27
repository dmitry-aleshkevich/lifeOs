# bot-morning: у сегодняшних пунктов есть stepId — id шага из versions[].items
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("if(!localStorage.getItem('lifeos.v2b'))localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}))")
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button')
    r=pg.evaluate("""()=>{scenInit();const mo=S.scen.find(s=>s.kind==='morning');const v=mo.versions[0];['Душ','Зубы'].forEach((n,i)=>S.tasks.push(task({name:n,min:5},{type:'сценарий',sc:mo.id,sv:v.id,where:'',ord:i})));
      scenApply(mo,v);const d=botDocs()['bot-morning'];const ids=d.morning.versions.find(x=>x.id===v.id).items.map(i=>i.id);
      return {n:d.morning.today.items.length,ok:d.morning.today.items.every(t=>ids.includes(t.stepId)),ids:ids.length,
        dup:new Set(d.morning.today.items.map(t=>t.stepId)).size===d.morning.today.items.length}}""")
    print(r);assert r['n']>0 and r['ok'] and r['dup']
    r2=pg.evaluate("""()=>{S.tasks.forEach(t=>{delete t.src});const d=botDocs()['bot-morning'];return d.morning.today.items.every(t=>t.stepId)}""")
    assert r2,'запасной вариант по названию'
    b.close();print(errs);assert not errs
