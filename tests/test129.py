# витрина бота: версию утра без явного выбора определяем по самим пунктам дня, а не берём первую
from playwright.sync_api import sync_playwright
from paths import ROOT, URL
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page();errs=[]
    pg.clock.install(time="2026-11-28T09:00:00")   # суббота: по умолчанию «Дома»
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}))")
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.clock.run_for(2000)
    pg.evaluate("""()=>{scenInit();const mo=S.scen.find(s=>s.kind==='morning');
      const fast=[['Подъём',5],['Душ',10],['Выход',0]],home=[['Подъём',5],['Душ',15],['Чай',5],['Выход',0]],my=[['Подъём',5],['Душ',10],['Чай',5],['Выход',0]];
      mo.versions=[{id:'fast',name:'Быстро',items:[]},{id:'home',name:'Дома',items:[]},{id:'custom',name:'Кастом',items:[]}];
      S.tasks=S.tasks.filter(t=>!(t.type==='сценарий'&&t.sc===mo.id)&&t.routine!=='morning');
      [fast,home,my].forEach((l,v)=>l.forEach(([n,m],i)=>S.tasks.push(task({name:n,min:m},{type:'сценарий',sc:mo.id,sv:mo.versions[v].id,where:'',ord:i}))));
      window.__day=(rows,sel,src)=>{S.tasks=S.tasks.filter(t=>t.routine!=='morning');S.day.scen=sel?{morning:sel}:{};
        const mine=S.tasks.filter(t=>t.type==='сценарий'&&t.sv===src);
        rows.forEach(([n,m],i)=>S.tasks.push(task({name:n,min:m},Object.assign({type:'дела',where:'today',routine:'morning',ord:i},src?{src:(mine.find(x=>x.name===n)||{}).id||''}:{}))))};
      window.__ver=()=>{const d=botDocs()['bot-morning'].morning,t=d.today.items;
        return{sel:d.today.versionId,ids:d.versions.map(v=>[v.id,t.filter(x=>v.items.some(s=>s.id===x.stepId)).length]),n:t.length}};
      window.__sets={fast,home,my}}""")
    def ver(name,sel=None,src=None):
        pg.evaluate("([n,sel,src])=>__day(__sets[n],sel,src)",[name,sel,src]);r=pg.evaluate("()=>__ver()")
        return r,{k:v for k,v in r['ids']}
    # пункты «Дома» без выбора: все шаги из «Дома»
    r,h=ver('home');assert r['sel'] is None and h=={'fast':0,'home':4,'custom':0},r
    # короткий набор не раздувается до длинной версии
    r,h=ver('fast');assert h=={'fast':3,'home':0,'custom':0},r
    # те же названия, другие минуты
    r,h=ver('my');assert h=={'fast':0,'home':0,'custom':4},r
    # ссылка src важнее названий и минут
    r,h=ver('home',src='custom');assert h=={'fast':0,'home':0,'custom':4},r
    # явный выбор не меняется
    r,h=ver('home',sel='fast');assert r['sel']=='fast' and h['fast']==3 and h['home']==0,r
    # пунктов нет — ничего не падает
    pg.evaluate("()=>__day([],null,null)");assert pg.evaluate("()=>__ver().n")==0
    print("ERRORS:",errs)
    b.close()
