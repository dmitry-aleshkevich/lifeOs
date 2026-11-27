# реакция на «Отправить» в сценариях (тост + ✓ на кнопке); свои колонки в канбане «Дел»
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/archive/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    # --- «Отправить» ---
    pg.evaluate("()=>{S.morningOnly=false;S.day.phase='day';UI.sys='дела';UI.view='scen';UI.scenTab='scen';render()}")
    btn=pg.locator('.scsec[data-sid=t-clean] [data-a=apply]').first
    btn.click();pg.wait_for_selector('#toast')
    t=pg.inner_text('#toast');assert t.startswith('Отправлено: 3 задачи') and 'Сегодня' in t,t
    assert 'sent' in (pg.locator('.scsec[data-sid=t-clean] [data-a=apply]').first.get_attribute('class') or '') and 'Отправлено' in pg.locator('.scsec[data-sid=t-clean] [data-a=apply]').first.inner_text()
    pg.wait_for_timeout(1500);assert 'sent' not in (pg.locator('.scsec[data-sid=t-clean] [data-a=apply]').first.get_attribute('class') or '')
    # --- свои колонки ---
    pg.evaluate("""()=>{S.tasks=[];CORE.show=false;UI.view='tasks';UI.sys='дела';UI.env='kanban';[['a','backlog'],['b','backlog'],['c','today']].forEach(([id,w],i)=>S.tasks.push(Object.assign(task({name:id,min:20},{type:'дела',where:w,ord:i}),{id})));save();render()}""")
    pg.click('#addcol');pg.wait_for_timeout(200)
    assert pg.evaluate("()=>S.cols.length")==1 and pg.locator('.col[data-board=status] .vn').count()==1
    pg.fill('.col[data-board=status] .vn','Дом');pg.keyboard.press('Enter');pg.wait_for_timeout(150)
    assert pg.evaluate("()=>S.cols[0].name")=="Дом"
    key="c:"+pg.evaluate("()=>S.cols[0].id")
    # перетаскиваем «a» из «Нужно делать» в «Дом»
    src=pg.locator('.card[data-cid=a]').first.bounding_box();dst=pg.locator(f'.col[data-board=status][data-key="{key}"]').bounding_box()
    pg.mouse.move(src['x']+60,src['y']+src['height']/2);pg.mouse.down();pg.mouse.move(src['x']+80,src['y']+30,steps=4);pg.mouse.move(dst['x']+dst['width']/2,dst['y']+dst['height']-30,steps=12);pg.mouse.up();pg.wait_for_timeout(300)
    assert pg.evaluate("()=>[byId('a').where,byId('a').col===S.cols[0].id]")==['backlog',True],pg.evaluate("()=>JSON.stringify(byId('a'))")
    assert pg.locator(f'.col[data-key="{key}"] .card[data-cid=a]').count()==1 and pg.locator('.col[data-key=backlog] .card[data-cid=a]').count()==0 and pg.locator('.col[data-key=backlog] .card[data-cid=b]').count()==1
    # «+ Задача» в колонке «Дом»
    pg.locator(f'.col[data-key="{key}"] [data-a=addtask]').click();pg.keyboard.type('Новая');pg.keyboard.press('Enter');pg.wait_for_timeout(200)
    assert pg.evaluate("()=>S.tasks.filter(t=>t.col===S.cols[0].id).length")==2
    # в список: задача остаётся в «Нужно делать» с меткой колонки
    pg.evaluate("()=>{UI.env='list';GF.backlog=true;render()}");assert 'Дом' in pg.inner_text('.card[data-cid=a]')
    # возвращаем в «Сегодня» — колонка сбрасывается
    pg.evaluate("()=>{UI.env='kanban';render()}")
    s=pg.locator('.card[data-cid=a]').first.bounding_box();d=pg.locator('.col[data-board=status][data-key=today]').bounding_box()
    pg.mouse.move(s['x']+60,s['y']+s['height']/2);pg.mouse.down();pg.mouse.move(s['x']+80,s['y']+30,steps=4);pg.mouse.move(d['x']+d['width']/2,d['y']+d['height']-30,steps=12);pg.mouse.up();pg.wait_for_timeout(300)
    assert pg.evaluate("()=>[byId('a').where,!byId('a').col]")==['today',True]
    # удаление колонки — задачи уходят в «Нужно делать»
    pg.locator(f'.col[data-key="{key}"] [data-a=delcol]').click();pg.wait_for_timeout(200)
    assert pg.evaluate("()=>S.cols.length")==0 and pg.locator('.col[data-key=backlog] .card').count()==2,pg.locator('.col[data-key=backlog] .card').count()
    # перезагрузка: колонки помнятся
    pg.click('#addcol');pg.reload();pg.wait_for_selector('#viewSeg button');assert pg.evaluate("()=>S.cols.length")==1
    assert errs==[],errs;print("ERRORS:",errs)
