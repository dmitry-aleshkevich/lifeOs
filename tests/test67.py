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
    pg.fill("#tdQa","Тест 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    assert pg.locator("li.task:has-text('Тест')").count()==1 and pg.evaluate("document.activeElement.id")=="tdQa"
print("ERRORS:",errs)
