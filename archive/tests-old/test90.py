# v2: утренний экран — с 4 до 14, пока утро не выполнено, виден только список утра; «Пропустить» возвращает обычный вид
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[{"id":"m1","name":"Душ","min":10},{"id":"m2","name":"Вода","min":0}],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(500)
    at=lambda h:pg.evaluate("h=>{window.__off=new Date().setHours(h,0,0,0)-Date.now();render()}",h)
    at(8);assert pg.locator(".card[data-cid=a]").count()==1  # у тестовой базы режим выключен
    pg.evaluate("()=>{S.morningOnly=true;render()}");at(8)
    assert pg.locator(".mscr").count()==1 and pg.locator(".card[data-cid=m1]").count()==1 and pg.locator(".card[data-cid=a]").count()==0
    at(20);assert pg.locator(".mscr").count()==0 and pg.locator(".card[data-cid=a]").count()==1
    at(8);pg.click("#mskip");assert pg.locator(".mscr").count()==0 and pg.locator(".card[data-cid=a]").count()==1
    pg.evaluate("()=>{S.day.skipMorning='';S.tasks.forEach(t=>{if(t.routine)t.done=true});render()}");assert pg.locator(".mscr").count()==0
    assert errs==[],errs
    print("ERRORS:",errs)
