# v2b: фазы дня — Утро (QR, конфетти) → День → Вечер → День закрыт
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[{"id":"m1","name":"Душ","min":10},{"id":"m2","name":"Вода","min":0}],"evening":[{"id":"e1","name":"Зубы","min":0},{"id":"e2","name":"Сон","min":0}]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    at=lambda h:pg.evaluate("h=>{window.__off=new Date().setHours(h,0,0,0)-Date.now();render()}",h)
    # утро выключено (в тестовой базе)
    at(8);assert pg.locator(".card[data-cid=a]").count()==1
    # новый день 04:00 → утро, без часового окна
    pg.evaluate("()=>{S.morningOnly=true;S.day.iso='2000-01-01';render()}");at(16)
    assert pg.locator(".mscr").count()==1 and pg.locator(".qr svg path").count()==1 and pg.locator(".card[data-cid=a]").count()==0
    assert pg.evaluate("()=>document.querySelector('.bar').offsetParent")is None  # переключатели скрыты
    pg.click(".card[data-cid=m1] .ck, .card[data-cid=m1] [data-done], .card[data-cid=m1] .circle") if False else pg.evaluate("()=>{complete(byId('m1'));}")
    assert pg.locator(".mscr").count()==1 and pg.evaluate("()=>window.__confetti||0")==0
    pg.evaluate("()=>{complete(byId('m2'))}");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>window.__confetti")==1 and pg.locator(".mscr").count()==0 and pg.locator(".card[data-cid=a]").count()==1
    assert pg.evaluate("()=>S.day.phase")=="day"
    # вечер: баннер только после 21:00
    at(15);assert pg.locator("#evb").count()==0
    at(22);assert pg.locator("#evb").count()==1
    pg.click("#evb");assert pg.locator(".mscr").count()==1 and pg.locator(".card[data-cid=a]").count()==0 and pg.locator(".card[data-cid=e1]").count()==1
    pg.evaluate("()=>{complete(byId('e1'))}");assert pg.evaluate("()=>S.day.phase")=="evening"
    pg.evaluate("()=>{complete(byId('e2'))}");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>S.day.phase")=="closed" and pg.evaluate("()=>window.__confetti")==2 and pg.locator(".closed").count()==1
    # после полуночи день ещё тот же; с 04:00 — новый, утро заново
    at(26);assert pg.locator(".closed").count()==1
    at(29);pg.wait_for_timeout(200)
    assert pg.evaluate("()=>S.day.phase")=="morning" and pg.locator(".mscr").count()==1
    # пропустить: без конфетти
    n=pg.evaluate("()=>window.__confetti");pg.click("#mskip");assert pg.evaluate("()=>window.__confetti")==n and pg.locator(".card[data-cid=a]").count()==1
    assert errs==[],errs
    print("ERRORS:",errs)
