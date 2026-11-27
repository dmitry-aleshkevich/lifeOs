# LifeCore (tpl-задачи) никогда не попадают в режим «Фокус», даже когда показ LifeCore включён
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]);pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[{id:'a',name:'Обычная',where:'today',min:5},{id:'c',name:'Ядро',where:'today',min:5,tpl:true}],routines:{morning:[],evening:[]}}))")
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button')
    for show in (False,True):
        names=pg.evaluate("(s)=>{S.tasks.forEach(t=>{if(t.name==='Ядро')t.tpl=true});CORE.show=s;return candidates('дела').map(t=>t.name)}",show)
        assert names==['Обычная'],(show,names)
    b.close();print(errs);assert not errs
