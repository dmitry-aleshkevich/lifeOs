(() => {
  const $ = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const LS = "lifeos.v1", LS_TIMER = "lifeos.timer.v1", LS_VIEW = "lifeos.view.v1";
  // Same QR content as Kickstart, so the alarm keeps accepting it.
  const APP_URL = "https://claude.ai/artifact/Ue6VwVeMyucKqAcxjxkYeZ#morning";
  const NY = new Date(2026, 11, 31, 12);
  const C = 565.49;
  const lsGet = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  // ---------- dates: a "day" runs 04:00 → 04:00 ----------
  const isoOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const dayISO = (ts = Date.now()) => isoOf(new Date(ts - 4 * 3600e3));
  const fromISO = (iso) => new Date(iso + "T12:00:00");
  const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
  const mondayOf = (iso) => { const d = fromISO(iso); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return isoOf(d); };
  const WD = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const MON = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const WDF = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
  const clock = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  const dur = (ms) => { const m = Math.round(ms / 60000); if (m < 60) return m + " мин"; const h = Math.floor(m / 60), r = m % 60; return h + " ч" + (r ? " " + r + " мин" : ""); };
  const durShort = (ms) => { const m = Math.round(ms / 60000); const h = Math.floor(m / 60), r = m % 60; return h ? h + ":" + pad(r) : r + " мин"; };
  const minutesOfDay = (ts) => { const d = new Date(ts); return d.getHours() * 60 + d.getMinutes(); };

  // ---------- defaults (used only before the cloud copy arrives) ----------
  const mk = (arr) => arr.map(([name, min]) => ({ id: uid(), name, min, done: false, spent: 0, note: "" }));
  const DEFAULTS = () => ({
    v: 1,
    projects: [
      { id: "eronika", name: "Eronika", color: "red" }, { id: "apk", name: "АПК", color: "yellow" },
      { id: "wedding", name: "Wedding Promo", color: "violet" }, { id: "ironhorse", name: "Iron Horse", color: "gray" },
      { id: "golubeva", name: "Golubeva", color: "blue" }, { id: "blog", name: "Блог", color: "orange" },
      { id: "home", name: "Дом", color: "green" }, { id: "growth", name: "Рост", color: "aqua" },
    ],
    tasks: [],
    routines: {
      morning: mk([["Душ 🚿", 10], ["Почистить зубы 🪥", 0], ["Выпить воды 💧", 0], ["Одеться 👕", 0], ["Заварить чай 🫖", 5], ["Лёд на лицо 🥶", 2], ["Зарядка 🏋️", 15], ["Приготовить завтрак 🍳", 15], ["Позавтракать 🍳", 20], ["Выход из дома 💼", 0]]),
      evening: mk([["Записать дела на завтра 📅", 10], ["Убраться на кухне 🧽", 10], ["Собрать одежду на утро 👔", 2], ["Собрать сумку 💼", 5], ["Поставить будильник ⏰", 1], ["Почистить зубы 🪥", 3], ["Туалет 🚽", 1]]),
    },
    habits: [
      { id: "sleep", name: "Отбой до 01:00", auto: "sleep" }, { id: "wake", name: "Подъём в 9", auto: "wake" },
      { id: "smoke", name: "Без сигарет 🚭" }, { id: "alco", name: "Без алкоголя" }, { id: "gym", name: "Зал", days: [1, 3, 5] },
      { id: "posture", name: "Осанка 10 минут" }, { id: "blog", name: "Контент для блога" }, { id: "speech", name: "10 минут говорю вслух" },
    ],
    habitLog: {}, log: [], sleep: {}, day: { closedAt: null, evening: null }, weeks: [], side: [], work: seedWork(),
  });
  const KINDS = [["work", "Работа"], ["home", "Дом"], ["growth", "Рост"]];
  const KIND_IDS = KINDS.map((k) => k[0]);
  const guessKind = (p) => (p.id === "home" || /дом|быт/i.test(p.name || "")) ? "home" : (p.id === "growth" || /рост/i.test(p.name || "")) ? "growth" : "work";
  const COLORS = ["orange", "red", "yellow", "violet", "blue", "green", "aqua", "gray"];
  function normItem(t) { return { id: String(t.id || uid()), name: String(t.name || ""), min: Math.max(0, Math.min(240, Number(t.min) || 0)), done: !!t.done, spent: t.done ? Math.max(0, Number(t.spent) || 0) : 0, note: String(t.note || "").slice(0, 160) }; }
  function normalize(d) {
    if (!d || typeof d !== "object" || !Array.isArray(d.tasks)) return null;
    const base = DEFAULTS();
    return {
      v: 1, updatedAt: Number(d.updatedAt) || 0, ...(Array.isArray(d.mScen) && d.mScen.length === 3 ? { mScen: d.mScen.map((sc) => ({ id: String(sc.id), name: String(sc.name || ""), icon: String(sc.icon || "•"), items: Array.isArray(sc.items) ? sc.items.map(normItem).map((x) => ({ id: x.id, name: x.name, min: x.min, note: x.note })) : [] })) } : {}), ...(d.mScenCur ? { mScenCur: String(d.mScenCur) } : {}), ...(Array.isArray(d.plan) ? { plan: d.plan.map((b) => ({ id: String(b.id || uid()), name: String(b.name || "Блок"), at: /^\d\d:\d\d$/.test(b.at || "") ? b.at : "12:00", min: Math.max(0, Math.min(240, Number(b.min) || 0)), days: Array.isArray(b.days) ? [...new Set(b.days.map(Number).filter((x) => x >= 0 && x <= 6))] : [0, 1, 2, 3, 4, 5, 6], pre: (Array.isArray(b.pre) ? b.pre : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || ""), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })), post: (Array.isArray(b.post) ? b.post : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || ""), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })) })) } : {}), ...(d.planGen ? { planGen: String(d.planGen) } : {}), ...(Array.isArray(d.tpls) ? { tpls: d.tpls.map((x) => ({ id: String(x.id || uid()), name: String(x.name || "Сценарий").slice(0, 40), mode: x.mode === "check" ? "check" : "sub", items: (Array.isArray(x.items) ? x.items : []).map((k) => ({ id: String(k.id || uid()), name: String(k.name || "").slice(0, 80), min: Math.max(0, Math.min(240, Number(k.min) || 0)) })) })) } : {}),
      projects: Array.isArray(d.projects) ? d.projects.map((p) => ({ id: String(p.id), name: String(p.name), color: COLORS.includes(p.color) ? p.color : "gray", kind: KIND_IDS.includes(p.kind) ? p.kind : guessKind(p), ...(p.archived ? { archived: true } : {}) })) : base.projects,
      tasks: d.tasks.map((t) => ({ ...normItem(t), project: t.project ? String(t.project) : "", where: ["today", "tomorrow", "backlog", "wait", "done"].includes(t.where) ? t.where : "backlog",
        sessions: Math.max(0, Number(t.sessions) || 0), acc: Math.max(0, Number(t.acc) || 0), waitUntil: t.waitUntil ? String(t.waitUntil) : "", doneAt: Number(t.doneAt) || 0, due: /^\d{4}-\d\d-\d\d$/.test(t.due || "") ? t.due : "", at: /^\d\d:\d\d$/.test(t.at || "") ? t.at : "", ...(t.link ? { link: String(t.link), rel: t.rel === "pre" ? "pre" : "post" } : {}), ...(t.lnOpen ? { lnOpen: true } : {}), ...(t.tpl ? { tpl: String(t.tpl), tplDay: String(t.tplDay || "") } : {}), ...(Array.isArray(t.check) && t.check.length ? { check: t.check.slice(0, 60).map((c) => ({ id: String(c.id || uid()), text: String(c.text || "").slice(0, 120), done: !!c.done })) } : {}) })),
      routines: { morning: (d.routines?.morning || base.routines.morning).map(normItem), evening: (d.routines?.evening || base.routines.evening).map(normItem) },
      habits: Array.isArray(d.habits) ? d.habits.map((h) => ({ id: String(h.id), name: String(h.name), ...(h.auto ? { auto: String(h.auto) } : {}), ...(Array.isArray(h.days) ? { days: h.days.map(Number) } : {}) })) : base.habits,
      habitLog: d.habitLog && typeof d.habitLog === "object" ? d.habitLog : {},
      log: Array.isArray(d.log) ? d.log.slice(-800) : [],
      sleep: d.sleep && typeof d.sleep === "object" ? d.sleep : {},
      day: { closedAt: Number(d.day?.closedAt) || null, evening: d.day?.evening ? String(d.day.evening) : null },
      weeks: Array.isArray(d.weeks) ? d.weeks : [], side: Array.isArray(d.side) ? d.side : [],
      notes: String(d.notes || "").slice(0, 20000),
      work: normWork(d.work),
      ui: d.ui && typeof d.ui === "object" ? d.ui : {},
    };
  }

  let S = normalize(lsGet(LS)) || DEFAULTS();
  let view = ["today", "tasks", "habits", "stats", "work", "map", "scen"].includes(location.hash.slice(1)) ? location.hash.slice(1) : (lsGet(LS_VIEW) || "today");
  if (location.hash === "#morning") view = "today";
  let wantMorning = location.hash === "#morning";
  let editing = false, armedDel = null, statsOffset = 0, filterProject = "all";
  // Modes (folds, view, filters) are remembered per form factor: locally and in the cloud copy,
  // so a cleared browser still opens the way the phone / the computer was left.
  const FORM = () => (matchMedia("(min-width: 900px)").matches ? "desk" : "phone");
  const UI = Object.assign({}, S.ui?.[FORM()] || {}, lsGet("lifeos.ui.v1") || {});
  let morningOpen = UI.morning !== false, habitsOpen = UI.habits !== false, focusOpen = UI.focus !== false;
  const KIND_ALL = [...KIND_IDS, "other"];
  // hidden kinds (Работа / Дом / Рост / Прочее = tasks without a project). Old saves stored a single chosen kind.
  const readHide = (u) => Array.isArray(u.hide) ? new Set(u.hide.filter((k) => KIND_ALL.includes(k))) : KIND_IDS.includes(u.kind) ? new Set(KIND_ALL.filter((k) => k !== u.kind)) : new Set();
  let HR = Math.max(30, Math.min(260, +UI.zoom || 56)), todayMode = UI.tmode === "cal" ? "cal" : "list", hidden = readHide(UI), tasksMode = ["cal", "day"].includes(UI.mode) ? UI.mode : "list";
  let calMonth = "", calSel = "";
  const uiState = () => ({ core: coreShow, morning: morningOpen, habits: habitsOpen, focus: focusOpen, hide: [...hidden], zoom: HR, tmode: todayMode, mode: tasksMode, view });
  const saveUI = () => {
    const u = uiState(); lsSet("lifeos.ui.v1", u);
    S.ui = Object.assign({}, S.ui || {}, { [FORM()]: u });
    persist();
  };
  const applyUI = (u) => { if (!u) return; coreShow = u.core !== false; morningOpen = u.morning !== false; habitsOpen = u.habits !== false; focusOpen = u.focus !== false; hidden = readHide(u); todayMode = u.tmode === "cal" ? "cal" : "list"; if (+u.zoom) HR = Math.max(30, Math.min(260, +u.zoom)); tasksMode = ["cal", "day"].includes(u.mode) ? u.mode : "list"; lsSet("lifeos.ui.v1", u); };
  const foldBtn = (open, label, onToggle) => {
    const b = document.createElement("button");
    b.className = "icon-btn fold"; b.setAttribute("aria-expanded", open); b.setAttribute("aria-label", (open ? "Свернуть " : "Развернуть ") + label);
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    b.onclick = onToggle; return b;
  };
  const drafts = {}, chosen = {};
  const proj = (id) => S.projects.find((p) => p.id === id) || null;
  const kindOf = (t) => proj(t.project)?.kind || "";
  let coreShow = UI.core !== false;
  const kmatch = (t) => (coreShow || !t.tpl) && !hidden.has(kindOf(t) || "other");
  const onlyKind = () => { const v = KIND_IDS.filter((k) => !hidden.has(k)); return v.length === 1 ? v[0] : ""; };
  const tmatch = (t) => kmatch(t) && (filterProject === "all" || t.project === filterProject);
  const MONN = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const XIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
  const shortDate = (iso) => { const d = fromISO(iso); return d.getDate() + " " + MON[d.getMonth()]; };
  function kindBar() {
    const bar = document.createElement("div"); bar.className = "kinds"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Какие задачи показывать");
    const all = document.createElement("button"); all.className = "chip"; all.textContent = "Все"; all.setAttribute("aria-pressed", hidden.size === 0);
    all.onclick = () => { hidden.clear(); saveUI(); render(); };
    bar.appendChild(all);
    [...KINDS, ["other", "Прочее"]].forEach(([id, label]) => {
      const b = document.createElement("button"); b.className = "chip kt"; b.setAttribute("aria-pressed", !hidden.has(id)); b.textContent = label;
      b.title = hidden.has(id) ? "Показать" : "Скрыть";
      b.onclick = () => {
        hidden.has(id) ? hidden.delete(id) : hidden.add(id);
        if (filterProject !== "all" && hidden.has(proj(filterProject)?.kind || "other")) filterProject = "all";
        saveUI(); render();
      };
      bar.appendChild(b);
    });
    return bar;
  }
  function hiddenHint(key) {
    const all = itemsOf(key), n = all.length - all.filter(kmatch).length;
    if (!n) return null;
    const b = document.createElement("button"); b.className = "link"; b.style.alignSelf = "flex-start";
    b.textContent = "Скрыто: " + n + " · показать всё"; b.onclick = () => { hidden.clear(); coreShow = true; saveUI(); render(); };
    return b;
  }
  function inlineEdit(li, t, target) {
    const inp = document.createElement("input"); inp.type = "text"; inp.className = "inline"; inp.maxLength = 90; inp.value = t.name; inp.setAttribute("aria-label", "Название");
    target.replaceWith(inp); const pen = li.querySelector(".pen"); if (pen) pen.hidden = true;
    inp.focus(); inp.select();
    let fin = false;
    const end = (save) => { if (fin) return; fin = true; const v = inp.value.trim(); if (save && v && v !== t.name) { t.name = v; persist(); } render(); };
    inp.onkeydown = (e) => { if (e.key === "Enter") end(true); else if (e.key === "Escape") end(false); };
    inp.onblur = () => end(true);
  }
  // tasks with a date slide into Today / Tomorrow on their own
  function pullDue() {
    const today = dayISO(), tom = addDays(today, 1); let ch = false;
    S.tasks.forEach((t) => {
      if (t.where !== "backlog" || !t.due || t.done) return;
      if (t.due <= today) { moveTask(t, "today"); t.due = ""; ch = true; }
      else if (t.due === tom) { moveTask(t, "tomorrow"); t.due = ""; ch = true; }
    });
    return ch;
  }

  // ---------- persistence ----------
  let ref = null, pending = null, inflight = false, firstSync = false, notesDirty = false, notesTimer = null;
  function persist() {
    try { lnSync(); } catch {}
    try { mScenSave(); } catch {}
    wRecord();
    S.updatedAt = Date.now();
    lsSet(LS, S);
    if (!ref) return;
    pending = JSON.parse(JSON.stringify(S));
    if (!inflight) flush();
  }
  async function flush() {
    inflight = true;
    while (pending) { const d = pending; pending = null; try { await ref.set(d); } catch { note("Не удалось сохранить в облако. Данные остались на этом устройстве."); } }
    inflight = false;
  }
  function note(t) { const n = $("note"); n.textContent = t; n.hidden = !t; }
  (async () => {
    try {
      const [db, user] = await Promise.all([window.claude?.use("db"), window.claude?.use("user")]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      ref = db.collection("data/users/" + id).doc("os");
      const slow = setTimeout(() => note("Нет связи с облаком. Данные сохраняются на этом устройстве."), 10000);
      ref.onSnapshot((snap) => {
        if (!snap.metadata.fromCache) { clearTimeout(slow); note(""); }
        if (snap.metadata.hasPendingWrites || inflight || pending) return;
        const d = normalize(snap.data());
        if (snap.exists && d) {
          if (document.querySelector("input.inline")) return;
          { const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && ae.type !== "checkbox" && ae.type !== "radio" && ae.type !== "range" && ae.closest("main, #sheet, #qa") && !ae.closest("#bugPop")) return; }
          if (notesDirty) d.notes = S.notes;
          if (!firstSync && (S.updatedAt || 0) > (d.updatedAt || 0)) { firstSync = true; setTimeout(persist, 0); return; }
          const first = !firstSync, wasNight = !!S.day.closedAt; S = d; wReset(); lsSet(LS, S); firstSync = true;
          if (wasNight && !d.day.closedAt && !first && FORM() === "desk") setTimeout(mScenPick, 300);
          if (first && d.ui?.[FORM()] && !lsGet("lifeos.ui.v1")) { applyUI(d.ui[FORM()]); if (d.ui[FORM()].view && !location.hash) view = d.ui[FORM()].view; }
          render(); checkDay();
        }
        else if (!snap.exists && !snap.metadata.fromCache && !firstSync) { firstSync = true; setTimeout(persist, 0); }
      }, () => { clearTimeout(slow); note("Облако недоступно. Данные сохраняются на этом устройстве."); ref = null; });
    } catch {}
  })();

  // ---------- habits ----------
  const habitApplies = (h, iso) => !h.days || h.days.includes(fromISO(iso).getDay());
  const habitDone = (hid, iso) => (S.habitLog[iso] || []).includes(hid);
  function setHabit(hid, iso, on) {
    const arr = new Set(S.habitLog[iso] || []);
    on ? arr.add(hid) : arr.delete(hid);
    if (arr.size) S.habitLog[iso] = [...arr]; else delete S.habitLog[iso];
  }
  function autoHabit(kind, iso) { const h = S.habits.find((x) => x.auto === kind); if (h) setHabit(h.id, iso, true); }
  function streakOf(h) {
    let iso = dayISO(), n = 0;
    if (!habitDone(h.id, iso)) iso = addDays(iso, -1);
    for (let i = 0; i < 400; i++) {
      if (habitApplies(h, iso)) { if (habitDone(h.id, iso)) n++; else break; }
      iso = addDays(iso, -1);
    }
    return n;
  }

  // ---------- day cycle ----------
  const BOOT_TS = Date.now();
  function checkDay() {
    if (planSync()) persist();
    if (pullDue()) { persist(); render(); }
    if (S.day.closedAt) {
      if (wantMorning || (dayISO() > dayISO(S.day.closedAt) && Date.now() - BOOT_TS < 20000)) { wantMorning = false; setTimeout(startMorning, 0); } // night screen with QR stays until scan/button; a fresh page load on a new day opens the morning
      else showNight();
    } else hideNight();
  }
  function closeDay() {
    if (S.day.closedAt) return;
    if (T) closeTimer(true);
    const now = Date.now();
    S.day.closedAt = now;
    const m = minutesOfDay(now);
    if (m >= 18 * 60 || m <= 75) autoHabit("sleep", dayISO(now)); // closed by 01:15
    persist(); showNight();
  }
  function startMorning() {
    if (!S.day.closedAt) return;
    const now = Date.now(), today = dayISO(now);
    S.sleep[today] = { bed: S.day.closedAt, wake: now };
    const m = minutesOfDay(now);
    if (m >= 4 * 60 && m <= 9 * 60 + 15) autoHabit("wake", today);
    for (const k of ["morning", "evening"]) S.routines[k].forEach((t) => { t.done = false; t.spent = 0; });
    S.tasks.forEach((t) => { if (t.where === "today" && t.done) { t.where = "done"; t.doneAt = t.doneAt || now; } });
    S.day.closedAt = null; S.day.evening = null; morningOpen = true; saveUI();
    view = "today"; lsSet(LS_VIEW, view);
    persist(); hideNight(); render();
    if (FORM() === "desk") setTimeout(mScenPick, 300);
  }
  function morningKick() {
    let r = S.routines.morning.find((x) => /^раздуплиться/i.test(x.name));
    if (!r) { r = { id: uid(), name: "Раздуплиться ☕", min: 3, done: false, spent: 0, note: "" }; S.routines.morning.unshift(r); persist(); render(); }
    if (!r.done && !T) startTimer(r.id);
  }
  function routineNext(f) {
    if (!f || !isRoutine(f.key)) return null; const list = S.routines[f.key], i = list.indexOf(f.t);
    return list.slice(i + 1).find((x) => !x.done && x.min > 0) || list.find((x) => !x.done && x.min > 0 && x !== f.t) || null;
  }
  function reopenEvening() { S.day.closedAt = null; S.day.evening = dayISO(); persist(); hideNight(); render(); }
  function maybeCloseDay(key) { if (key === "evening" && S.routines.evening.length && S.routines.evening.every((t) => t.done)) setTimeout(closeDay, 700); }

  let clockTimer = null;
  const tickClock = () => { $("nClock").textContent = clock(Date.now()); };
  function showNight() { renderQR(); nightList(); $("night").hidden = false; document.body.style.overflow = "hidden"; tickClock(); clearInterval(clockTimer); clockTimer = setInterval(tickClock, 15000); syncWake(); }
  function hideNight() { if ($("night").hidden) return; $("night").hidden = true; clearInterval(clockTimer); document.body.style.overflow = T && !T.mini ? "hidden" : ""; syncWake(); }
  function renderQR() {
    const box = $("qr"); if (box.dataset.done) return;
    if (typeof window.qrcode !== "function") { box.className = "qr err"; box.textContent = "Код не загрузился. Проверь интернет и обнови страницу."; return; }
    const q = window.qrcode(0, "M"); q.addData(APP_URL); q.make();
    const n = q.getModuleCount(), m = 2, size = n + m * 2; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    box.className = "qr";
    box.innerHTML = `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect width="${size}" height="${size}" fill="#FFFFFF"/><path d="${d}" fill="#000000"/></svg>`;
    box.dataset.done = "1";
  }
  $("nMorning").onclick = startMorning;
  function nightList() { const box = $("nList"); if (!box) return; let list = S.routines.morning, lh = "Утро"; try { mScenInit(); const nd = new Date(Date.now() + (new Date().getHours() >= 12 ? 864e5 : 0)).getDay(), sc = S.mScen.find((x) => x.id === ([1, 3, 5].includes(nd) ? "fast" : "home")); if (sc) { list = sc.items; lh = "Утро · " + sc.name + " (можно выбрать другое)"; } } catch {} box.innerHTML = list.length ? `<div class="n-lh">${esc(lh)}</div>` + list.slice(0, 14).map((t) => `<div class="n-li"><span>${esc(t.name)}</span><em>${t.min ? t.min + " мин" : ""}</em></div>`).join("") : ""; }
  const nightWake = (e) => { if ($("night").hidden || !S.day.closedAt) return; if (e.target.closest && e.target.closest("#nBack")) return; if (Date.now() - S.day.closedAt < 3 * 3600e3) return; e.preventDefault && e.preventDefault(); startMorning(); };
  document.addEventListener("keydown", nightWake, true); $("night").addEventListener("pointerdown", nightWake);
  $("nBack").onclick = reopenEvening;

  // ---------- icons ----------
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 1.2v9.6L10.5 6z"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.500 4h3A1.5 1.5 0 0 1 15 5.500V7M3 13h18"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  };
  const VIEWS = [["today", "Сегодня", I.home], ["tasks", "План", I.list], ["habits", "Привычки", I.repeat], ["stats", "Итоги", I.chart], ["work", "Работа", I.work], ["map", "Карта", I.map], ["scen", "Сценарии", I.sun]];
  { const ORD = ["today", "tasks", "work", "habits", "stats", "scen", "map"]; VIEWS.sort((a, b) => ORD.indexOf(a[0]) - ORD.indexOf(b[0])); }
  const CHIPS = [[0, "Без таймера"], [5, "5"], [10, "10"], [15, "15"], [25, "25"], [50, "50"]];

