# v2: таймер (один бегущий, пауза, овертайм со звуком, +мин по ПКМ) и фокус (пресеты, память, автостарт)
import sys, json
from playwright.sync_api import sync_playwright
errs=[]
V1={"tasks":[{"id":"a","name":"Задача А","where":"today","min":10},{"id":"b","name":"Задача Б","where":"today","min":20},
             {"id":"c","name":"Задача В","where":"today","min":30},{"id":"d","name":"Без времени","where":"today","min":0}],
    "routines":{},"work":{"tasks":[],"projects":[]},"projects":[]}
def pill(pg,i): return pg.locator(f'.mins[data-tid="{i}"]')
def off(pg,ms): pg.evaluate(f"window.__off=(window.__off||0)+{ms}"); pg.wait_for_timeout(700)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    ctx=b.new_context(viewport=dict(width=1100,height=900)); pg=ctx.new_page()
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_timeout(400)
    assert pill(pg,"a").inner_text()=="▶ 10 мин", pill(pg,"a").inner_text()
    # старт А, затем Б: А замораживается
    pill(pg,"a").click(); pg.wait_for_timeout(700); assert pill(pg,"a").inner_text().startswith("⏸ 10:0") or pill(pg,"a").inner_text().startswith("⏸ 9:5"), pill(pg,"a").inner_text()
    pill(pg,"b").click(); pg.wait_for_timeout(700)
    assert "pause" in pill(pg,"a").get_attribute("class") and pill(pg,"a").inner_text()[:2]=="▶ ", pill(pg,"a").inner_text()
    assert "run" in pill(pg,"b").get_attribute("class")
    frozen=pill(pg,"a").inner_text(); off(pg,3*60000); assert pill(pg,"a").inner_text()==frozen, "А не заморожена"
    # овертайм Б: красный, звук один раз
    off(pg,18*60000); assert "over" in pill(pg,"b").get_attribute("class"), pill(pg,"b").get_attribute("class")
    assert pill(pg,"b").inner_text().startswith("⏸ +"), pill(pg,"b").inner_text()
    assert pg.evaluate("window.__rings")==1, pg.evaluate("window.__rings")
    # +5 по ПКМ: красный уходит, идёт отсчёт добавки, потом снова овертайм и второй звук
    pill(pg,"b").click(button="right"); assert pg.is_visible(".pop"); pg.click('.pop button:has-text("+ 5 мин")'); pg.wait_for_timeout(700)
    assert "over" not in pill(pg,"b").get_attribute("class") and pill(pg,"b").inner_text() in ("⏸ 5:00","⏸ 4:59"), pill(pg,"b").inner_text()
    assert pg.evaluate("window.__rings")==1
    off(pg,6*60000); assert "over" in pill(pg,"b").get_attribute("class") and pg.evaluate("window.__rings")==2
    # пауза в овертайме замораживает
    pill(pg,"b").click(); pg.wait_for_timeout(700); t0=pill(pg,"b").inner_text(); off(pg,5*60000)
    assert pill(pg,"b").inner_text()==t0 and t0.startswith("▶ +"), t0
    # перезагрузка: состояние таймеров сохранилось
    pg.reload(); pg.wait_for_timeout(500); assert pill(pg,"b").inner_text()==t0, pill(pg,"b").inner_text()
    # безвременная задача: секундомер вверх
    pill(pg,"d").click(); pg.wait_for_timeout(300); off(pg,65000); assert pill(pg,"d").inner_text().startswith("⏸ 1:"), pill(pg,"d").inner_text()
    pill(pg,"d").click(); pg.wait_for_timeout(300)
    # ---- фокус ----
    assert pg.is_visible("#fbtn"); pg.click("#fbtn"); pg.wait_for_timeout(300)
    assert pg.locator(".card").count()==3, pg.locator(".card").count()   # первые 3
    pg.click("#fbtn",button="right"); pg.click('.pop button:has-text("30 мин")'); pg.wait_for_timeout(300)
    assert pg.locator(".card").count()==2, pg.locator(".card").count()   # А10 + Б20, В30 не влезает
    pg.reload(); pg.wait_for_timeout(500)
    assert "on" in pg.get_attribute("#fbtn","class") and pg.locator(".card").count()==2   # память после перезагрузки
    pg.click("#fbtn",button="right"); assert pg.is_visible('.pop button:has-text("Обновить набор")'); pg.keyboard.press("Escape"); pg.click("body",position=dict(x=5,y=5))
    # автостарт следующей: отметили А → через 3 с стартует Б
    pg.locator('.card:has-text("Задача А") .ck').click(); pg.wait_for_timeout(300); assert pg.is_visible("#toast")
    pg.wait_for_timeout(3300); assert not pg.is_visible("#toast")
    assert "pause" not in (pill(pg,"b").get_attribute("class") or "") and pill(pg,"b").inner_text().startswith("⏸"), pill(pg,"b").inner_text()
    # выключили фокус — обычный список
    pg.click("#fbtn"); pg.wait_for_timeout(300); assert "on" not in pg.get_attribute("#fbtn","class")
    b.close()
print("ERRORS:",errs); sys.exit(1 if errs else 0)
