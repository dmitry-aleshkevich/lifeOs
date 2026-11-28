# меню «⋯», задача-чек, полоска таймера, пуши в Telegram (витрина и ответы бота), настройки уведомлений
from playwright.sync_api import sync_playwright
from paths import URL
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_context(viewport=dict(width=1200, height=900)).new_page()
    errs = []
    pg.clock.install(time="2026-11-28T13:00:00")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("localStorage.setItem('lifeos.v1',JSON.stringify({tasks:[],routines:{morning:[],evening:[]}}))")
    pg.goto(URL + "/v2b/build.html")
    pg.wait_for_selector('#viewSeg button')
    pg.clock.run_for(2000)
    ev = pg.evaluate
    ev("""()=>{S.tasks=[];S.day.phase='day';S.morningOnly=false;
      const mk=(id,f)=>S.tasks.push(Object.assign(task(Object.assign({name:id},f),{type:'дела',where:'today'}),{id}));
      mk('call',{min:15,at:'14:00',due:'2026-11-28',desc:'Обсудить смету'});mk('box',{min:0,at:'16:00',due:'2026-11-28'});mk('free',{min:0});save();render()}""")
    card = lambda i: pg.locator('.card[data-cid=%s]' % i).first
    menu = lambda i: card(i).locator(':scope>.more').click()
    item = lambda text: pg.locator('.pop button', has_text=text).first.click()

    # кнопок «Удалить» и «В календарь» на карточке больше нет; описание в открытой карточке одно
    card('call').locator('.txt').click(position=dict(x=300, y=10))
    assert pg.locator('.card.open .panel').count() == 1
    assert pg.locator('.card.open .gcb, .card.open .panel .danger').count() == 0
    assert not card('call').locator('.meta .desc').is_visible()
    ev("()=>{UI.open=null;render()}")

    # задача-чек: время есть, длительности нет — без кнопки запуска; без времени кнопка остаётся
    assert card('box').locator('.mins').count() == 0
    assert card('free').locator('.mins').count() == 1
    assert card('call').locator('.mins').count() == 1

    # пуш из меню: колокольчик и витрина для бота
    assert ev("()=>botDocs()['bot-plan'].pushes") == []
    menu('call'); item('Пуш в Telegram'); item('за 15 мин')
    assert ev("()=>byId('call').push") == {"before": 15}
    assert card('call').locator('.bellm').count() == 1
    r = ev("()=>botDocs()['bot-plan'].pushes")
    assert r == [{"id": "call", "name": "call", "min": 15, "day": "2026-11-28", "time": "14:00", "before": 15, "done": False, "run": None}], r
    menu('call'); item('Пуш в Telegram'); item('Без пуша')
    assert ev("()=>byId('call').push") is None and card('call').locator('.bellm').count() == 0
    # без времени — открывается выбор даты и времени
    menu('free'); item('Пуш в Telegram'); item('в момент начала')
    assert ev("()=>UI.dt") == 'free' and ev("()=>botDocs()['bot-plan'].pushes") == []
    ev("()=>{UI.dt=null;UI.open=null;delete byId('free').push;save();render()}")

    # перенос: +1 час от времени задачи, на завтра
    menu('box'); item('Перенести'); item('На 1 час')
    assert ev("()=>[byId('box').at,byId('box').due,byId('box').where]") == ['17:00', '2026-11-28', 'today']
    menu('box'); item('Перенести'); item('На завтра')
    assert ev("()=>[byId('box').due,byId('box').where]") == ['2026-11-29', 'tomorrow']
    # время уже прошло — через час от сейчас
    ev("()=>{const t=byId('box');t.at='09:00';t.due='2026-11-28';t.where='today';save();render()}")
    menu('box'); item('Перенести'); item('На 1 час')
    assert ev("()=>byId('box').at") in ('14:00', '14:01')

    # длительность из меню: чек-задача получает кнопку
    menu('box'); item('Длительность'); item('10 мин')
    assert ev("()=>byId('box').min") == 10 and card('box').locator('.mins').count() == 1

    # правая кнопка по карточке открывает то же меню; удаление и отмена
    card('free').click(button='right', position=dict(x=300, y=15))
    item('Удалить')
    assert ev("()=>!byId('free')")
    pg.keyboard.press('Control+z')
    assert ev("()=>!!byId('free')")

    # крестик в углу удаляет, Cmd+Z возвращает
    card('free').hover()
    card('free').locator(':scope>.x').dispatch_event('click')   # справа могут лежать плавающие кнопки
    assert ev("()=>!byId('free')")
    pg.keyboard.press('Control+z')
    assert ev("()=>!!byId('free')")

    # полоска таймера: идёт, пауза, время вышло, после «Готово» исчезает
    line = card('call').locator(':scope>.tline')
    assert line.count() == 0
    ev("()=>{startT(byId('call'));render()}")
    pg.clock.run_for(9 * 60 * 1000)
    w = float(line.locator('i').evaluate("n=>parseFloat(n.style.width)"))
    assert 58 < w < 62, w
    ev("()=>{pauseT(byId('call'));save();render()}")
    pg.clock.run_for(1000)
    assert 'pause' in line.get_attribute('class')
    ev("()=>{startT(byId('call'))}")
    pg.clock.run_for(8 * 60 * 1000)
    assert 'over' in line.get_attribute('class')
    # бегущий таймер виден боту
    ev("()=>{byId('call').push={before:0};save()}")
    run = ev("()=>botDocs()['bot-plan'].pushes.find(x=>x.id==='call').run")
    assert run["pausedAt"] == 0 and run["endsAt"] > 0 and run["at"] > 0, run
    ev("()=>{complete(byId('call'))}")
    pg.clock.run_for(1000)
    assert card('call').locator(':scope>.tline').count() == 0

    # ответы бота: событие прошлого дня тоже применяется, каждое — один раз
    ev("""()=>{const a=Date.now();window.__doc={schema:1,days:{'2026-11-27':[{item:'box',kind:'move',done:false,to:{day:'2026-11-29',time:'10:30'},at:a,by:'bot'}],
      '2026-11-28':[{item:'free',kind:'task',done:true,at:a,by:'bot',spent:120000}]}};checkinsApply(__doc)}""")
    assert ev("()=>[byId('box').due,byId('box').at,byId('box').where]") == ['2026-11-29', '10:30', 'tomorrow']
    assert ev("()=>[byId('free').done,byId('free').spent]") == [True, 120000]
    ev("()=>{byId('box').at='11:00';byId('free').done=false;save();checkinsApply(__doc)}")
    assert ev("()=>[byId('box').at,byId('free').done]") == ['11:00', False]
    # таймер задачи из бота: запуск, затем пауза
    ev("""()=>{const a=Date.now()+1000;checkinsApply({days:{},taskRuns:{box:{at:a,startedAt:a,endsAt:a+600000,pausedAt:0},nope:null}})}""")
    assert ev("()=>[!!byId('box').tm,byId('box').tm.run]") == [True, True]
    ev("""()=>{const a=Date.now()+60000,s=byId('box').tm.at;checkinsApply({days:{},taskRuns:{box:{at:a,startedAt:s,endsAt:s+600000,pausedAt:s+30000}}})}""")
    assert ev("()=>[byId('box').tm.run,byId('box').acc]") == [False, 30000]

    # настройки: пока не трогали — документа нет; изменение пишет bot-pushcfg
    assert ev("()=>!('bot-pushcfg' in botDocs())")
    pg.click('#nbtn')
    assert pg.locator('#npop .npr').count() == 4
    assert pg.locator('#npop input[type=time][data-k=finance]').input_value() == '23:00'
    pg.fill('#npop input[type=time][data-k=finance]', '22:15')
    pg.locator('#npop input[type=time][data-k=finance]').dispatch_event('change')
    pg.locator('#npop input[type=checkbox][data-k=evening]').uncheck()
    cfg = ev("()=>botDocs()['bot-pushcfg']")
    assert cfg["finance"] == {"on": True, "time": "22:15"} and cfg["evening"]["on"] is False and cfg["morning"] == {"on": True, "time": "09:00"}, cfg
    # время вне допустимых границ подрезается
    pg.fill('#npop input[type=time][data-k=finance]', '03:00')
    pg.locator('#npop input[type=time][data-k=finance]').dispatch_event('change')
    assert ev("()=>botDocs()['bot-pushcfg'].finance.time") == '12:00'
    pg.click('#npop .fbx')
    assert pg.locator('#npop').count() == 0
    assert errs == [], errs
    print("ERRORS:", errs)
    b.close()
