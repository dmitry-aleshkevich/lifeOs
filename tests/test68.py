from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    pg.locator("button[data-tri=cal]").click(); pg.wait_for_timeout(400)
    assert pg.locator("ul.td-list").count()==0, "day mode should have no list"
    pg.mouse.click(5,500); pg.keyboard.press("n"); pg.wait_for_timeout(300)
    assert pg.is_visible("#qa") and pg.is_visible("#qaIn") and pg.locator("#qinlIn").count()==0
    assert pg.locator("#qa .qf-m b").inner_text()=="25"
    assert pg.evaluate("document.activeElement.id")=="qaIn"
    # Esc closes
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200); assert pg.locator("#qa").count()==0
    # default 25, minutes pill edit, parseQuick "10м" wins
    pg.keyboard.press("n"); pg.wait_for_timeout(300)
    pg.keyboard.type("ПОП1"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300); assert pg.locator("#qa").count()==0
    pg.keyboard.press("n"); pg.wait_for_timeout(300)
    pg.locator("#qa .qf-m").click(); pg.keyboard.type("40"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    assert pg.evaluate("document.activeElement.id")=="qaIn"; pg.keyboard.type("ПОП2"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    pg.keyboard.press("n"); pg.wait_for_timeout(300)
    pg.keyboard.type("ПОП3 10м 18:10 завтра"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    r=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v1')).tasks.filter(t=>/^ПОП/.test(t.name)).map(t=>[t.name,t.min,t.at,t.where].join('|'))"); print(r)
    assert r==["ПОП1|25||today","ПОП2|40||today","ПОП3|10|18:10|tomorrow"]
print("ERRORS:",errs)
