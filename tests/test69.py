from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1100,height=900)).new_page(); pg.on("pageerror",lambda e:errs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('lifeos.focus.v1','plan')"); pg.goto("file:///home/claude/work/lo/index.html"); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    # seed: personal + routine + work tasks
    pg.evaluate("""()=>{const j=JSON.parse(localStorage.getItem('lifeos.v1'));
      j.tasks=[{id:'p1',name:'Личная',min:10,where:'today',at:'18:00'},{id:'p2',name:'Вторая',min:5,where:'backlog'}];
      j.routines={morning:[{id:'m1',name:'Душ',min:10}],evening:[{id:'e1',name:'Кухня',min:10}]};
      j.work={projects:[{id:'wp',name:'П',stages:[{id:'s1',name:'э'}]},],tasks:[{id:'w1',name:'Рабочая',status:'todo',stage:'s1',project:'wp'},{id:'w2',name:'Подзадача',status:'todo',stage:'s1',project:'wp',parent:'w1'}]};
      localStorage.setItem('lifeos.v1',JSON.stringify(j));}""")
    pg.reload(); pg.wait_for_timeout(800)
    if pg.is_visible("#mscen"): pg.keyboard.press("Escape")
    before=pg.evaluate("localStorage.getItem('lifeos.v1')")
    # beta button lives in the settings popup and goes to v2
    pg.locator(".td-gear").click(); pg.wait_for_timeout(300)
    assert pg.is_visible("#betaV2"), "beta button missing"
    pg.locator("#betaV2").click(); pg.wait_for_timeout(900)
    assert "/v2/" in pg.url, pg.url
    txt=pg.inner_text("body"); print(txt[:400].replace("\n"," | "))
    assert "Ничего не потеряно" in txt, txt[:300]
    v2=pg.evaluate("JSON.parse(localStorage.getItem('lifeos.v2'))")
    names=[t["name"] for t in v2["tasks"]]; print(names)
    seeded=[n for n in names if n in ("Личная","Вторая","Душ","Кухня","Рабочая","Подзадача")]
    assert seeded==["Личная","Вторая","Душ","Кухня","Рабочая","Подзадача"], seeded
    byname={t["name"]:t for t in v2["tasks"]}
    assert byname["Душ"]["routine"]=="morning" and byname["Кухня"]["routine"]=="evening"
    assert byname["Рабочая"]["kind"]=="work" and byname["Рабочая"]["status"]=="todo"
    assert byname["Подзадача"]["link"]=="w1" and byname["Подзадача"]["rel"]=="post"
    assert byname["Личная"]["at"]=="18:00"
    assert [t["ord"] for t in v2["tasks"]]==list(range(len(v2["tasks"]))), "ord must be sequential"
    # v1 data untouched
    assert pg.evaluate("localStorage.getItem('lifeos.v1')")==before, "v2 must not touch v1 data"
    # back link returns to v1
    pg.locator("a.btn.primary").click(); pg.wait_for_timeout(800)
    assert "/v2/" not in pg.url and pg.locator("#vToday").count()==1
print("ERRORS:",errs)
