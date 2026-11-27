  function renderHabits() {
    const el = $("vHabits"); el.innerHTML = "";
    const col = document.createElement("div"); col.className = "col"; col.style.maxWidth = "760px";
    const today = dayISO(), mon = mondayOf(today);
    const days = [...Array(7)].map((_, i) => addDays(mon, i));
    const c = document.createElement("div"); c.className = "card";
    c.innerHTML = `<div class="card-h"><h2 class="card-t">${I.repeat}Эта неделя</h2><span class="sum">${fromISO(mon).getDate()} ${MON[fromISO(mon).getMonth()]} – ${fromISO(days[6]).getDate()} ${MON[fromISO(days[6]).getMonth()]}</span></div>`;
    const gw = document.createElement("div"); gw.className = "hgrid-wrap";
    const g = document.createElement("div"); g.className = "hgrid";
    g.innerHTML = `<span class="hd0"></span>` + days.map((d) => `<span class="hd${d === today ? " today" : ""}">${WD[fromISO(d).getDay()]}<br>${fromISO(d).getDate()}</span>`).join("") + `<span class="hd">серия</span>`;
    S.habits.forEach((h) => {
      const nm = document.createElement("div"); nm.className = "hname";
      if (editing) {
        nm.innerHTML = `<input type="text" class="field" value="${esc(h.name)}" maxlength="40" aria-label="Название привычки">`;
        const inp = nm.querySelector("input"); inp.onchange = () => { const v = inp.value.trim(); if (v) { h.name = v; persist(); } };
      } else nm.innerHTML = `<span>${esc(h.name)}</span>${h.auto ? `<span class="auto">отмечается само</span>` : h.days ? `<span class="auto">${h.days.map((d) => WD[d]).join(" / ")}</span>` : ""}`;
      g.appendChild(nm);
      days.forEach((d) => {
        const b = document.createElement("button");
        const on = habitDone(h.id, d), applies = habitApplies(h, d);
        b.className = "dot" + (on ? " on" : "") + (!applies && !on ? " off" : "");
        b.innerHTML = I.check; b.disabled = d > today;
        b.setAttribute("aria-label", `${h.name}, ${WD[fromISO(d).getDay()]}`);
        b.onclick = () => { setHabit(h.id, d, !on); persist(); render(); };
        g.appendChild(b);
      });
      const st = document.createElement("div");
      if (editing) {
        st.innerHTML = `<button class="icon-btn del" aria-label="Удалить привычку">${I.del}</button>`;
        st.querySelector("button").onclick = () => {
          if (armedDel !== h.id) { armedDel = h.id; st.querySelector("button").style.background = "var(--over-bg)"; return; }
          S.habits = S.habits.filter((x) => x !== h); armedDel = null; persist(); render();
        };
      } else { const n = streakOf(h); st.className = "streak" + (n >= 3 ? " hot" : ""); st.textContent = n ? n + " дн" : "—"; }
      g.appendChild(st);
    });
    gw.appendChild(g); c.appendChild(gw);
    const f = document.createElement("form"); f.className = "add-row"; f.autocomplete = "off";
    f.innerHTML = `<input type="text" class="field" id="newHabit" maxlength="40" placeholder="Новая привычка" style="flex:1 1 200px"><button type="submit" class="pill-btn" style="margin-left:0">Добавить</button>`;
    f.onsubmit = (e) => { e.preventDefault(); const v = f.querySelector("input").value.trim(); if (!v) return; S.habits.push({ id: uid(), name: v }); persist(); render(); };
    c.appendChild(f);
    col.appendChild(c);
    if (S.side.length) {
      const sc = document.createElement("div"); sc.className = "card";
      sc.innerHTML = `<div class="card-h"><h2 class="card-t">Сайд-квесты</h2><span class="sum">без контроля, для удовольствия</span></div>` + S.side.map((s) => `<div class="name" style="font-size:15px">${esc(s.t)}</div>`).join("");
      col.appendChild(sc);
    }
    el.appendChild(col);
  }

  function renderStats() {
    const el = $("vStats"); el.innerHTML = "";
    const col = document.createElement("div"); col.className = "col"; col.style.maxWidth = "760px";
    const today = dayISO();
    const mon = addDays(mondayOf(today), statsOffset * 7), sun = addDays(mon, 6);
    const inWeek = (iso) => iso >= mon && iso <= sun;
    const head = document.createElement("div"); head.className = "card-h";
    head.innerHTML = `<h2 class="card-t">${I.chart}${statsOffset === 0 ? "Эта неделя" : statsOffset === -1 ? "Прошлая неделя" : "Неделя"} · ${fromISO(mon).getDate()}–${fromISO(sun).getDate()} ${MON[fromISO(sun).getMonth()]}</h2>
      <div class="wk-nav"><button class="icon-btn" id="wPrev" aria-label="Предыдущая неделя">${I.chevL}</button><button class="icon-btn" id="wNext" aria-label="Следующая неделя"${statsOffset >= 0 ? " disabled" : ""}>${I.chevR}</button></div>`;
    col.appendChild(head);
    head.querySelector("#wPrev").onclick = () => { statsOffset--; render(); };
    head.querySelector("#wNext").onclick = () => { if (statsOffset < 0) { statsOffset++; render(); } };

    const log = S.log.filter((e) => inWeek(e.d));
    const total = log.reduce((s, e) => s + e.ms, 0);
    const finished = log.filter((e) => e.f).length;
    const lastDay = statsOffset === 0 ? today : sun;
    let hPossible = 0, hDone = 0;
    for (let d = mon; d <= lastDay; d = addDays(d, 1)) S.habits.forEach((h) => { if (habitApplies(h, d)) { hPossible++; if (habitDone(h.id, d)) hDone++; } });
    const sleeps = Object.entries(S.sleep).filter(([d]) => inWeek(d)).map(([d, s]) => ({ d, ...s, ms: s.wake - s.bed })).filter((s) => s.ms > 0 && s.ms < 20 * 3600e3);
    const avgSleep = sleeps.length ? sleeps.reduce((s, x) => s + x.ms, 0) / sleeps.length : 0;
    const tiles = document.createElement("div"); tiles.className = "tiles";
    tiles.innerHTML = [[total ? durShort(total) : "0", "по таймерам"], [finished, "задач закрыто таймером"], [hPossible ? Math.round(hDone / hPossible * 100) + "%" : "—", "привычек выполнено"], [avgSleep ? durShort(avgSleep) : "—", "сон в среднем"]]
      .map(([b, s]) => `<div class="tile"><b>${b}</b><span>${s}</span></div>`).join("");
    col.appendChild(tiles);

    // time by project
    const byP = {};
    log.forEach((e) => { byP[e.p || ""] = (byP[e.p || ""] || 0) + e.ms; });
    const rows = Object.entries(byP).sort((a, b) => b[1] - a[1]);
    const pc = document.createElement("div"); pc.className = "card";
    pc.innerHTML = `<div class="card-h"><h2 class="card-t">Куда ушло время</h2></div>`;
    if (!rows.length) pc.innerHTML += `<div class="empty">Запускай задачи с таймером, и здесь появится, сколько времени ушло на каждый проект.</div>`;
    const max = rows.length ? rows[0][1] : 1;
    rows.forEach(([pid, ms]) => {
      const p = proj(pid);
      const name = pid === "_routine" ? "Рутины" : p ? p.name : "Без проекта";
      const color = pid === "_routine" ? "violet" : p ? p.color : "gray";
      const r = document.createElement("div"); r.className = "brow";
      r.innerHTML = `<span class="bl">${esc(name)}</span><span class="bt"><i class="pc-${color}" style="width:${Math.max(3, ms / max * 100)}%;background:var(--pc-${color})"></i></span><span class="bv">${durShort(ms)}</span>`;
      pc.appendChild(r);
    });
    col.appendChild(pc);

    // habits
    const hc = document.createElement("div"); hc.className = "card";
    hc.innerHTML = `<div class="card-h"><h2 class="card-t">Привычки</h2></div>`;
    S.habits.forEach((h) => {
      let pos = 0, dn = 0;
      for (let d = mon; d <= lastDay; d = addDays(d, 1)) if (habitApplies(h, d)) { pos++; if (habitDone(h.id, d)) dn++; }
      const r = document.createElement("div"); r.className = "brow";
      r.innerHTML = `<span class="bl">${esc(h.name)}</span><span class="bt"><i style="width:${pos ? dn / pos * 100 : 0}%;background:var(--done)"></i></span><span class="bv">${dn} из ${pos}</span>`;
      hc.appendChild(r);
    });
    col.appendChild(hc);

    // sleep
    const sc = document.createElement("div"); sc.className = "card";
    sc.innerHTML = `<div class="card-h"><h2 class="card-t">${I.moon}Сон</h2><span class="sum">записывается сам: закрыл день → начал утро</span></div>`;
    if (!sleeps.length) sc.innerHTML += `<div class="empty">Пока нет ночей. Закрой день кнопкой «Пора завершать этот день», а утром начни утро.</div>`;
    const sl = document.createElement("div");
    sleeps.sort((a, b) => a.d < b.d ? -1 : 1).forEach((s) => {
      const r = document.createElement("div"); r.className = "srow";
      const good = s.ms >= 7 * 3600e3;
      r.innerHTML = `<span class="sd">${WD[fromISO(s.d).getDay()]} ${fromISO(s.d).getDate()}</span><span>${clock(s.bed)} → ${clock(s.wake)}</span><span class="sv" style="color:var(${good ? "--good-ink" : "--over-ink"})">${durShort(s.ms)}</span>`;
      sl.appendChild(r);
    });
    sc.appendChild(sl);
    col.appendChild(sc);
    el.appendChild(col);
  }

  function render() {
    const fe = document.activeElement, fid = fe && fe.id, pos = fe && fe.selectionStart;
    renderHeader(); fabSync(); try { navPlusSync(); } catch {} try { eveTick(); } catch {} document.querySelector(".wrap").classList.toggle("wide", view === "work" || view === "map" || view === "scen");
    if (view === "today") renderToday();
    else if (view === "tasks") renderTasks();
    else if (view === "habits") renderHabits();
    else if (view === "work") renderWork();
    else if (view === "map") renderMap();
    else if (view === "scen") renderScen();
    else renderStats();
    [["today", "vToday"], ["tasks", "vTasks"], ["habits", "vHabits"], ["stats", "vStats"], ["work", "vWork"], ["map", "vMap"], ["scen", "vScen"]].forEach(([v, id]) => { if (v !== view) $(id).replaceChildren(); });
    if (view !== "work") wLeave();
    qaInlMount(); pkPaint();
    if (fid) { const b = $(fid); if (b && b !== document.activeElement) { b.focus(); try { if (pos != null) b.setSelectionRange(pos, pos); } catch {} } }
  }
  $("editBtn").onclick = () => {
    editing = !editing; armedDel = null;
    $("editBtn").setAttribute("aria-pressed", editing);
    $("editBtn").innerHTML = editing ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg><span>Готово</span>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg><span>Править</span>'; $("editBtn").setAttribute("aria-label", editing ? "Готово" : "Править");
    render();
  };
  window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (["today", "tasks", "habits", "stats", "work", "map"].includes(h)) { view = h; render(); } });

