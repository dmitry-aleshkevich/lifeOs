# seamless add: ghost card, Enter adds & reopens, Esc closes; Plan columns; linked post/pre
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    names=lambda sel: pg.evaluate(f"[...document.querySelectorAll('{sel} li.task .name')].map(e=>e.textContent.trim()).filter(x=>/^(А|Б|В|Г)ТЕСТ/.test(x))")
    # Plan: add 2 in a row to Tomorrow
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(400)
    pg.locator(".pk-col[data-k=tomorrow] .pk-add").click(); pg.wait_for_timeout(300)
    assert pg.is_visible("#qinlIn") and not pg.is_visible("#qa")
    pg.keyboard.type("АТЕСТ 10м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    assert pg.evaluate("document.activeElement.id")=="qinlIn", "next input not focused"
    pg.keyboard.type("БТЕСТ 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    print("tomorrow", names(".pk-col[data-k=tomorrow]")); assert names(".pk-col[data-k=tomorrow]")==["АТЕСТ","БТЕСТ"]
    assert pg.locator("#qinlIn").count()==0
    # Today: FAB-less: N hotkey
    pg.locator("#views button[data-v=today]").click(); pg.wait_for_timeout(400)
    pg.mouse.click(5,600); pg.keyboard.press("n"); pg.wait_for_timeout(400)
    print("N opens inline:", pg.locator("#qinlIn").count(), "popup:", pg.locator("#qa").count())
    pg.keyboard.type("ВТЕСТ 15м #дом"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    assert pg.locator("#qinlIn").count()==0 and "ВТЕСТ" in names(".td-list")
    # linked post x2 in order
    t=pg.locator("li.task:has-text('ВТЕСТ')").first; t.scroll_into_view_if_needed(); t.hover(); pg.wait_for_timeout(200)
    t.locator(".lnp-post").click(force=True); pg.wait_for_timeout(300)
    pg.keyboard.type("ГТЕСТ 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400); pg.keyboard.type("ДТЕСТ 5м"); pg.keyboard.press("Enter"); pg.wait_for_timeout(400); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    print("today", pg.evaluate("[...document.querySelectorAll('.td-list li.task .name')].map(e=>e.textContent.trim()).filter(x=>/ТЕСТ/.test(x))"))
    pg.locator(".td-list").last.screenshot(path="/tmp/qi.png")
print("ERRORS:",errs)
