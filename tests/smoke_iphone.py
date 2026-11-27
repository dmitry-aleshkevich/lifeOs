# Смоук в WebKit (движок Safari) с эмуляцией iPhone: Beta 2.0 открывается, вкладки и окружения переключаются, заглушка старого адреса ведёт на корень.
import sys, json
from playwright.sync_api import sync_playwright
from paths import ROOT, URL
V1 = {"tasks": [{"id": "a", "name": "Дело", "where": "today"}], "routines": {"morning": [], "evening": []}}
errs = []
assert 'location.replace("../"' in (ROOT / "v2b" / "index.html").read_text("utf8"), "старый адрес не ведёт на корень"
with sync_playwright() as p:
    b = p.webkit.launch()
    pg = b.new_context(**p.devices["iPhone 13"]).new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("if(!localStorage.getItem('lifeos.v2b'))localStorage.setItem('lifeos.v1',%s)" % json.dumps(json.dumps(V1)))
    pg.goto(URL + "/v2b/build.html"); pg.wait_for_selector("#viewSeg button")
    assert pg.locator("#viewSeg button").count() >= 6, "нет вкладок"
    for name in ["Работа", "Сценарии", "Привычки", "Итоги", "Карта", "Дела"]:
        pg.locator("#viewSeg button", has_text=name).dispatch_event("click"); pg.wait_for_timeout(150)
    assert pg.locator("body").inner_text().strip(), "пустая страница"
    b.close()
print("ERRORS:", errs); sys.exit(1 if errs else 0)
