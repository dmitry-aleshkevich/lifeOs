# screenshots of every task-card state in Today and Plan: python3 cardshots.py <outdir> [w]
import sys, os
from playwright.sync_api import sync_playwright
out=sys.argv[1]; W=int(sys.argv[2]) if len(sys.argv)>2 else 900; os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=W,height=900), has_touch=W<500).new_page(); pg.on("pageerror",lambda e:print("PAGEERROR",e))
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/archive/v1/index.html"); pg.wait_for_timeout(700)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    for n in ["Позвонить в банк 18:00 15м","Купить продукты 10м","Готовая задача 5м"]: pg.fill("#tdQa",n); pg.press("#tdQa","Enter"); pg.wait_for_timeout(150)
    pg.evaluate("""(()=>{const s=JSON.parse(localStorage.getItem('lifeos.v1'));})()""")
    # make linked pre/post via app state
    pg.evaluate("""(()=>{})()""")
    ls=lambda: pg.locator(".td-list").last
    pg.locator("li.task:has-text('Готовая задача') .check").first.click(); pg.wait_for_timeout(300)
    pg.locator("li.task:has-text('Позвонить') .name").first.click(); pg.wait_for_timeout(300)
    pg.locator("li.task.tdopen .tdx-pi").nth(3).click(); pg.wait_for_timeout(150)
    if pg.locator("#wmenu button:has-text('Рост')").count(): pg.locator("#wmenu button:has-text('Рост')").click(); pg.wait_for_timeout(200)
    pg.locator("li.task:has-text('Позвонить') .name").first.click(); pg.wait_for_timeout(300)
    ls().screenshot(path=f"{out}/today_open.png")
    pg.locator("li.task:has-text('Купить') .mins").first.click(); pg.wait_for_timeout(1200)
    ls().screenshot(path=f"{out}/today_run.png")
    pg.locator("li.task:has-text('Купить') .mins.live").first.click(); pg.wait_for_timeout(400)
    pg.mouse.click(3,897); pg.wait_for_timeout(300)
    t=pg.locator("li.task:has-text('Позвонить')").first; bb=t.bounding_box(); pg.mouse.move(bb["x"]+bb["width"]/2, bb["y"]+bb["height"]-3); pg.wait_for_timeout(300)
    ls().screenshot(path=f"{out}/today_hover.png")
    pg.locator("#views button[data-v=tasks]").click(); pg.wait_for_timeout(500)
    pg.locator(".pk-cols").screenshot(path=f"{out}/plan.png")
    pg.locator(".pk-col li.task:has-text('Позвонить') .name").first.click(); pg.wait_for_timeout(300)
    pg.locator(".pk-cols").screenshot(path=f"{out}/plan_open.png")
print("ok")
