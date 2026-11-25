# поповер даты и времени: слоты 30 мин, ручной ввод, применить/отмена, занятые слоты
import json
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"Дело","where":"today"}],"routines":{"morning":[],"evening":[]}}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1200,height=900)).new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html");pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1));pg.reload();pg.wait_for_selector('#sysSeg button')
    pg.goto("file:///home/claude/work/lo/v2b/index.html");pg.wait_for_selector('#viewSeg button');pg.wait_for_timeout(300)
    def op():
        if not pg.locator(".card[data-cid=a] .dtbtn").count():pg.click(".card[data-cid=a]",position={"x":300,"y":10})
        pg.click(".card[data-cid=a] .dtbtn")
    op();pg.wait_for_selector(".dtp .dts")
    assert pg.locator(".dts").count()==36   # 6:00..23:30 каждые 30 минут
    assert pg.locator(".dts").first.inner_text()=="06:00" and pg.locator(".dts").last.inner_text()=="23:30"
    pg.click(".dts[data-t='10:30']");pg.click(".dd:not(.o):not(.s)")
    assert pg.evaluate("()=>byId('a').at")!="10:30"   # пока не нажали «Применить», ничего не сохранено
    pg.click(".dtp-ap");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>byId('a').at")=="10:30" and pg.evaluate("()=>byId('a').due")!=""
    pg.evaluate("()=>{byId('a').due=dayISO();byId('a').where='today';save();render()}")
    op();pg.wait_for_selector(".dtp .dts")
    pg.fill(".dtp .ptime","1020");pg.press(".dtp .ptime","Enter");pg.wait_for_timeout(100)   # ручной ввод + Enter = применить
    assert pg.evaluate("()=>byId('a').at")=="10:20"
    op();pg.wait_for_selector(".dtp .dts")
    pg.click(".dts[data-t='18:00']");pg.click(".dtp .chipb:has-text('Отмена')");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>byId('a').at")=="10:20"   # отмена не меняет
    # занятые слоты из календаря (подставной токен и fetch)
    pg.evaluate("""()=>{GC.tok='x';GC.exp=Date.now()+3600000;const d=byId('a').due;const f=window.fetch;
      window.fetch=(u,o)=>String(u).includes('googleapis')?Promise.resolve({ok:true,json:()=>Promise.resolve({items:[{id:'e1',start:{dateTime:d+'T12:00:00'},end:{dateTime:d+'T13:00:00'}}]})}):f(u,o)}""")
    op();pg.wait_for_selector(".dtp .dts");pg.wait_for_selector(".dts.busy")
    assert pg.locator(".dts.busy").count()==2   # 12:00 и 12:30
    pg.click(".dtp .chipb:has-text('Убрать')");pg.wait_for_timeout(100)
    assert pg.evaluate("()=>byId('a').at")=="" and pg.evaluate("()=>byId('a').due")==""
    # наведение на кнопку даты открывает поповер; дата по умолчанию — сегодня; список времени стоит на текущем слоте
    pg.evaluate("()=>{byId('a').at='';byId('a').due='';save();render()}");pg.wait_for_timeout(100)
    if not pg.locator(".card[data-cid=a] .dtbtn").count():pg.click(".card[data-cid=a]",position={"x":300,"y":10})
    pg.hover(".card[data-cid=a] .dtbtn");pg.wait_for_selector(".dtp .dts",timeout=3000);pg.wait_for_timeout(150)
    assert pg.evaluate("()=>document.querySelector('.dd.s').dataset.k===dayISO()")
    assert pg.evaluate("()=>{const sl=document.querySelector('.dtp-slots'),n=new Date(),w=String(n.getHours()).padStart(2,'0')+':'+(n.getMinutes()<30?'00':'30');const e=[...sl.children].find(x=>x.dataset.t>=w);return !e||Math.abs(sl.scrollTop-(e.offsetTop-sl.offsetTop))<=sl.scrollHeight-sl.clientHeight+2}")
    assert errs==[],errs
    print("ERRORS:",errs)
