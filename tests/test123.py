# облако Beta 2.0: вход, запись os2, витрина bot-morning/bot-plan, подтяжка из облака на новом устройстве
import json
from playwright.sync_api import sync_playwright
from paths import ROOT, URL
FAKE=open(ROOT/"fake_sb.js",encoding="utf8").read()
URL=URL+"/index.html"
def mk(b):
    c=b.new_context(viewport=dict(width=1300,height=900));pg=c.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.route("**/@supabase/supabase-js@2",lambda r:r.fulfill(body=FAKE,content_type="application/javascript"))
    return pg,errs
with sync_playwright() as p:
    b=p.chromium.launch()
    pg,errs=mk(b)
    pg.add_init_script("if(!localStorage.getItem('lifeos.v2b')&&!localStorage.getItem('lifeos.v1'))localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[{id:'a',name:'Дело',where:'today'}],routines:{morning:[],evening:[]}}))")
    pg.goto(URL);pg.wait_for_selector('#sbGate input[type=email]')
    pg.fill('#sbGate [type=email]','a@b.c');pg.fill('#sbGate [type=password]','x');pg.click('#sbGate button')
    pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    assert pg.locator('.vsw').count()==0
    pg.evaluate("()=>{S.tasks.push(Object.assign(task({name:'Облачная задача',min:7}),{type:'дела',where:'today'}));save()}")
    pg.wait_for_timeout(2600)
    db=pg.evaluate("()=>window.__db")
    assert 'os2' in db and any(t['name']=='Облачная задача' for t in db['os2']['s']['tasks']),list(db)
    bm=db['bot-morning'];assert bm['schema']==1 and bm['morning']['versions'] and bm['evening']['items'] is not None
    assert any(x['name']=='Облачная задача' for x in db['bot-plan']['today']),db['bot-plan']
    # второе устройство: в облаке новее — подтягиваем
    st=db['os2']['s'];st['tasks'].append(dict(st['tasks'][-1],id='zz',name='С другого устройства'))
    pg2,errs2=mk(b)
    pg2.add_init_script("if(!localStorage.getItem('__seed')){localStorage.setItem('__seed','1');localStorage.setItem('__fakedb',%s);localStorage.setItem('__fakesess',%s)}"%(json.dumps(json.dumps({'os2':{'at':9999999999999,'s':st}})),json.dumps(json.dumps({'user':{'id':'u-a@b.c'}}))))
    pg2.goto(URL);pg2.wait_for_selector('#viewSeg button');pg2.wait_for_timeout(1200)
    assert pg2.evaluate("()=>S.tasks.some(t=>t.name==='С другого устройства')")
    print(errs,errs2)
    assert not errs and not errs2
    b.close()
print("[]")
