import sys
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"]); pg=b.new_page(viewport=dict(width=1300,height=1000))
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(600)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    nav=[x.strip() for x in pg.locator("#views button:visible").all_inner_texts()]; print(nav)
    assert nav==["Сегодня","План","Работа","Привычки","Итоги","Сценарии","Карта"]
    # editor: switch template to checklist, add item
    pg.click("#views button:has-text('Сценарии')"); pg.wait_for_timeout(300)
    tb=pg.locator(".tp-b").first; assert tb.locator(".sce-l li").count()==3
    tb.locator(".sce-add input").fill("Пол 7м"); tb.locator(".sce-add input").press("Enter"); pg.wait_for_timeout(200)
    pg.screenshot(path="/tmp/tpl.png",full_page=True)
    # take as subtasks
    pg.click("#views button:has-text('Сегодня')"); pg.wait_for_timeout(300)
    pg.fill("#tdQa",""); pg.type("#tdQa","Убор"); pg.wait_for_timeout(200)
    assert pg.is_visible(".tp-sug"); pg.keyboard.press("Tab"); pg.wait_for_timeout(300)
    s=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1'))")
    par=[t for t in s['tasks'] if t['name'].startswith('Уборка')][0]; kids=[t for t in s['tasks'] if t.get('link')==par['id']]
    print([k['name']+str(k['min']) for k in kids]); assert len(kids)==4 and kids[3]['min']==7
    # checklist mode
    pg.click("#views button:has-text('Сценарии')"); pg.wait_for_timeout(300)
    pg.locator(".tp-b").first.locator("[data-m=check]").click(); pg.wait_for_timeout(200)
    pg.click("#views button:has-text('Сегодня')"); pg.wait_for_timeout(300)
    pg.type("#tdQa","уборка"); pg.wait_for_timeout(200); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    s=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1'))")
    ck=[t for t in s['tasks'] if t.get('check')]; assert len(ck)==1 and len(ck[0]['check'])==4 and ck[0]['min']==27, ck
    li=pg.locator("li.task", has_text="1").first
    row=pg.locator("li.task:has(.tdckn)").first; assert "0/4" in row.inner_text()
    row.click(position={"x":120,"y":20}); pg.wait_for_timeout(300)
    pg.locator(".tdck-b").first.click(); pg.wait_for_timeout(200)
    pg.locator(".tdck-add").fill("Мусор"); pg.locator(".tdck-add").press("Enter"); pg.wait_for_timeout(200)
    pg.screenshot(path="/tmp/tdck.png")
    pg.wait_for_timeout(1200); pg.reload(); pg.wait_for_timeout(1200)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    s=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1'))")
    ck=[t for t in s['tasks'] if t.get('check')][0]; assert len(ck['check'])==5 and ck['check'][0]['done'], ck['check']
    assert "1/5" in pg.locator("li.task:has(.tdckn)").first.inner_text()
    # plain quick add still works
    pg.type("#tdQa","Магазин 10м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert any(t['name']=='Магазин' for t in pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tasks"))
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
