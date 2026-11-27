import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1300,height=900)); pg=ctx.new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("dialog", lambda d: d.accept("Ремонт") if d.type=="prompt" else d.accept())
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","ТЕСТ ЗАДАЧА 10м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(200)
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(400)
    assert pg.locator(".pk-col").nth(0).locator("li.task:has-text('ТЕСТ ЗАДАЧА')").count()==1
    assert pg.locator(".pk-s:has-text('Работа')").count()>=1
    pg.click(".pk-new"); pg.wait_for_timeout(300); assert pg.locator(".pk-s:has-text('Ремонт')").count()==1
    pg.drag_and_drop(".pk-col >> nth=0 >> li.task:has-text('ТЕСТ ЗАДАЧА')", ".pk-s:has-text('Ремонт')"); pg.wait_for_timeout(300)
    t=pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('lifeos.v1'));const t=s.tasks.find(x=>x.name.startsWith('ТЕСТ ЗАДАЧА'));const p=s.projects.find(x=>x.id===t.project);return [t.where,p&&p.name]})()"); print(t); assert t[1]=="Ремонт"
    pg.drag_and_drop(".pk-col >> nth=0 >> li.task:has-text('ТЕСТ ЗАДАЧА')", ".pk-col >> nth=1"); pg.wait_for_timeout(300)
    assert pg.locator(".pk-col").nth(1).locator("li.task:has-text('ТЕСТ ЗАДАЧА')").count()==1
    pg.locator(".pk-col").nth(1).locator("li.task:has-text('ТЕСТ ЗАДАЧА') .name").click(); pg.wait_for_timeout(300)
    pg.screenshot(path="/tmp/pk2.png")
    pg.mouse.click(5,800); pg.wait_for_timeout(200)
    pg.locator(".pk-s:has-text('Ремонт') .pk-dm").click(); pg.wait_for_timeout(200); pg.click(".pk-menu [data-a=arc]"); pg.wait_for_timeout(300)
    assert pg.locator(".pk-arch:has-text('Ремонт')").count()==1
    pg.wait_for_timeout(1200); print(pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).projects.filter(p=>p.archived).length")); pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(1200); 
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(300); assert pg.locator(".pk-arch:has-text('Ремонт')").count()==1
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
