# v2: прошлый вид после перезагрузки, порядок меню, иконки Баг/Заметка/Экспорт, утро один раз, журнал действий сохраняется
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=900),permissions=["clipboard-read","clipboard-write"]);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(500)
    # порядок меню
    assert [x.strip() for x in pg.locator("#envSeg button").all_text_contents()]==["Список","Канбан","Таймлайн","Календарь"]
    # вид сохраняется
    pg.click('#sysSeg button:has-text("Работа")');pg.click('#envSeg button:has-text("Канбан")');pg.reload();pg.wait_for_selector('#sysSeg button');pg.wait_for_timeout(300)
    assert pg.locator('#sysSeg button[aria-pressed="true"]').text_content().strip()=="Работа"
    assert pg.locator('#envSeg button[aria-pressed="true"]').text_content().strip()=="Канбан"
    # журнал действий пережил перезагрузку
    assert pg.evaluate("ALOG.some(x=>x.includes('Канбан'))")
    # иконки: три кнопки без текста
    assert pg.locator("#fab button").count()==3 and all(t.strip()=="" for t in pg.locator("#fab button").all_text_contents())
    # экспорт общий, очистка через минуту (ускоряем: сдвиг метки)
    pg.click('#fab button[data-kind="bug"]');pg.fill("#fbpop .fbta","жук");pg.click("#fbpop .fbtn") if False else pg.click("#fbpop .chipb:has-text('Добавить')");pg.click("#fbpop .fbx")
    pg.click('#fab button[data-kind="note"]');pg.fill("#fbpop .fbta","идея");pg.click("#fbpop .chipb:has-text('Добавить')");pg.click("#fbpop .fbx")
    pg.click('#fab button[data-kind="exp"]');pg.wait_for_timeout(300)
    clip=pg.evaluate("navigator.clipboard.readText()");assert "жук" in clip and "идея" in clip
    assert pg.evaluate("FBL.bug.length")==1 and pg.evaluate("localStorage.getItem('lifeos.v2.fbexp')")
    pg.evaluate("()=>{['bug','note'].forEach(k=>{FBL[k].forEach(b=>b.at-=120000);fbSave(k)});localStorage.setItem('lifeos.v2.fbexp',String(Date.now()-61000))}");pg.reload();pg.wait_for_timeout(600)
    assert pg.evaluate("FBL.bug.length+FBL.note.length")==0
    # утро: засеяно один раз
    pg.evaluate("()=>{const s=JSON.parse(localStorage.getItem('lifeos.v2'));delete s.seedMorning;s.tasks=[];localStorage.setItem('lifeos.v2',JSON.stringify(s))}");pg.reload();pg.wait_for_timeout(400)
    assert pg.evaluate("S.tasks.filter(t=>t.routine==='morning').length")==10
    pg.evaluate("()=>{S.tasks=[];save()}");pg.reload();pg.wait_for_timeout(400)
    assert pg.evaluate("S.tasks.length")==0
    assert errs==[],errs
    print("ERRORS:",errs)
