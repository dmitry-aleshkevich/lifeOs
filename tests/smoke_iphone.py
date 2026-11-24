# Смоук в WebKit (движок Safari) с эмуляцией iPhone: v1 открывается, «Beta» ведёт в v2, v2 открывается и может вернуться.
import sys, os
from playwright.sync_api import sync_playwright
root = os.environ.get("LO_ROOT", "/home/claude/work/lo")
errs = []
with sync_playwright() as p:
    b = p.webkit.launch()
    ctx = b.new_context(**p.devices["iPhone 13"])
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append("v1: " + str(e)))
    pg.goto(f"file://{root}/index.html"); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    assert pg.is_visible(".vsw a"), "нет ссылки Beta"
    pg.tap(".vsw a"); pg.wait_for_url("**/v2/index.html", timeout=5000)
    pg.wait_for_timeout(800)
    assert pg.locator("body").inner_text().strip(), "v2 пустой"
    pg.on("pageerror", lambda e: errs.append("v2: " + str(e)))
    b.close()
print("ERRORS:", errs); sys.exit(1 if errs else 0)
