# v2: выделение нескольких задач (Ctrl/Shift+клик), Delete, перенос группой; кнопки «Баг» и «Заметка» с экспортом в буфер
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Альфа","where":"today"},{"id":"b","name":"Бета","where":"today"},{"id":"c","name":"Гамма","where":"today"},{"id":"d","name":"Дельта","where":"today"}],"routines":{},"projects":[],"work":{"projects":[],"tasks":[]}}
def T(pg): return {t["id"]:t for t in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks")}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=1000)); ctx.grant_permissions(["clipboard-read","clipboard-write"]); pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    card=lambda i: pg.locator(f'.card[data-cid="{i}"]')
    pos=dict(x=330,y=6)
    # выделение: Ctrl+клик и Shift+клик
    card("a").click(modifiers=["Control"],position=pos); card("b").click(modifiers=["Control"],position=pos)
    assert pg.locator(".card.sel").count()==2 and "Выбрано 2" in pg.locator("#selbar").text_content()
    card("d").click(modifiers=["Shift"],position=pos); assert pg.locator(".card.sel").count()==4
    card("b").click(modifiers=["Control"],position=pos); assert pg.locator(".card.sel").count()==3
    pg.keyboard.press("Escape"); assert pg.locator(".card.sel").count()==0 and pg.locator("#selbar").count()==0
    # клик по названию с Ctrl выделяет (не правит); при выделении обычный клик тоже переключает
    nm=lambda i: pg.locator(f'.card[data-cid="{i}"] .nm')
    nm("a").click(modifiers=["Control"]); assert pg.locator(".nmi").count()==0 and pg.locator(".card.sel").count()==1
    nm("b").click(); assert pg.locator(".card.sel").count()==2 and pg.locator(".nmi").count()==0
    nm("b").click(); assert pg.locator(".card.sel").count()==1
    pg.keyboard.press("Escape"); assert pg.locator(".card.sel").count()==0
    # рамка мышью по пустому месту
    ba=card("a").bounding_box(); bc=card("c").bounding_box()
    pg.mouse.move(ba["x"]-6,ba["y"]-6); pg.mouse.down(); pg.mouse.move(ba["x"]+ba["width"]-40,bc["y"]+bc["height"]-6,steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    assert {c for c in pg.locator(".card.sel").evaluate_all("els=>els.map(e=>e.dataset.cid)")}>={"a","b","c"}, pg.locator(".card.sel").count()
    pg.keyboard.press("Escape")
    # перенос группой в «Завтра»
    card("a").click(modifiers=["Control"],position=pos); card("b").click(modifiers=["Control"],position=pos)
    s=card("a").bounding_box(); h=pg.locator('.ghead[data-where="tomorrow"]').bounding_box()
    pg.mouse.move(s["x"]+330,s["y"]+6); pg.mouse.down(); pg.mouse.move(s["x"]+320,s["y"]+14,steps=3)
    pg.mouse.move(h["x"]+h["width"]/2,h["y"]+h["height"]/2,steps=12); pg.wait_for_timeout(100); pg.mouse.up(); pg.wait_for_timeout(300)
    t=T(pg); assert t["a"]["where"]=="tomorrow" and t["b"]["where"]=="tomorrow" and t["c"]["where"]=="today", [t[i]["where"] for i in "abc"]
    order=[x["id"] for x in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2')).tasks") if x["where"]=="tomorrow"]; assert order==["a","b"],order
    # Delete удаляет выбранные; Cmd+Z возвращает
    pg.keyboard.press("Escape"); card("c").click(modifiers=["Control"],position=pos); card("d").click(modifiers=["Control"],position=pos)
    pg.keyboard.press("Delete"); pg.wait_for_timeout(200)
    assert set(T(pg))=={"a","b"}, set(T(pg))
    pg.keyboard.press("Control+z"); pg.wait_for_timeout(200); assert set(T(pg))=={"a","b","c","d"}
    # Баг: окошко, добавление, экспорт с журналом действий
    pg.click('#fab button[data-kind="bug"]'); assert pg.locator("#fbpop").count()==1
    pg.fill("#fbpop .fbta","кривая кнопка"); pg.click("#fbpop .fbex"); pg.wait_for_timeout(200)
    txt=pg.evaluate("navigator.clipboard.readText()")
    assert "Баги LifeOS v2 (1)" in txt and "кривая кнопка" in txt and "Действия:" in txt and "удалено выбранных" in txt, txt
    assert "Скопировано" in pg.locator("#fbpop .fbst").text_content()
    # Заметка: свой список, без журнала
    pg.click('#fab button[data-kind="note"]'); pg.fill("#fbpop .fbta","идея про шаблоны"); pg.click("#fbpop .fbex"); pg.wait_for_timeout(200)
    txt=pg.evaluate("navigator.clipboard.readText()")
    assert "Заметки по LifeOS v2 (1)" in txt and "идея про шаблоны" in txt and "Действия:" not in txt and "кривая" not in txt, txt
    assert not errs,errs
print("ERRORS: []")
