import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=1000))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(500)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.evaluate("()=>{const s=JSON.parse(localStorage.getItem('lifeos.v1'));const pj=s.work.projects[0];s.work.tasks.push({id:'tA',name:'Сделать анимацию',project:pj.id,stage:pj.stages[0].id,status:'todo',est:30,acc:720000,note:'Сделать loop под экран 3×1',check:[{id:'c1',text:'Раскадровка',done:true},{id:'c2',text:'Рендер',done:false}],ord:-5});s.updatedAt=Date.now();localStorage.setItem('lifeos.v1',JSON.stringify(s));}")
    pg.reload(); pg.wait_for_timeout(500)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.click("#views button:has-text('Работа')"); pg.wait_for_timeout(300)
    c=pg.locator('.wcard[data-id="tA"]'); t=c.inner_text(); print(t.replace("\n"," | "))
    assert "%" not in t and "1/2" in t and "12 из 30" in t and c.locator(".wpi").count()==1
    c.locator(".wct").click(position={"x":200,"y":5}) if False else c.click(position={"x":150,"y":60}); pg.wait_for_timeout(300)
    assert c.locator(".wpr").count()==1, "editor not opened"
    assert c.locator(".wf-name").count()==0
    c.locator('.wpb[data-k=pri]').click(); pg.wait_for_timeout(150)
    c.locator('.wpop .chip:has-text("Срочно")').click(); pg.wait_for_timeout(200)
    c=pg.locator('.wcard[data-id="tA"]')
    c.locator('.wpb[data-k=date]').click(); c.locator('.wpop .chip:has-text("Завтра")').click(); pg.wait_for_timeout(200)
    c=pg.locator('.wcard[data-id="tA"]')
    c.locator(".wf-ckadd").fill("Проверка"); c.locator(".wf-ckadd").press("Enter"); pg.wait_for_timeout(200)
    pg.screenshot(path="/tmp/ed.png",clip={"x":0,"y":240,"width":700,"height":560})
    tk=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).work.tasks.find(t=>t.id==='tA')")
    assert tk["pri"]==2 and tk["date"] and len(tk["check"])==3, tk
    pg.reload(); pg.wait_for_timeout(500)
    tk=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).work.tasks.find(t=>t.id==='tA')"); assert tk.get("pri")==2
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
