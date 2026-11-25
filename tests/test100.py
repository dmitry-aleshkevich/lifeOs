# время и дата в карточке сохраняются сразу по вводу (в Safari change приходит поздно)
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    pg.click(".card[data-cid=a]",position={"x":300,"y":10});pg.click(".card[data-cid=a] .dtbtn");pg.wait_for_selector(".ptime")
    pg.fill(".ptime","1620");pg.press(".ptime","Enter");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>byId('a').at")=="16:20" and pg.evaluate("()=>JSON.parse(localStorage.getItem('lifeos.v2b')).tasks.find(t=>t.id==='a').at")=="16:20"
    pg.fill(".ptime","905");pg.click(".pdate");assert pg.evaluate("()=>byId('a').at")=="09:05"   # потеря фокуса тоже сохраняет
    pg.fill(".ptime","7");pg.press(".ptime","Enter");assert pg.evaluate("()=>byId('a').at")=="07:00"
    pg.fill(".ptime","99");pg.press(".ptime","Enter");assert pg.evaluate("()=>byId('a').at")=="07:00"   # мусор не принимается
    pg.fill(".ptime","16:20");pg.press(".ptime","Enter")
    pg.evaluate("()=>{const i=document.querySelector('.pdate');i.value='2026-12-01';i.dispatchEvent(new Event('input',{bubbles:true}))}")
    assert pg.evaluate("()=>byId('a').due")=="2026-12-01"
    pg.reload();pg.wait_for_selector('#viewSeg button');assert pg.evaluate("()=>byId('a').at")=="16:20"
    assert errs==[],errs
    print("ERRORS:",errs)
