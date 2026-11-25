# «Добавить в Сегодня» из редактора сценариев всегда кладёт задачи в Дела, даже если открыта вкладка «Работа»
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.evaluate("()=>{UI.sys='работа';UI.view='scen';UI.scenTab='scen';render()}")
    sec=pg.locator('.scsec[data-sid=t-clean]');assert sec.count()==1
    btn=sec.locator('.chipb.on').filter(has_text='Добавить').first;assert 'ToDo' not in btn.inner_text()
    btn.click();pg.wait_for_timeout(200)
    r=pg.evaluate("()=>S.tasks.filter(t=>t.type!=='сценарий'&&['Кухня','Комната','Одежда'].includes(t.name)).map(t=>[t.type,t.where])")
    assert len(r)==3 and all(x==['дела','today'] for x in r),r
    assert errs==[],errs;print("ERRORS:",errs)
