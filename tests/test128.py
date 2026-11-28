# общий таймер с ботом: LifeOS отдаёт таймер в bot-morning и принимает таймер бота из bot-checkins
from playwright.sync_api import sync_playwright
from paths import ROOT, URL
FAKE=open(ROOT/"fake_sb.js",encoding="utf8").read()
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page();errs=[]
    pg.clock.install(time="2026-11-28T09:00:00")
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.route("**/@supabase/supabase-js@2",lambda r:r.fulfill(body=FAKE,content_type="application/javascript"))
    pg.add_init_script("if(!localStorage.getItem('lifeos.v2b')&&!localStorage.getItem('lifeos.v1'))localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}));localStorage.setItem('__fakesess',JSON.stringify({user:{id:'u'}}))")
    pg.goto(URL+"/index.html");pg.wait_for_selector('#viewSeg button');pg.clock.run_for(2000)
    a,bb,c=pg.evaluate("""()=>{scenInit();const ev=S.scen.find(s=>s.kind==='evening'),v=ev.versions[0];
      S.tasks=S.tasks.filter(t=>!(t.type==='сценарий'&&t.sc===ev.id));
      [['Кухня',5],['Сумка',2],['Зубы',0]].forEach(([n,m],i)=>S.tasks.push(task({name:n,min:m},{type:'сценарий',sc:ev.id,sv:v.id,where:'',ord:i})));scenApply(ev,v);S.day.phase='evening';save();render();
      return botDocs()['bot-morning'].evening.today.items}""")
    pg.clock.run_for(3000)
    run=lambda:pg.evaluate("()=>window.__db['bot-morning'].evening.today.run")
    t=lambda i:pg.evaluate("i=>{const t=byId(i);return{done:t.done,spent:t.spent||0,acc:t.acc||0,tm:t.tm,spentNow:spentOf(t)}}",i)
    now=lambda:pg.evaluate("Date.now()")
    assert run() is None
    # старт в LifeOS виден боту
    pg.evaluate("i=>startT(byId(i))",a['id']);pg.clock.run_for(3000);r=run()
    assert r['item']==a['stepId'] and r['pausedAt']==0 and abs(r['endsAt']-r['startedAt']-300000)<50,r
    # пауза
    pg.clock.run_for(60000);pg.evaluate("i=>{pauseT(byId(i));save()}",a['id']);pg.clock.run_for(3000);r=run()
    assert r['pausedAt']==r['at'] and 62000<r['pausedAt']-r['startedAt']<66000 and abs(r['endsAt']-r['startedAt']-300000)<50,r
    # продолжили и добавили минуту
    pg.clock.run_for(30000);pg.evaluate("i=>{startT(byId(i));addT(byId(i),1)}",a['id']);pg.clock.run_for(3000);r=run()
    assert r['pausedAt']==0 and abs(r['endsAt']-r['startedAt']-360000)<50,r
    # «Готово» в LifeOS: следующий запускается сам, бот видит уже его
    pg.evaluate("i=>complete(byId(i))",a['id']);pg.clock.run_for(3000);r=run()
    assert r['item']==bb['stepId'],r
    # «Готово» в боте: пункт отмечен с временем бота, третий (секундомер) запущен с того же момента
    def bot(item,prev=None,spent=0,ago=0,ends=None,paused=0):
        pg.evaluate("""([item,prev,spent,ago,ends,paused])=>{const at=Date.now()-ago,d=window.__db['bot-checkins']||{schema:1,days:{}};
          const l=d.days[S.day.iso]=d.days[S.day.iso]||[];
          if(prev)l.push({item:prev,kind:'evening',done:true,at,by:'bot',spent});
          d.run={day:S.day.iso,kind:'evening',item,at,startedAt:at-(paused?30000:0),endsAt:ends===null?0:at+ends,pausedAt:paused?at:0};
          window.__db['bot-checkins']=d;window.__save();window.dispatchEvent(new Event('focus'))}""",[item,prev,spent,ago,ends,paused])
        pg.clock.run_for(3000)
    pg.clock.run_for(60000)
    bot(c['stepId'],bb['stepId'],spent=45000,ago=20000)
    x=t(bb['id']);assert x['done'] and x['spent']==45000 and x['tm'] is None,x
    y=t(c['id']);assert y['tm']['run'] and y['tm']['sw'] and 22000<y['spentNow']<30000,y
    r=run();assert r['item']==c['stepId'],r
    # то же событие второй раз ничего не меняет, отмена в приложении держится
    pg.evaluate("i=>{pauseT(byId(i));byId(i).tm=null;save();render()}",c['id']);pg.clock.run_for(3000)
    pg.evaluate("()=>window.dispatchEvent(new Event('focus'))");pg.clock.run_for(3000);assert t(c['id'])['tm'] is None
    # «+5» из бота двигает конец идущего таймера
    pg.evaluate("i=>{byId(i).done=false;startT(byId(i))}",a['id']);pg.clock.run_for(3000)
    pg.evaluate("i=>{byId(i).min=5}",a['id'])
    before=t(a['id'])['tm']['end'];bot(a['stepId'],ends=600000)
    y=t(a['id']);assert y['tm']['run'] and y['tm']['end']>before,(before,y)
    # старый таймер бота не перебивает более новый в LifeOS
    bot(c['stepId'],ago=3600000,ends=None);assert t(a['id'])['tm']['run'] and t(c['id'])['tm'] is None
    # запуск другого шага из бота: прежний на паузе, идёт только новый; бот видит новый
    pg.clock.run_for(5000);bot(c['stepId'],ends=None)
    assert t(c['id'])['tm']['run'] and not t(a['id'])['tm']['run'];assert run()['item']==c['stepId']
    # пауза из бота
    pg.clock.run_for(5000);bot(c['stepId'],ends=None,paused=1);y=t(c['id'])
    assert not y['tm']['run'] and 29000<y['spentNow']<31000,y
    pg.reload();pg.wait_for_function("()=>typeof S!=='undefined'&&!!S");pg.clock.run_for(3000);assert not t(c['id'])['tm']['run']
    assert errs==[],errs
    print("ERRORS:",errs)
    b.close()
