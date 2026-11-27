# Beta 2.0: новое меню, свёртка групп списка, стрелки пред/пост, склад в таймлайне, проекты (имя/цена), записи с тоглом
import json, datetime
from playwright.sync_api import sync_playwright
from paths import URL
V1={"tasks":[{"id":"a","name":"Сегодняшняя","where":"today"},{"id":"b","name":"Завтрашняя","where":"tomorrow"},{"id":"c","name":"Родитель","where":"today"},{"id":"d","name":"Без времени","where":"backlog"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.clock.install(time=datetime.datetime(2026,11,25,12,0))   # днём: с 21:00 приложение показывает вечерний экран
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(URL+"/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto(URL+"/v2b/build.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(400)
    # меню
    assert pg.locator("#viewSeg button").all_inner_texts()==["Дела","Работа","Сценарии","Привычки","Итоги","Карта"]
    assert pg.locator("#envSeg button").count()==4 and pg.locator("#sysSeg").count()==0
    pg.click("#viewSeg button:has-text('Привычки')");assert pg.locator("#envSeg").is_hidden()
    pg.click("#viewSeg button:has-text('Сценарии')");assert pg.locator("#scenTabs button").count()==2
    pg.click("#scenTabs button:has-text('Шаблоны')");assert pg.locator(".plb").count()==4
    pg.click("#viewSeg button:has-text('Дела')");assert pg.locator("#envSeg").is_visible()
    # список: «Сегодня» раскрыто, «Завтра» свёрнуто, состояние запоминается
    assert pg.locator(".card[data-cid=a]").count()==1 and pg.locator(".card[data-cid=b]").count()==0
    pg.click(".ghead[data-where=tomorrow]");assert pg.locator(".card[data-cid=b]").count()==1
    pg.reload();pg.wait_for_selector('#viewSeg button');assert pg.locator(".card[data-cid=b]").count()==1
    pg.click(".ghead[data-where=today] .gt");assert pg.locator(".card[data-cid=a]").count()==0
    pg.click(".ghead[data-where=today] .gt")
    # пред/пост: стрелки и рамка у родителя
    pg.evaluate("()=>{const c=byId('c');const k1=task({name:'До'},{type:'дела',where:'today',link:'c',rel:'pre'});const k2=task({name:'После'},{type:'дела',where:'today',link:'c',rel:'post'});S.tasks.push(k1,k2);save();render()}")
    assert pg.locator(".card.fam[data-cid=c]").count()==1
    assert pg.locator(".card.kpre .ck").first.inner_text()=="↓" and pg.locator(".card.kid2:not(.kpre) .ck").first.inner_text()=="↳"
    # таймлайн: склад справа сворачивается
    pg.click("#envSeg [data-env=timeline]");assert pg.locator(".tlw .tls").count()==1
    pg.click("#tlstore");assert pg.locator(".tlw.shut").count()==1 and pg.locator(".tlw .tls").count()==0
    pg.click("#tlstore");assert pg.locator(".tlw .tls").count()==1
    # проекты: имя, цена, добавить, удалить
    pg.click("#envSeg [data-env=kanban]");pg.click("#pbtn")
    pg.click("#padd");n=pg.locator(".prow .pnin").count()
    last=pg.locator(".prow .pnin").last;last.fill("Клиент X");last.press("Enter")
    pg.locator(".prow .pprice").last.fill("5000 $");pg.locator(".prow .pprice").last.press("Enter")
    assert pg.evaluate("()=>S.projects.some(p=>p.name==='Клиент X'&&p.price==='5000 $')")
    pg.locator(".prow .pdel").last.click();pg.locator(".prow .pdel").last.click()
    assert pg.evaluate("()=>S.projects.some(p=>p.name==='Клиент X')")==False
    pg.keyboard.press("Escape")
    # записи: поле всегда, прошлые прячутся тоглом
    pg.evaluate("()=>{FBL.note=[{tag:'t',text:'старая',at:1,log:[]}]}")
    pg.click("#fnote,[aria-label='Заметка'],.fbtn[data-kind=note]") if pg.locator("#fnote,[aria-label='Заметка'],.fbtn[data-kind=note]").count() else pg.evaluate("()=>fbOpen('note')")
    assert pg.locator(".fbpop textarea").is_visible() and pg.locator(".fbpop .fbls").is_hidden()
    pg.click(".fbpast");assert pg.locator(".fbpop .fbls").is_visible()
    # меню: переключатели видов — отдельным рядом под основным; Enter добавляет запись, Shift+Enter — перенос
    assert pg.evaluate("()=>document.getElementById('envSeg').getBoundingClientRect().top>document.getElementById('viewSeg').getBoundingClientRect().bottom-2")
    pg.fill(".fbpop textarea","раз");pg.press(".fbpop textarea","Shift+Enter");pg.keyboard.type("два")
    assert pg.input_value(".fbpop textarea")=="раз\nдва"
    n0=pg.evaluate("()=>FBL.note.length");pg.press(".fbpop textarea","Enter");assert pg.evaluate("()=>FBL.note.length")==n0+1 and pg.input_value(".fbpop textarea")==""
    assert errs==[],errs
    print("ERRORS:",errs)
