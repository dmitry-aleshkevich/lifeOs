# канбан по проектам: цена проекта видна в шапке колонки
from playwright.sync_api import sync_playwright
from paths import URL
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport=dict(width=1300, height=900)).new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}))")
    pg.goto(URL + "/v2b/build.html")
    pg.wait_for_selector('#viewSeg button')
    pg.wait_for_timeout(300)
    ev = pg.evaluate
    ev("""()=>{S.morningOnly=false;S.day.phase='day';S.tasks=[];
      S.projects=[{id:'a',name:'YouTube shorts',color:'blue',type:'работа',price:'150000'},
        {id:'b',name:'Рилсы для очень длинного названия клиента',color:'orange',type:'работа',price:'1 500 $ за штуку'},
        {id:'c',name:'Без цены',color:'gray',type:'работа'}];
      S.tasks.push(task({name:'Reel',min:30},{type:'работа',project:'a',where:''}));
      UI.view='tasks';UI.sys='работа';UI.env='kanban';save();render()}""")
    head = lambda i: pg.locator('.col[data-board=project][data-key=%s] h3' % i)
    head('a').wait_for()
    price = head('a').locator('.hprice')
    assert price.count() == 1 and price.is_visible(), "цены нет в шапке"
    assert price.inner_text().replace(' ', ' ') == '150 000', price.inner_text()   # голое число читается по разрядам
    assert head('b').locator('.hprice').inner_text() == '1 500 $ за штуку'            # свой текст остаётся как есть
    assert head('c').locator('.hprice').count() == 0
    # шапка не вылезает за колонку, название и счётчики на месте
    for i in ('a', 'b'):
        col = pg.locator('.col[data-board=project][data-key=%s]' % i).bounding_box()
        for sel in ('.tag', '.hprice', '.hsum', '.cnt'):
            r = head(i).locator(sel).bounding_box()
            assert r['x'] >= col['x'] - 1 and r['x'] + r['width'] <= col['x'] + col['width'] + 1, (i, sel, r, col)
    # правка в окне «Проекты» сразу видна в шапке
    pg.click('#pbtn')
    inp = pg.locator('.prow[data-pid=c] .pprice')
    inp.fill('25000')
    inp.dispatch_event('change')
    assert head('c').locator('.hprice').inner_text().replace(' ', ' ') == '25 000'
    inp.fill('')
    inp.dispatch_event('change')
    assert head('c').locator('.hprice').count() == 0
    # телефон
    pg.set_viewport_size(dict(width=390, height=844))
    pg.evaluate("()=>render()")
    assert head('a').locator('.hprice').is_visible()
    assert errs == [], errs
    print("ERRORS:", errs)
    b.close()
