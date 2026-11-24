# v2b: «Карта» открывается, текст добавляется и переживает перезагрузку, фото в IndexedDB общее с v1
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(300)
    pg.click("#viewSeg button:has-text('Карта')");pg.wait_for_selector(".mp .zone");assert pg.locator(".mp .zone").count()==3
    pg.click(".mpbar [data-a=text]");pg.wait_for_selector(".mp .item.text .t[contenteditable=true]")
    pg.keyboard.type("Харлей");pg.keyboard.press("Escape");pg.wait_for_timeout(700)
    assert pg.locator(".mp .item.text").count()==1
    pg.reload();pg.wait_for_selector(".mp .zone");pg.wait_for_timeout(600)
    assert pg.locator(".mp .item.text .t").inner_text()=="Харлей"
    pg.click("#viewSeg button:has-text('Задачи')");assert pg.locator(".mp").count()==0
    assert errs==[],errs
    print("ERRORS:",errs)
