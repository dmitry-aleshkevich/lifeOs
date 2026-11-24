# v2: утро/вечер — группа «Утро» в Списке, сброс на новый день, вечерний баннер после 21:00 и группа «Вечер» внизу; рутины не попадают в Канбан
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[{"id":"m1","name":"Душ","min":10},{"id":"m2","name":"Вода","min":0}],"evening":[{"id":"e1","name":"Убраться","min":10}]},"projects":[],"work":{"projects":[],"tasks":[]}}
def T(pg): return {t["id"]:t for t in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("window.__fakeHour=null")
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    # утро сверху, вечера нет (днём)
    assert pg.locator('.rhead[data-routine="morning"]').count()==1 and "0 из 2" in pg.locator('.rhead[data-routine="morning"]').text_content()
    assert pg.locator('.card[data-cid="m1"]').count()==1 and pg.locator('.card[data-cid="a"]').count()==1
    y=lambda s: pg.locator(s).first.bounding_box()["y"]
    assert y('.rhead[data-routine="morning"]')<y('.ghead[data-where="today"]')
    # отметить оба — группа сворачивается
    for i in ("m1","m2"): pg.locator(f'.card[data-cid="{i}"] .ck').click(); pg.wait_for_timeout(150)
    assert pg.locator('.card[data-cid="m1"]').count()==0 and "всё сделано" in pg.locator('.rhead[data-routine="morning"]').text_content()
    # канбан: рутин нет
    pg.click("#envSeg button:has-text('Канбан')"); pg.wait_for_timeout(300)
    assert pg.locator('.col .card[data-cid="m1"], .col .card[data-cid="e1"]').count()==0
    pg.click("#envSeg button:has-text('Список')"); pg.wait_for_timeout(200)
    # новый день: сброс
    pg.evaluate("()=>{S.day.iso='2000-01-01';render()}"); pg.wait_for_timeout(200)
    t=T(pg); assert not t["m1"]["done"] and not t["m2"]["done"]
    assert pg.locator('.card[data-cid="m1"]').count()==1
    # вечер: баннер только после 21:00
    pg.evaluate("()=>{window.__off=new Date().setHours(12,0,0,0)-Date.now();render()}"); pg.wait_for_timeout(200)
    assert pg.locator("#evb").count()==0 and pg.locator('.rhead[data-routine="evening"]').count()==0
    pg.evaluate("()=>{const R=Date.now;window.__off=new Date().setHours(22,0,0,0)-Date.now();S.day.iso=dayISO();render()}"); pg.wait_for_timeout(200)
    assert pg.locator("#evb").count()==1
    pg.click("#evb"); pg.wait_for_timeout(200)
    assert pg.locator('.rhead[data-routine="evening"]').count()==1 and pg.locator('.card[data-cid="e1"]').count()==1
    assert y('.rhead[data-routine="evening"]')>y('.card[data-cid="a"]')
    # добавить пункт
    pg.locator('.rhead[data-routine="evening"] ~ .radd').click(); pg.keyboard.type("Свет"); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    t=T(pg); assert any(x["name"]=="Свет" and x["routine"]=="evening" for x in t.values())
    assert not errs,errs
print("ERRORS: []")
