# time up on card: +5 мин / Готово; open card has a single linked-toggle (chip), no checkbox row
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=1000)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    # linked chip + open card
    li=pg.locator("li.task:has-text('Ужин')").first; li.locator(".name").click(); pg.wait_for_timeout(400)
    print("checkbox rows", pg.locator(".tdx-ln").count(), "chips", pg.locator("li.task:has-text('Ужин') > .lnk, li.task:has-text('Ужин') .lnk").count())
    assert pg.locator(".tdx-ln").count()==0 and pg.locator("li.task:has-text('Ужин') .lnk").count()==1
    pg.locator("li.task:has-text('Ужин') .lnk").first.click(); pg.wait_for_timeout(300)
    assert pg.locator("li.task.lnc").count()>=1, "chip must expand linked tasks"
    pg.keyboard.press("Escape"); pg.mouse.click(5,500); pg.wait_for_timeout(200)
    # timer expiry
    pg.evaluate("localStorage.setItem('lifeos.focus.v1','plan')")
    pg.evaluate("()=>{const j=JSON.parse(localStorage.getItem('lifeos.v1'));j.tasks.push({id:'tt1',name:'ТТ',min:1,done:false,spent:0,note:'',project:'',where:'today',sessions:0,acc:0,waitUntil:'',doneAt:0,due:'',at:''});localStorage.setItem('lifeos.v1',JSON.stringify(j));}")
    pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    row=pg.locator("li.task:has-text('ТТ')").first; row.locator(".mins").click(); pg.wait_for_timeout(300)
    pg.evaluate("()=>{const t=JSON.parse(localStorage.getItem('lifeos.timer.v1'));t.endsAt=Date.now()-1500;localStorage.setItem('lifeos.timer.v1',JSON.stringify(t));}"); pg.reload(); pg.wait_for_timeout(1500)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    row=pg.locator("li.task:has-text('ТТ')").first
    print("pill:", row.locator(".mins.live:not(.mins-add)").inner_text(), "| add:", row.locator(".mins-add").count())
    assert "Готово" in row.locator(".mins.live:not(.mins-add)").inner_text() and row.locator(".mins-add").count()==1
    assert row.locator(".mins-add").inner_text()=="+5 мин", row.locator(".mins-add").inner_text()
    row.locator(".mins-add").click(); pg.wait_for_timeout(500)
    r=pg.locator("li.task:has-text('ТТ') .mins.live").inner_text(); print("after +5:",r); assert "Готово" not in r
    assert pg.locator("li.task:has-text('ТТ') .mins-add").count()==0
    pg.locator("li.task:has-text('ТТ')").first.screenshot(path="/tmp/tt.png")
print("ERRORS:",errs)
