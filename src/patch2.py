s = open('base.html', encoding='utf8').read()
def rep(old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, (n, old[:90])
    s = s.replace(old, new)

wjs = open('work.js', encoding='utf8').read()
wcss = open('work.css', encoding='utf8').read()
rep('  function renderHabits() {', wjs + '\n  function renderHabits() {')
rep('/* timer */', wcss + '\n/* timer */')
# nav: 5 tabs
rep('nav.views { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));', 'nav.views { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));')
rep('@media (min-width: 900px) { nav.views { max-width: 560px; } }', '@media (min-width: 900px) { nav.views { max-width: 680px; } }')
rep('<main id="vStats" hidden></main>', '<main id="vStats" hidden></main>\n  <main id="vWork" hidden></main>\n  <main id="vMap" hidden></main>')
rep('["today", "tasks", "habits", "stats"].includes(location.hash.slice(1))', '["today", "tasks", "habits", "stats", "work", "map"].includes(location.hash.slice(1))')
rep('if (["today", "tasks", "habits", "stats"].includes(h))', 'if (["today", "tasks", "habits", "stats", "work", "map"].includes(h))')
rep('["stats", "Итоги", I.chart]];', '["stats", "Итоги", I.chart], ["work", "Работа", I.work], ["map", "Карта", I.map]];')
rep("    chart: '<svg", "    map: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.3\"/></svg>',\n    work: '<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"3\"/><path d=\"M9 7V5.5A1.5 1.5 0 0 1 10.500 4h3A1.5 1.5 0 0 1 15 5.500V7M3 13h18\"/></svg>',\n    chart: '<svg")
rep('["today", "tasks", "habits", "stats"].forEach((id) => { $("v" + id[0].toUpperCase() + id.slice(1)).hidden = id !== view; });', '["today", "tasks", "habits", "stats", "work", "map"].forEach((id) => { $("v" + id[0].toUpperCase() + id.slice(1)).hidden = id !== view; });')
rep('    else if (view === "habits") renderHabits();\n    else renderStats();', '    else if (view === "habits") renderHabits();\n    else if (view === "work") renderWork();\n    else if (view === "map") renderMap();\n    else renderStats();')
rep('["habits", "vHabits"], ["stats", "vStats"]]', '["habits", "vHabits"], ["stats", "vStats"], ["work", "vWork"], ["map", "vMap"]]')
# data
rep('habitLog: {}, log: [], sleep: {}, day: { closedAt: null, evening: null }, weeks: [], side: [],\n  });', 'habitLog: {}, log: [], sleep: {}, day: { closedAt: null, evening: null }, weeks: [], side: [], work: seedWork(),\n  });')
rep('      notes: String(d.notes || "").slice(0, 20000),\n', '      notes: String(d.notes || "").slice(0, 20000),\n      work: normWork(d.work),\n')
rep('    const t = S.tasks.find((x) => x.id === id);\n    return t ? { t, key: t.where } : null;', '    const t = S.tasks.find((x) => x.id === id);\n    if (t) return { t, key: t.where };\n    const w = S.work.tasks.find((x) => x.id === id);\n    return w ? { t: w, key: "work", work: true } : null;')
# sheet close hook
rep('function closeSheet() { sheetSpec = null; $("sheetBg").hidden = true; $("sheet").innerHTML = ""; }', 'function closeSheet() { const wasW = !!wSpec; sheetSpec = null; wSpec = null; $("sheetBg").hidden = true; $("sheet").innerHTML = ""; if (wasW && view === "work") renderWork(); }')
# timer
rep('<span class="mini-time" id="miniTime"></span></button>', '<span class="mini-time" id="miniTime"></span><span class="mini-b" id="miniPause" role="button" tabindex="0" aria-label="Пауза" hidden></span><span class="mini-b" id="miniDone" role="button" tabindex="0" aria-label="Готово" hidden>✓</span></button>')
rep('$("miniTime").classList.toggle("paused", mode === "paused"); return; }', '$("miniTime").classList.toggle("paused", mode === "paused"); miniCtl(mode); return; }')
rep('const p = f && !isRoutine(f.key) ? proj(f.t.project) : null;', 'const p = f && !isRoutine(f.key) ? (f.work ? wproj(f.t.project) : proj(f.t.project)) : null;')
rep('    if (f) {\n      const routine = isRoutine(f.key), t = f.t;', '    if (f && f.work) { const t = f.t; if (done) { t.spent = (t.acc || 0) + ms; wSetStatus(t, "done"); } else { t.acc = (t.acc || 0) + ms; t.sessions = (t.sessions || 0) + 1; persist(); } }\n    else if (f) {\n      const routine = isRoutine(f.key), t = f.t;')
rep('  $("mini").onclick = () =>', '''  function miniCtl(mode) { const w = !!T.work; $("miniPause").hidden = !w; $("miniDone").hidden = !w; if (w) $("miniPause").textContent = mode === "paused" ? "▶" : "⏸"; }
  $("miniPause").onclick = (e) => { e.stopPropagation(); if (T) T.endsAt == null ? resume() : pause(); };
  $("miniDone").onclick = (e) => { e.stopPropagation(); if (T) finish(true); };
  $("mini").onclick = () =>''')
rep('  function persist() {\n    S.updatedAt = Date.now();', '  function persist() {\n    wRecord();\n    S.updatedAt = Date.now();')
rep('S = d; lsSet(LS, S); firstSync = true;', 'S = d; wReset(); lsSet(LS, S); firstSync = true;')
rep('    renderHeader();\n    if (view === "today") renderToday();', '    renderHeader(); document.querySelector(".wrap").classList.toggle("wide", view === "work" || view === "map");\n    if (view === "today") renderToday();')
rep('["work", "vWork"], ["map", "vMap"]].forEach(([v, id]) => { if (v !== view) $(id).replaceChildren(); });', '["work", "vWork"], ["map", "vMap"]].forEach(([v, id]) => { if (v !== view) $(id).replaceChildren(); });\n    if (view !== "work") wLeave();')
rep('    const el = $("vToday"); el.innerHTML = "";\n    const today = dayISO();\n    const wrap = document.createElement("div"); wrap.className = "col";', '    const el = $("vToday"); el.innerHTML = "";\n    if (fMode) { renderFocus(el); return; }\n    const today = dayISO();\n    const wrap = document.createElement("div"); wrap.className = "col"; wrap.appendChild(focusSeg());')
rep('if (wantMorning || dayISO() > dayISO(S.day.closedAt)) { wantMorning = false; setTimeout(startMorning, 0); }', 'if (wantMorning || (dayISO() > dayISO(S.day.closedAt) && Date.now() - BOOT_TS < 20000)) { wantMorning = false; setTimeout(startMorning, 0); } // night screen with QR stays until scan/button; a fresh page load on a new day opens the morning')
rep('  // ---------- day cycle ----------\n', '  // ---------- day cycle ----------\n  const BOOT_TS = Date.now();\n')
rep('  $("tClose").onclick = () => closeTimer();','  $("tClose").onclick = () => { bankTimer(); closeTimer(); };')
rep('    const name = f ? f.t.name : "Задача";\n    const overMs','    const name = f ? f.t.name : "Задача";\n    if (T.work) wLive();\n    const overMs')
rep('    unlockSound();\n    T = { id, total: f.t.min * 60000','    unlockSound(); bankTimer();\n    T = { id, total: f.t.min * 60000')
# ---- resize day-calendar blocks (changes task minutes) ----
rep('      const pl = b.querySelector(".dplay"); if (pl) pl.onclick = (e) => { e.stopPropagation(); startTimer(t.id); };',
    '      if (!t.done && t.where !== "done") b.insertAdjacentHTML("beforeend", \'<span class="dres" title="Потяни, чтобы изменить длительность"></span>\');\n      const pl = b.querySelector(".dplay"); if (pl) pl.onclick = (e) => { e.stopPropagation(); startTimer(t.id); };')
rep('        dayDrag = { t, b, pid: e.pointerId, sy: e.clientY, sx: e.clientX, base: toMin(t.at), to: toMin(t.at), startH, dur: Math.max(t.min || 0, 15), active: false, mouse: e.pointerType === "mouse", timer: null };',
    '        const res = !!e.target.closest(".dres"); if (res) { e.preventDefault(); e.stopPropagation(); }\n        dayDrag = res ? { t, b, pid: e.pointerId, sy: e.clientY, sx: e.clientX, res: true, base: t.min || 15, to: t.min || 15, startH, active: false, mouse: true, timer: null }\n          : { t, b, pid: e.pointerId, sy: e.clientY, sx: e.clientX, base: toMin(t.at), to: toMin(t.at), startH, dur: Math.max(t.min || 0, 15), active: false, mouse: e.pointerType === "mouse", timer: null };')
rep('    if (commit && d.to !== d.base) { d.t.at = hhmm(d.to); persist(); }',
    '    if (commit && d.to !== d.base) { if (d.res) d.t.min = d.to; else d.t.at = hhmm(d.to); persist(); }')
rep('    e.preventDefault();\n    const lo = d.startH * 60, hi = 1440 - d.dur;',
    '    e.preventDefault();\n    if (d.res) {\n      const sn = snapV(), st = toMin(d.t.at), mx = 1440 - st;\n      d.to = Math.max(5, Math.min(mx, Math.round((d.base + (e.clientY - d.sy) / HR * 60) / sn) * sn));\n      d.b.style.height = Math.max(22, d.to / 60 * HR - 2) + "px"; d.b.classList.toggle("sm", d.to / 60 * HR < 40);\n      const ri = d.b.querySelector("i"); if (ri) ri.textContent = d.t.at + " · " + d.to + " мин";\n      d.b.dataset.dur = d.to + " мин"; return;\n    }\n    const lo = d.startH * 60, hi = 1440 - d.dur;')
rep('.dblk .dtx { min-width: 0;', '.dblk .dres { position: absolute; left: 0; right: 0; bottom: 0; height: 9px; cursor: ns-resize; touch-action: none; z-index: 3; }\n.dblk .dres::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 26px; height: 3px; margin-left: -13px; border-radius: 3px; background: currentColor; opacity: 0; transition: opacity .12s; }\n.dblk:hover .dres::after, .dblk.dragging .dres::after { opacity: .45; }\n@media (pointer: coarse) { .dblk .dres { height: 16px; } .dblk .dres::after { opacity: .35; } }\n.dblk.dragging[data-dur]::before { content: attr(data-dur); position: absolute; right: 6px; bottom: 10px; font-size: 11px; font-weight: 800; padding: 1px 6px; border-radius: 6px; background: var(--surface); color: var(--ink); z-index: 4; }\n.dblk .dtx { min-width: 0;')
# ---- UX pass: post-midnight times belong to the end of the day ----
rep('  const toMin = (str) => { const [h, m] = str.split(":").map(Number); return h * 60 + m; };\n  const hhmm = (m) => pad(Math.floor(m / 60)) + ":" + pad(m % 60);',
    '  const LATE_H = 5, toMin = (str) => { const [h, m] = str.split(":").map(Number); return (h < LATE_H ? h + 24 : h) * 60 + m; };\n  const hhmm = (m) => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };')
rep('return { t, s, e: Math.min(1440, s + Math.max(t.min || 0, 15)) }; })', 'return { t, s, e: Math.min((24 + LATE_H) * 60, s + Math.max(t.min || 0, 15)) }; })')
rep('    const endH = 24, H = (endH - startH) * HR;', '    let endH = 24; timed.forEach((t) => { endH = Math.max(endH, Math.ceil((toMin(t.at) + Math.max(t.min || 0, 15)) / 60)); }); endH = Math.min(24 + LATE_H, endH);\n    const H = (endH - startH) * HR;')
rep('l.innerHTML = `<span>${pad(h)}:00</span>`;', 'l.innerHTML = `<span>${pad(h % 24)}:00</span>`;')
rep('grid.dataset.start = startH;', 'grid.dataset.start = startH; grid.dataset.end = endH;')
rep('Math.min(24 * 60 - snapV(), startH * 60 +', 'Math.min(endH * 60 - snapV(), startH * 60 +')
rep('    const lo = d.startH * 60, hi = 1440 - d.dur;', '    const lo = d.startH * 60, hi = (+(document.querySelector(".dgrid") || {}).dataset?.end || 24) * 60 - d.dur;')
rep('const sn = snapV(), st = toMin(d.t.at), mx = 1440 - st;', 'const sn = snapV(), st = toMin(d.t.at), mx = (24 + LATE_H) * 60 - st;')
rep('    const m = minutesOfDay(Date.now()), s = +grid.dataset.start * 60;\n    if (m < s || m >= 1440) { n.hidden = true; return; }',
    '    let m = minutesOfDay(Date.now()); if (m < LATE_H * 60) m += 1440; const s = +grid.dataset.start * 60;\n    if (m < s || m >= (+grid.dataset.end || 24) * 60) { n.hidden = true; return; }')
# ---- UX pass: phone bottom tab bar with "Ещё" ----
rep('      nav.appendChild(b);\n    });',
    '      b.dataset.v = id; nav.appendChild(b);\n    });\n    const mb = document.createElement("button"); mb.className = "vmore"; mb.setAttribute("role", "tab"); mb.setAttribute("aria-selected", ["habits", "stats", "work", "map"].includes(view)); mb.setAttribute("aria-haspopup", "menu");\n    mb.innerHTML = \'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg><span>Ещё</span>\';\n    mb.onclick = (e) => { e.stopPropagation(); let pop = document.querySelector(".vpop"); if (pop) { pop.remove(); return; } pop = document.createElement("div"); pop.className = "vpop"; pop.setAttribute("role", "menu");\n      VIEWS.filter(([id]) => ["habits", "stats", "work", "map"].includes(id)).forEach(([id, label, icon]) => { const it = document.createElement("button"); it.setAttribute("role", "menuitem"); it.setAttribute("aria-current", id === view); it.innerHTML = icon + `<span>${label}</span>`; it.onclick = () => { pop.remove(); view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); }; pop.appendChild(it); });\n      document.body.appendChild(pop); setTimeout(() => document.addEventListener("pointerdown", function cl(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener("pointerdown", cl); } }), 0); };\n    nav.appendChild(mb);')
rep('    $("countPill").textContent = `До НГ ${days} дн`;', '    $("countPill").textContent = `До НГ ${days} дн`;\n    $("sub").insertAdjacentHTML("beforeend", `<span class="sub-ng"> · ${days} дн до НГ</span>`);')
rep('    $("editBtn").textContent = editing ? "Готово" : "Изменить";', '    $("editBtn").innerHTML = editing ? \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg><span>Готово</span>\' : \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg><span>Править</span>\'; $("editBtn").setAttribute("aria-label", editing ? "Готово" : "Править");')
rep('<button class="ghost" id="editBtn" aria-pressed="false">Изменить</button>', '<button class="ghost" id="editBtn" aria-pressed="false" aria-label="Править"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg><span>Править</span></button>')
# landmarks + contrast
rep('.ver { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted);', '.ver { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: color-mix(in srgb, var(--ink) 62%, var(--bg));')
rep('.sub { color: var(--muted); font-weight: 600; font-size: 13px;', '.sub { color: color-mix(in srgb, var(--ink) 66%, var(--bg)); font-weight: 600; font-size: 13px;')
rep('  <nav class="views" id="views" role="tablist"></nav>', '  <nav class="views" id="views" role="tablist" aria-label="Разделы"></nav>')
# ---- quick add parsing in task inputs ----
rep('        S.tasks.push({ id: uid(), name: v, min, done: false, spent: 0, note: "", project: ps ? ps.value : "", where, sessions: 0, acc: 0, waitUntil: where === "wait" ? addDays(dayISO(), 2) : "", doneAt: 0, due: "" });',
    '        const q = parseQuick(v), wh = q.where || where;\n        S.tasks.push({ id: uid(), name: q.name, min: q.min ?? min, done: false, spent: 0, note: "", project: q.project ?? (ps ? ps.value : ""), where: wh, sessions: 0, acc: 0, waitUntil: wh === "wait" ? addDays(dayISO(), 2) : "", doneAt: 0, due: "", at: q.at || "" });')
rep('  function addDayTask(name, min, project, at) {\n', '  function addDayTask(name, min, project, at) {\n    { const q = parseQuick(name); name = q.name; if (q.min != null) min = q.min; if (q.project != null) project = q.project; if (q.at) at = q.at; }\n')
# ---- smooth tab switch (View Transitions) ----
rep('      b.onclick = () => { view = id; lsSet(LS_VIEW, view); armedDel = null; saveUI(); render(); window.scrollTo({ top: 0 }); };',
    '      b.onclick = () => { const go = () => { view = id; lsSet(LS_VIEW, view); armedDel = null; saveUI(); render(); window.scrollTo({ top: 0 }); }; if (document.startViewTransition && id !== view && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(go); else go(); };')
# ---- morning kick: auto-start "Раздуплиться" + "Далее" chaining in routines ----
rep('    view = "today"; lsSet(LS_VIEW, view);\n    persist(); hideNight(); render();\n  }',
    '    view = "today"; lsSet(LS_VIEW, view);\n    persist(); hideNight(); render();\n    if (FORM() === "desk") setTimeout(morningKick, 300);\n  }\n  function morningKick() {\n    let r = S.routines.morning.find((x) => /^раздуплиться/i.test(x.name));\n    if (!r) { r = { id: uid(), name: "Раздуплиться ☕", min: 3, done: false, spent: 0, note: "" }; S.routines.morning.unshift(r); persist(); render(); }\n    if (!r.done && !T) startTimer(r.id);\n  }\n  function routineNext(f) {\n    if (!f || !isRoutine(f.key)) return null; const list = S.routines[f.key], i = list.indexOf(f.t);\n    return list.slice(i + 1).find((x) => !x.done && x.min > 0) || list.find((x) => !x.done && x.min > 0 && x !== f.t) || null;\n  }')
rep('          const first = !firstSync; S = d; wReset(); lsSet(LS, S); firstSync = true;',
    '          const first = !firstSync, wasNight = !!S.day.closedAt; S = d; wReset(); lsSet(LS, S); firstSync = true;\n          if (wasNight && !d.day.closedAt && !first && FORM() === "desk") setTimeout(morningKick, 300);')
rep('    if (mode === "done") box.append(btn("+5 мин", "btn", () => addTime(5)), btn("Готово ✓", "btn primary", () => finish(true)));',
    '    const nx = T && routineNext(findItem(T.id));\n    if (mode === "done" && nx) box.append(btn("+5 мин", "btn", () => addTime(5)), btn("Готово ✓", "btn", () => finish(true)), btn("Далее: " + nx.name + " ▶", "btn primary", () => { finish(true); startTimer(nx.id); }));\n    else if (mode === "done") box.append(btn("+5 мин", "btn", () => addTime(5)), btn("Готово ✓", "btn primary", () => finish(true)));')
# ---- inline timer in lists (no fullscreen for today/дела/routines) ----
rep('        li.appendChild(x);\n      }\n    } else {', '        li.appendChild(x);\n      }\n      if (T && !T.work && T.id === t.id) tinAttach(li, t, key);\n    } else {')
rep('    if (T.mini) { $("miniName").textContent = name;', '    if (!T.work && tinUpdate(f, txt, rem, mode)) return;\n    if (T.mini) { $("miniName").textContent = name;')
rep('      if (T.mini) { T.mini = false; showTimerView(); }', '      if (T.mini && T.work) { T.mini = false; showTimerView(); }')
rep('  function showTimerView() {\n    const mini = !!T.mini;', '  function showTimerView() {\n    if (!T.work) { const inl = document.querySelector(`.tin[data-id="${T.id}"]`); $("timer").hidden = true; $("mini").hidden = !!inl; document.body.classList.toggle("has-mini", !inl); document.body.style.overflow = $("night").hidden ? "" : "hidden"; return; }\n    const mini = !!T.mini;')
rep('    lsSet(LS_TIMER, T); openTimer();\n  }\n  function showTimerView', '    lsSet(LS_TIMER, T); openTimer(); render(); update(true);\n  }\n  function showTimerView')
rep('const APP_URL = "https://claude.ai/artifact/KgUzbJ5XGWFR33AUK4DiSL#morning";', 'const APP_URL = "https://claude.ai/artifact/Ue6VwVeMyucKqAcxjxkYeZ#morning";')
# ---- night screen: morning list under QR; any key/click after 5:00 starts the morning ----
rep('    <div class="qr" id="qr"></div>\n  </div>', '    <div class="qr" id="qr"></div>\n    <div class="n-list" id="nList"></div>\n  </div>')
rep('    <div class="n-sub">Утром отсканируй этот код телефоном, чтобы выключить будильник. Потом обнови страницу, и откроется утро.</div>', '    <div class="n-sub" id="nSub">Утром отсканируй код будильником. Потом нажми любую клавишу или кликни — утро начнётся само с «Раздуплиться».</div>')
rep('  function showNight() { renderQR();', '  function showNight() { renderQR(); nightList();')
rep('  $("nMorning").onclick = startMorning;', '  $("nMorning").onclick = startMorning;\n  function nightList() { const box = $("nList"); if (!box) return; let list = S.routines.morning, lh = "Утро"; try { mScenInit(); const nd = new Date(Date.now() + (new Date().getHours() >= 12 ? 864e5 : 0)).getDay(), sc = S.mScen.find((x) => x.id === ([1, 3, 5].includes(nd) ? "fast" : "home")); if (sc) { list = sc.items; lh = "Утро · " + sc.name + " (можно выбрать другое)"; } } catch {} box.innerHTML = list.length ? `<div class="n-lh">${esc(lh)}</div>` + list.slice(0, 14).map((t) => `<div class="n-li"><span>${esc(t.name)}</span><em>${t.min ? t.min + " мин" : ""}</em></div>`).join("") : ""; }\n  const nightWake = (e) => { if ($("night").hidden || !S.day.closedAt) return; if (e.target.closest && e.target.closest("#nBack")) return; if (Date.now() - S.day.closedAt < 3 * 3600e3) return; e.preventDefault && e.preventDefault(); startMorning(); };\n  document.addEventListener("keydown", nightWake, true); $("night").addEventListener("pointerdown", nightWake);')
# ---- "+" button instead of the inline add form for task lists ----
rep('  function addForm(key, opts = {}) {\n', '  function addForm(key, opts = {}) {\n    if (!isRoutine(key)) return qaButton(key, opts);\n')
# ---- minimal Today ----
rep('  function renderToday() {\n    const el = $("vToday"); el.innerHTML = "";\n    if (fMode)', '  function renderToday() { return renderToday2(); }\n  function renderTodayOld() {\n    const el = $("vToday"); el.innerHTML = "";\n    if (fMode)')
rep('  function render() {\n    const fe = document.activeElement, fid = fe && fe.id, pos = fe && fe.selectionStart;\n    renderHeader();', '  function render() {\n    const fe = document.activeElement, fid = fe && fe.id, pos = fe && fe.selectionStart;\n    renderHeader(); fabSync();')
rep("""    // add
    const ac = document.createElement("div"); ac.className = "card";
    ac.innerHTML = `<div class="card-h"><h2 class="card-t">${I.list}Новое дело</h2></div>`;
    ac.appendChild(addForm("backlog", { placeholder: "Например: собрать референсы для Iron Horse", where: true }));
    col.appendChild(ac);""", """    // tomorrow (moved here from Today)
    const ac = document.createElement("div"); ac.className = "card";
    const tmI = itemsOf("tomorrow").filter(kmatch);
    ac.innerHTML = `<div class="card-h"><h2 class="card-t">${I.sun}Завтра</h2><span class="sum">${sumLine(tmI)}</span></div>`;
    ac.appendChild(renderList("tomorrow", "Дела на завтра. Добавь через «+» внизу."));
    if (tmI.length) { const all = document.createElement("button"); all.className = "link"; all.style.alignSelf = "flex-start"; all.textContent = "Перенести всё в «Сегодня»"; all.onclick = () => { tmI.forEach((t) => moveTask(t, "today")); persist(); render(); }; ac.appendChild(all); }
    col.appendChild(ac);""")
# ---- desktop-only: cloud sync off ----

# ---- morning scenarios + Поработать opens Работа ----
rep('    if (FORM() === "desk") setTimeout(morningKick, 300);\n  }\n  function morningKick() {', '    if (FORM() === "desk") setTimeout(mScenPick, 300);\n  }\n  function morningKick() {')
rep('          if (wasNight && !d.day.closedAt && !first && FORM() === "desk") setTimeout(morningKick, 300);', '          if (wasNight && !d.day.closedAt && !first && FORM() === "desk") setTimeout(mScenPick, 300);')
rep('  function persist() {\n', '  function persist() {\n    try { mScenSave(); } catch {}\n')

rep('    const items = itemsOf(key).filter((t) => !filt || kmatch(t));\n    if (!items.length)', '    const items = lnOrder(itemsOf(key).filter((t) => (!filt || kmatch(t)) && !lnHidden(t)));\n    if (!items.length)')
rep('    items.forEach((t) => ul.appendChild(renderRow(t, key)));\n    enableDrag(ul);', '    items.forEach((t) => { const li = renderRow(t, key); if (!isRoutine(key) && !editing) lnDecor(li, t); ul.appendChild(li); });\n    enableDrag(ul);')
rep('    const timed = list.filter((t) => t.at), loose', '    const timed = list.filter((t) => t.at && !lnHidden(t)), loose')
rep('        if (!dayDrag.mouse) dayDrag.timer = setTimeout(() => { if (dayDrag && !dayDrag.active) beginDayDrag(); }, 350);\n      });\n      grid.appendChild(b);', '        if (!dayDrag.mouse) dayDrag.timer = setTimeout(() => { if (dayDrag && !dayDrag.active) beginDayDrag(); }, 350);\n      });\n      lnDecor(b, t);\n      grid.appendChild(b);')
rep('  function persist() {\n', '  function persist() {\n    try { lnSync(); } catch {}\n')
rep('  function moveTask(t, toKey, toIndex) {\n', '  function moveTask(t, toKey, toIndex) {\n    if (!t.link) S.tasks.filter((k) => k.link === t.id && !k.done).forEach((k) => { k.where = toKey; });\n')
rep('''    const i = S.tasks.indexOf(t); if (i < 0) return;
    S.tasks.splice(i, 1); persist(); render();
    toast("Задача удалена", "Отменить", () => { if (!S.tasks.includes(t)) { S.tasks.splice(Math.min(i, S.tasks.length), 0, t); persist(); render(); } });''', '''    const i = S.tasks.indexOf(t); if (i < 0) return;
    const kids = S.tasks.filter((k) => k.link === t.id); kids.forEach((k) => S.tasks.splice(S.tasks.indexOf(k), 1));
    S.tasks.splice(S.tasks.indexOf(t), 1); persist(); render();
    toast("Задача удалена", "Отменить", () => { if (!S.tasks.includes(t)) { S.tasks.splice(Math.min(i, S.tasks.length), 0, t); kids.forEach((k) => S.tasks.push(k)); persist(); render(); } });''')
rep('      li.querySelector(".go").onclick = t.min ? () => startTimer(t.id) : toggle;', '      li.querySelector(".go").onclick = (e) => { if (t.min && e.target.closest(".mins")) return startTimer(t.id); if (!t.min && !isTask) return toggle(); if (isTask) openSheet({ id: t.id }); else inlineEdit(li, t, li.querySelector(".go")); };\n      if (t.id === "work-auto") { const gw = document.createElement("button"); gw.className = "pen gowork"; gw.title = "Открыть Работу"; gw.setAttribute("aria-label", "Открыть Работу"); gw.innerHTML = \'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>\'; gw.onclick = (e) => { e.stopPropagation(); view = "work"; lsSet(LS_VIEW, view); saveUI(); render(); }; li.appendChild(gw); }')
rep('      if (T && !T.work && T.id === t.id) tinAttach(li, t, key);', '      if (T && !T.work && T.id === t.id && tdHideRun !== t.id && (!tdOpen || tdOpen === t.id)) { tinAttach(li, t, key); tdPen(li, t, key); tdLnBox(li.querySelector(".tin"), t, key); }\n      else if (tdOpen === t.id && !t.done) tdExpand(li, t, key);')
rep('      li.querySelector(".go").onclick = (e) => { if (t.min && e.target.closest(".mins")) return startTimer(t.id); if (!t.min && !isTask) return toggle(); if (isTask) openSheet({ id: t.id }); else inlineEdit(li, t, li.querySelector(".go")); };', '      li.querySelector(".go").onclick = (e) => { const nm = (tdOpen === t.id || (T && !T.work && T.id === t.id && tdHideRun !== t.id && !tdOpen)) ? tdNameHit(e) : null; if (nm) { e.stopPropagation(); return tdRename(nm, t); } if (t.min && e.target.closest(".mins")) { tdOpen = null; tdHideRun = null; return startTimer(t.id); } tdToggle(t); };')
rep('      b.onclick = () => openSheet({ id: t.id });\n      b.addEventListener("contextmenu"', '      b.onclick = (e) => { const nm = tdNameHit(e); if (nm) { e.stopPropagation(); return tdRename(nm, t); } openSheet({ id: t.id }); };\n      b.addEventListener("contextmenu"')
rep('due: /^\\d{4}-\\d\\d-\\d\\d$/.test(t.due || "") ? t.due : "", at: /^\\d\\d:\\d\\d$/.test(t.at || "") ? t.at : "" })),', 'due: /^\\d{4}-\\d\\d-\\d\\d$/.test(t.due || "") ? t.due : "", at: /^\\d\\d:\\d\\d$/.test(t.at || "") ? t.at : "", ...(t.link ? { link: String(t.link), rel: t.rel === "pre" ? "pre" : "post" } : {}), ...(t.lnOpen ? { lnOpen: true } : {}) })),')
rep('          if (notesDirty) d.notes = S.notes;\n', '          if (notesDirty) d.notes = S.notes;\n          if (!firstSync && (S.updatedAt || 0) > (d.updatedAt || 0)) { firstSync = true; setTimeout(persist, 0); return; }\n')
rep('    return {\n      v: 1,\n      projects: Array.isArray(d.projects)', '    return {\n      v: 1, updatedAt: Number(d.updatedAt) || 0,\n      projects: Array.isArray(d.projects)')
# ---- scenarios tab ----
rep('  <main id="vMap" hidden></main>', '  <main id="vMap" hidden></main>\n  <main id="vScen" hidden></main>')
rep('["today", "tasks", "habits", "stats", "work", "map"].includes(location.hash.slice(1))', '["today", "tasks", "habits", "stats", "work", "map", "scen"].includes(location.hash.slice(1))')
rep('["work", "Работа", I.work], ["map", "Карта", I.map]];', '["work", "Работа", I.work], ["map", "Карта", I.map], ["scen", "Сценарии", I.sun]];')
rep('mb.setAttribute("aria-selected", ["habits", "stats", "work", "map"].includes(view));', 'mb.setAttribute("aria-selected", ["habits", "stats", "work", "map", "scen"].includes(view));')
rep('VIEWS.filter(([id]) => ["habits", "stats", "work", "map"].includes(id))', 'VIEWS.filter(([id]) => ["habits", "stats", "work", "map", "scen"].includes(id))')
rep('    ["today", "tasks", "habits", "stats", "work", "map"].forEach((id) => { $("v" + id[0].toUpperCase() + id.slice(1)).hidden = id !== view; });', '    ["today", "tasks", "habits", "stats", "work", "map", "scen"].forEach((id) => { $("v" + id[0].toUpperCase() + id.slice(1)).hidden = id !== view; });')
rep('    else if (view === "map") renderMap();', '    else if (view === "map") renderMap();\n    else if (view === "scen") renderScen();')
rep('["work", "vWork"], ["map", "vMap"]].forEach(', '["work", "vWork"], ["map", "vMap"], ["scen", "vScen"]].forEach(')
rep('      v: 1, updatedAt: Number(d.updatedAt) || 0,', '      v: 1, updatedAt: Number(d.updatedAt) || 0, ...(Array.isArray(d.mScen) && d.mScen.length === 3 ? { mScen: d.mScen.map((sc) => ({ id: String(sc.id), name: String(sc.name || ""), icon: String(sc.icon || "•"), items: Array.isArray(sc.items) ? sc.items.map(normItem).map((x) => ({ id: x.id, name: x.name, min: x.min, note: x.note })) : [] })) } : {}), ...(d.mScenCur ? { mScenCur: String(d.mScenCur) } : {}),')
rep('classList.toggle("wide", view === "work" || view === "map");', 'classList.toggle("wide", view === "work" || view === "map" || view === "scen");')
# ---- daily plan template ----
plan_js = open('plan.js', encoding='utf8').read()
rep('    el.appendChild(page);\n  }\n\n  function renderHabits() {', '    planEditor(page);\n    el.appendChild(page);\n  }\n\n  function renderHabits() {')
rep('  function renderHabits() {', plan_js + '\n  function renderHabits() {')
rep('...(t.lnOpen ? { lnOpen: true } : {}) })),', '...(t.lnOpen ? { lnOpen: true } : {}), ...(t.tpl ? { tpl: String(t.tpl), tplDay: String(t.tplDay || "") } : {}) })),')
rep('...(d.mScenCur ? { mScenCur: String(d.mScenCur) } : {}),', '...(d.mScenCur ? { mScenCur: String(d.mScenCur) } : {}), ...(Array.isArray(d.plan) ? { plan: d.plan.map((b) => ({ id: String(b.id || uid()), name: String(b.name || "Блок"), at: /^\\d\\d:\\d\\d$/.test(b.at || "") ? b.at : "12:00", min: Math.max(0, Math.min(240, Number(b.min) || 0)), days: Array.isArray(b.days) ? [...new Set(b.days.map(Number).filter((x) => x >= 0 && x <= 6))] : [0, 1, 2, 3, 4, 5, 6], pre: (Array.isArray(b.pre) ? b.pre : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || ""), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })), post: (Array.isArray(b.post) ? b.post : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || ""), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })) })) } : {}), ...(d.planGen ? { planGen: String(d.planGen) } : {}),')
rep('  function checkDay() {\n', '  function checkDay() {\n    if (planSync()) persist();\n')
rep('    workTaskSync();\n    const items = itemsOf("today")', '    workTaskSync(); if (planSync()) persist();\n    const items = itemsOf("today")')
# ---- bug button ----
rep('  function renderHabits() {', open('bug.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('  checkDay();\n})();', '  checkDay();\n  bugInit();\n})();')
# ---- ТЗ 1: typing guard, morning hide ----
rep('          if (document.querySelector("input.inline")) return;\n', '          if (document.querySelector("input.inline")) return;\n          { const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && ae.type !== "checkbox" && ae.type !== "radio" && ae.type !== "range" && ae.closest("main, #sheet, #qa") && !ae.closest("#bugPop")) return; }\n')
rep('if (S.routines.morning.length && S.day.evening !== today) page.appendChild(tdGroup("morning", today));', 'if (S.routines.morning.length && S.day.evening !== today && !S.routines.morning.every((t) => t.done)) page.appendChild(tdGroup("morning", today));')
# ---- LifeCore toggle in Today ----
rep('  const kmatch = (t) => !hidden.has(kindOf(t) || "other");', '  let coreShow = UI.core !== false;\n  const kmatch = (t) => (coreShow || !t.tpl) && !hidden.has(kindOf(t) || "other");')
rep('const uiState = () => ({ morning: morningOpen,', 'const uiState = () => ({ core: coreShow, morning: morningOpen,')
rep('const filt = !isRoutine(key) && hidden.size > 0;', 'const filt = !isRoutine(key) && (hidden.size > 0 || !coreShow);')
rep('const applyUI = (u) => { if (!u) return; ', 'const applyUI = (u) => { if (!u) return; coreShow = u.core !== false; ')
rep('b.onclick = () => { hidden.clear(); saveUI(); render(); };', 'b.onclick = () => { hidden.clear(); coreShow = true; saveUI(); render(); };')
rep('<div class="td-ctl">${fMode ? "" : `<div class="seg sm td-seg"', '<div class="td-ctl">${fMode ? "" : `<button class="td-core" aria-pressed="${coreShow}" title="Утро, еда, зал и вечер: показать или скрыть">LifeCore</button><div class="seg sm td-seg"')
rep('    head.querySelector(".td-gear").onclick', '    { const cb = head.querySelector(".td-core"); if (cb) cb.onclick = () => { coreShow = !coreShow; saveUI(); render(); }; }\n    head.querySelector(".td-gear").onclick')
rep('if (S.routines.morning.length && S.day.evening !== today && !S.routines.morning.every((t) => t.done))', 'const coreRun = (k) => coreShow || !!(T && !T.work && S.routines[k].some((x) => x.id === T.id));\n    if (S.routines.morning.length && coreRun("morning") && S.day.evening !== today && !S.routines.morning.every((t) => t.done))')
rep('    if (S.routines.evening.length) page.appendChild(tdGroup("evening", today));', '    if (S.routines.evening.length && coreRun("evening")) page.appendChild(tdGroup("evening", today));')
# ---- nav order + task scenarios + checklist ----
rep('["work", "Работа", I.work], ["map", "Карта", I.map], ["scen", "Сценарии", I.sun]];', '["work", "Работа", I.work], ["map", "Карта", I.map], ["scen", "Сценарии", I.sun]];\n  { const ORD = ["today", "tasks", "work", "habits", "stats", "scen", "map"]; VIEWS.sort((a, b) => ORD.indexOf(a[0]) - ORD.indexOf(b[0])); }')
rep('  function renderHabits() {', open('tpl.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('    planEditor(page);\n', '    tplEditor(page);\n    planEditor(page);\n')
rep('...(t.tpl ? { tpl: String(t.tpl), tplDay: String(t.tplDay || "") } : {}) })),', '...(t.tpl ? { tpl: String(t.tpl), tplDay: String(t.tplDay || "") } : {}), ...(Array.isArray(t.check) && t.check.length ? { check: t.check.slice(0, 60).map((c) => ({ id: String(c.id || uid()), text: String(c.text || "").slice(0, 120), done: !!c.done })) } : {}) })),')
rep('...(d.planGen ? { planGen: String(d.planGen) } : {}),', '...(d.planGen ? { planGen: String(d.planGen) } : {}), ...(Array.isArray(d.tpls) ? { tpls: d.tpls.map((x) => ({ id: String(x.id || uid()), name: String(x.name || "Сценарий").slice(0, 40), mode: x.mode === "check" ? "check" : "sub", items: (Array.isArray(x.items) ? x.items : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || "").slice(0, 80), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })) })) } : {}),')
rep('    tdLnBox(box, t, key);\n    if (m) mk(', '    tdLnBox(box, t, key);\n    if (!isRoutine(key)) tdCheckBox(box, t);\n    if (m) mk(')
rep('      page.appendChild(qf);\n', """      { const inp = qf.querySelector("input"); let sug = null, sel = 0, hits = [];
        const shut = () => { if (sug) sug.remove(); sug = null; hits = []; };
        const take = (tp) => { shut(); inp.value = ""; tplTake(tp, "today"); setTimeout(() => { const n = $("tdQa"); if (n) n.focus(); }, 0); };
        inp.addEventListener("input", () => { shut(); hits = tplFind(inp.value); if (!hits.length) return; sel = 0;
          sug = document.createElement("div"); sug.className = "tp-sug";
          hits.forEach((tp, i) => { const b = document.createElement("button"); b.type = "button"; b.className = i === sel ? "on" : ""; b.innerHTML = `Взять сценарий «${esc(tp.name)}»<em>${tp.items.length} · ${tp.mode === "check" ? "чеклист" : "подзадачи"}</em>`; b.onpointerdown = (e) => { e.preventDefault(); take(tp); }; sug.appendChild(b); });
          qf.appendChild(sug); });
        inp.addEventListener("keydown", (e) => { if (!sug) return; if (e.key === "Escape") { shut(); return; } if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length; [...sug.children].forEach((x, i) => x.classList.toggle("on", i === sel)); } if (e.key === "Tab" || (e.key === "Enter" && tplKey(inp.value) === tplKey(hits[sel].name))) { e.preventDefault(); take(hits[sel]); } });
        inp.addEventListener("blur", () => setTimeout(shut, 150)); }
      page.appendChild(qf);
""")
rep('items.forEach((t) => { const li = renderRow(t, key);', 'items.forEach((t) => { const li = renderRow(t, key); if (t.check && t.check.length) { const nm = li.querySelector(".name"); if (nm) nm.insertAdjacentHTML("beforeend", `<span class="tdckn">${t.check.filter((c) => c.done).length}/${t.check.length} ✓</span>`); }')
# ---- scenario dnd ----
rep('  function renderHabits() {', open('dnd2.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('      c.querySelector(".sce-add").onsubmit = (e) => {\n        e.preventDefault(); const inp = e.target.querySelector("input"), raw = inp.value.trim(); if (!raw) return;', '      ul._arr = sc.items; ul._done = () => { touch(); renderScen(); };\n      c.querySelector(".sce-add").onsubmit = (e) => {\n        e.preventDefault(); const inp = e.target.querySelector("input"), raw = inp.value.trim(); if (!raw) return;')
rep('      c.querySelector(".sce-add").onsubmit = (e) => { e.preventDefault(); const raw = e.target.querySelector("input").value.trim(); if (!raw) return; const q = parseQuick(raw); tp.items.push', '      ul._arr = tp.items; ul._done = redo;\n      c.querySelector(".sce-add").onsubmit = (e) => { e.preventDefault(); const raw = e.target.querySelector("input").value.trim(); if (!raw) return; const q = parseQuick(raw); tp.items.push')
rep('    planEditor(page);\n    el.appendChild(page);', '    planEditor(page);\n    el.appendChild(page); sceDnd(page);')
# ---- evening banner ----
rep('  function renderHabits() {', open('eve.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('  checkDay();\n  bugInit();\n})();', '  checkDay();\n  bugInit();\n  eveTick(); setInterval(eveTick, 20000);\n})();')
rep('    renderHeader(); fabSync();', '    renderHeader(); fabSync(); try { eveTick(); } catch {}')
# ---- export all ----
rep('  function renderHabits() {', open('export.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('    mk("Заметки для Claude", () => { tdPop = false; render(); notesOpen(); });', '    mk("Заметки для Claude", () => { tdPop = false; render(); notesOpen(); });\n    mk("Экспорт всех данных", () => { tdPop = false; render(); exportAll(); }, "expAll");\n    if (window.lifeosLogout) mk("Выйти из аккаунта", () => window.lifeosLogout());')
# ---- mobile pass ----
rep('/* timer */', open('mobile.css', encoding='utf8').read() + '\n/* timer */')
rep('  function renderHabits() {', open('mobile.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('    mk("Свернуть", "", tdCollapse);', '    mk("Свернуть", "tdx-fold", tdCollapse);')
rep('    if (window.lifeosLogout) mk(', '    mk("Баг / правка", () => { tdPop = false; render(); bugOpen(); });\n    if (window.lifeosLogout) mk(')
# ---- pill nav ----
rep('/* timer */', open('navpill.css', encoding='utf8').read() + '\n/* timer */')
rep('  function renderHabits() {', open('navpill.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('    renderHeader(); fabSync();', '    renderHeader(); fabSync(); try { navPlusSync(); } catch {}')
rep('mb.setAttribute("aria-selected", ["habits", "stats", "work", "map", "scen"].includes(view));', 'mb.setAttribute("aria-selected", ["habits", "stats", "map", "scen"].includes(view));')
# ---- three screens + focus ----
rep('  function renderHabits() {', open('three.js', encoding='utf8').read() + '\n  function renderHabits() {')
rep('["tasks", "Дела", I.list]', '["tasks", "План", I.list]')
rep('    head.querySelector(".td-gear").onclick = (e) => { e.stopPropagation(); tdPop = !tdPop; render(); };\n    page.appendChild(head);', '    head.querySelector(".td-gear").onclick = (e) => { e.stopPropagation(); tdPop = !tdPop; render(); };\n    page.appendChild(head);\n    if (!fMode) page.appendChild(tdTriSeg(todayMode));')
rep('    const el = $("vTasks"); el.innerHTML = "";', '    const el = $("vTasks"); el.innerHTML = ""; el.appendChild(tdTriSeg("plan"));')
rep('  wrap.appendChild(focusSeg());', '  { const x = document.createElement("button"); x.className = "fexit"; x.textContent = "← Выйти из фокуса"; x.onclick = () => fSetMode(false); wrap.appendChild(x); }')
rep('    const rest = q.slice(1, 5);', '    const rest = q.slice(1, 3);')
open('index.html', 'w', encoding='utf8').write(s)
print("built", len(s))
