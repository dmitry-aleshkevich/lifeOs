# linked pre/post tasks: created with "+", shown nested in Today and in Plan
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1000,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.fill("#tdQa","Позвонить в банк 15м"); pg.press("#tdQa","Enter"); pg.wait_for_timeout(300)
    for side,name in [("post","Записать итоги 5м"),("pre","Найти договор 5м")]:
        t=pg.locator("li.task:has-text('Позвонить')").first; t.scroll_into_view_if_needed(); t.hover(); pg.wait_for_timeout(150)
        t.locator(f".lnp-{side}").click(force=True); pg.wait_for_timeout(300)
        pg.keyboard.type(name); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
        if pg.is_visible("#qa"): pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    order=lambda sel: pg.evaluate(f"[...document.querySelectorAll('{sel} li.task .name')].map(e=>e.textContent.trim()).filter(x=>/Позвонить|Записать|Найти/.test(x))")
    print("today", order(".td-list"))
    pg.locator(".td-list").last.screenshot(path="/tmp/ln_today.png")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(500)
    print("plan", order(".pk-col"))
    pg.locator(".pk-col").first.screenshot(path="/tmp/ln_plan.png")
print("ERRORS:",errs)
