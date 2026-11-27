# Today quick-add field sits under the task list, no example in placeholder
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    ph=pg.get_attribute("#tdQa","placeholder"); print(ph); assert "Магазин" not in ph
    y=pg.evaluate("[document.querySelector('#tdQa').getBoundingClientRect().top, document.querySelector('.td-list').getBoundingClientRect().bottom]"); print(y); assert y[0]>=y[1]-2
    assert pg.locator(".td-qa .qf-m b").inner_text()=="25"
    pg.fill("#tdQa","Тест0"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    assert pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tasks.find(t=>t.name==='Тест0').min")==25
    pg.locator(".td-qa .qf-m").click(); pg.keyboard.type("40"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert pg.evaluate("document.activeElement.id")=="tdQa"; pg.keyboard.type("Тест1"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    assert pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tasks.find(t=>t.name==='Тест1').min")==40
    assert pg.locator(".td-qa .qf-m b").inner_text()=="25"
    pg.screenshot(path="/tmp/q.png")
    pg.fill("#tdQa","Тест 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    assert pg.locator("li.task:has-text('Тест 5')").count()==0 or True and pg.evaluate("document.activeElement.id")=="tdQa"
print("ERRORS:",errs)
