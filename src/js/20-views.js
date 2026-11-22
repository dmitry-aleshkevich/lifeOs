  // ---------- views ----------
  function renderHeader() {
    const now = new Date(Date.now() - 4 * 3600e3);
    const today = dayISO();
    const sl = S.sleep[today];
    $("sub").textContent = `${WDF[now.getDay()]}, ${now.getDate()} ${MON[now.getMonth()]}` + (sl ? ` · сон ${clock(sl.bed)} → ${clock(sl.wake)}` : "");
    const days = Math.max(0, Math.ceil((NY - fromISO(today)) / 864e5));
    $("countPill").textContent = `До НГ ${days} дн`;
    $("sub").insertAdjacentHTML("beforeend", `<span class="sub-ng"> · ${days} дн до НГ</span>`);
    const nav = $("views"); nav.innerHTML = "";
    VIEWS.forEach(([id, label, icon]) => {
      const b = document.createElement("button");
      b.setAttribute("role", "tab"); b.setAttribute("aria-selected", id === view);
      b.innerHTML = icon + `<span>${label}</span>`;
      b.onclick = () => { const go = () => { view = id; lsSet(LS_VIEW, view); armedDel = null; saveUI(); render(); window.scrollTo({ top: 0 }); }; if (document.startViewTransition && id !== view && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(go); else go(); };
      b.dataset.v = id; nav.appendChild(b);
    });
    const mb = document.createElement("button"); mb.className = "vmore"; mb.setAttribute("role", "tab"); mb.setAttribute("aria-selected", ["habits", "stats", "map", "scen"].includes(view)); mb.setAttribute("aria-haspopup", "menu");
    mb.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg><span>Ещё</span>';
    mb.onclick = (e) => { e.stopPropagation(); let pop = document.querySelector(".vpop"); if (pop) { pop.remove(); return; } pop = document.createElement("div"); pop.className = "vpop"; pop.setAttribute("role", "menu");
      VIEWS.filter(([id]) => ["habits", "stats", "work", "map", "scen"].includes(id)).forEach(([id, label, icon]) => { const it = document.createElement("button"); it.setAttribute("role", "menuitem"); it.setAttribute("aria-current", id === view); it.innerHTML = icon + `<span>${label}</span>`; it.onclick = () => { pop.remove(); view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); }; pop.appendChild(it); });
      document.body.appendChild(pop); setTimeout(() => document.addEventListener("pointerdown", function cl(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener("pointerdown", cl); } }), 0); };
    nav.appendChild(mb);
    ["today", "tasks", "habits", "stats", "work", "map", "scen"].forEach((id) => { $("v" + id[0].toUpperCase() + id.slice(1)).hidden = id !== view; });
  }

  function renderToday() { return renderToday2(); }
  function renderTasks() { renderPlanKB(); }

  // ---------- day schedule: time grid from 09:00 ----------
  const ZOOMS = [32, 44, 56, 80, 112, 160, 224], snapV = () => (HR >= 160 ? 5 : 15), DAY_START = 9;
  const LATE_H = 5, toMin = (str) => { const [h, m] = str.split(":").map(Number); return (h < LATE_H ? h + 24 : h) * 60 + m; };
  const hhmm = (m) => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };
  let poolOpen = false, listDrag = null, armed = "", sheetSpec = null, dayDrag = null, dayStartH = DAY_START;
  function tasksOnDay(iso) {
    const today = dayISO(), tom = addDays(today, 1);
    return S.tasks.filter((t) => tmatch(t) && ((t.due === iso && t.where !== "wait") || (t.where === "today" && iso === today) || (t.where === "tomorrow" && iso === tom) || (t.where === "wait" && t.waitUntil === iso) || (t.where === "done" && t.doneAt && dayISO(t.doneAt) === iso)));
  }
  function addDayTask(name, min, project, at) {
    { const q = parseQuick(name); name = q.name; if (q.min != null) min = q.min; if (q.project != null) project = q.project; if (q.at) at = q.at; }
    const today = dayISO(), tom = addDays(today, 1);
    const where = calSel === today ? "today" : calSel === tom ? "tomorrow" : "backlog";
    const t = { id: uid(), name, min, done: false, spent: 0, note: "", project, where, sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: where === "backlog" ? calSel : "", at: at || "" };
    S.tasks.push(t); persist(); return t;
  }
  function layoutBlocks(list) {
    const items = list.map((t) => { const s = toMin(t.at); return { t, s, e: Math.min((24 + LATE_H) * 60, s + Math.max(t.min || 0, 15)) }; }).sort((a, b) => a.s - b.s || b.e - a.e);
    const out = []; let cluster = [], end = -1;
    const flush = () => { const cols = Math.max(1, ...cluster.map((x) => x.col + 1)); cluster.forEach((x) => { x.cols = cols; out.push(x); }); cluster = []; end = -1; };
    items.forEach((it) => {
      if (cluster.length && it.s >= end) flush();
      const used = cluster.filter((x) => x.e > it.s).map((x) => x.col);
      let c = 0; while (used.includes(c)) c++;
      it.col = c; cluster.push(it); end = Math.max(end, it.e);
    });
    if (cluster.length) flush();
    return out;
  }
  const toggleDone = (t) => { t.done = !t.done; t.spent = 0; t.doneAt = t.done ? Date.now() : 0; persist(); render(); };
  function toast(text, label, fn) {
    let el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; document.body.appendChild(el); }
    el.innerHTML = ""; const s = document.createElement("span"); s.textContent = text; el.appendChild(s);
    if (label) { const bar = document.createElement("i"); bar.className = "tb"; el.appendChild(bar); }
    if (label) { const b = document.createElement("button"); b.textContent = label; b.onclick = () => { el.hidden = true; fn(); }; el.appendChild(b); }
    el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 5000);
  }
  // "Начать сейчас": today's undone tasks without a time go into the grid one after another from now
  function startNow() {
    const nowM = minutesOfDay(Date.now());
    if (nowM < 240) { toast("Сетка идёт до 24:00, сейчас ночь."); return 0; }
    let cur = Math.ceil(nowM / 5) * 5; const from = cur;
    const list = S.tasks.filter((t) => t.where === "today" && !t.done && !t.at && kmatch(t));
    const busy = S.tasks.filter((t) => t.where === "today" && !t.done && t.at).map((t) => [toMin(t.at), toMin(t.at) + Math.max(t.min || 0, 15)]);
    let placed = 0;
    for (const t of list) {
      const dur = Math.max(t.min || 0, 15);
      for (let again = true; again;) { again = false; for (const [s, e] of busy) if (cur < e && cur + dur > s) { cur = e; again = true; } }
      if (cur + dur > 1440) break;
      t.at = hhmm(cur); busy.push([cur, cur + dur]); cur += dur; placed++;
    }
    persist(); render();
    if (!list.length) toast("Нет задач на сегодня без времени.");
    else toast(placed < list.length ? `Поставил ${placed} из ${list.length}, дальше не хватает дня` : `Расставил ${placed} с ${hhmm(from)} до ${hhmm(cur)}`, (view === "tasks" && tasksMode === "day") || (view === "today" && todayMode === "cal") ? "" : "Открыть день", () => { view = "tasks"; tasksMode = "day"; calSel = dayISO(); saveUI(); render(); window.scrollTo({ top: 0 }); });
    return placed;
  }
  function placeAt(t, m) {
    if (t.where === "backlog" && !t.due) { t.due = calSel; pullDue(); }
    t.at = hhmm(m); armed = ""; persist(); render();
  }
  const slotMin = (clientY, rect) => Math.max(dayStartH * 60, Math.min(24 * 60 - snapV(), dayStartH * 60 + Math.floor((clientY - rect.top) / HR * 60 / snapV()) * snapV()));
  function taskRow(t, pool) {
    const li = document.createElement("li"); li.className = "task live" + (t.done || t.where === "done" ? " done" : "") + (t.id === armed ? " armed" : ""); li.dataset.id = t.id;
    li.innerHTML = `<div class="txt"><span class="name ed">${esc(t.name)}</span><span class="meta">${pchip(t.project)}${t.min ? `<span class="sess">${t.min} мин</span>` : ""}${t.where === "wait" ? `<span class="pchip pc-gray">жду</span>` : ""}</span></div>`;
    const nm = li.querySelector(".name"); nm.onclick = () => inlineEdit(li, t, nm);
    if (!t.done && t.where !== "done") {
      const b = document.createElement("button"); b.className = "act primary"; b.textContent = t.id === armed ? "Отмена" : "На время";
      b.onclick = () => { armed = t.id === armed ? "" : t.id; render(); }; li.appendChild(b);
      li.addEventListener("pointerdown", (e) => {
        if (listDrag || e.target.closest("button, input, select") || (e.pointerType === "mouse" && e.button !== 0)) return;
        listDrag = { t, li, pid: e.pointerId, sx: e.clientX, sy: e.clientY, px: e.clientX, py: e.clientY, active: false, mouse: e.pointerType === "mouse", timer: null, ghost: null, pv: null, raf: 0 };
        if (!listDrag.mouse) listDrag.timer = setTimeout(beginListDrag, 350);
      });
      li.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    return li;
  }
  function beginListDrag() {
    const d = listDrag; if (!d || d.active) return;
    d.active = true; suppressClick = true;
    const r = d.li.getBoundingClientRect(), g = d.li.cloneNode(true);
    g.className += " lghost"; g.style.width = r.width + "px"; g.style.left = r.left + "px"; g.style.top = r.top + "px"; d.off = d.sy - r.top; d.ox = d.sx - r.left;
    document.body.appendChild(g); d.ghost = g; d.li.style.opacity = ".35";
    document.body.style.userSelect = "none";
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
    const loop = () => {
      if (!listDrag || !listDrag.active) return;
      const H = window.innerHeight, e = 80;
      if (d.py < e) window.scrollBy(0, -Math.ceil((e - d.py) / 5)); else if (d.py > H - e) window.scrollBy(0, Math.ceil((d.py - (H - e)) / 5));
      moveListDrag(); d.raf = requestAnimationFrame(loop);
    };
    moveListDrag(); d.raf = requestAnimationFrame(loop);
  }
  function moveListDrag() {
    const d = listDrag; if (!d || !d.ghost) return;
    d.ghost.style.left = d.px - d.ox + "px"; d.ghost.style.top = d.py - d.off + "px";
    const slots = document.querySelector(".dgrid .slots"), r = slots && slots.getBoundingClientRect();
    const inside = r && d.px >= r.left && d.px <= r.right && d.py >= r.top && d.py <= r.bottom;
    if (!inside) { if (d.pv) { d.pv.remove(); d.pv = null; } d.m = null; return; }
    d.m = slotMin(d.py, r);
    if (!d.pv) { d.pv = document.createElement("div"); d.pv.className = "dpv"; slots.parentNode.appendChild(d.pv); }
    d.pv.style.top = (d.m - dayStartH * 60) / 60 * HR + "px"; d.pv.style.height = Math.max(22, Math.max(d.t.min || 0, 15) / 60 * HR - 2) + "px"; d.pv.textContent = hhmm(d.m);
  }
  function endListDrag(commit) {
    const d = listDrag; if (!d) return; listDrag = null;
    clearTimeout(d.timer); cancelAnimationFrame(d.raf); document.body.style.userSelect = "";
    if (!d.active) return;
    if (d.ghost) d.ghost.remove(); if (d.pv) d.pv.remove(); d.li.style.opacity = "";
    if (commit && d.m != null) placeAt(d.t, d.m); else render();
    setTimeout(() => { suppressClick = false; }, 60);
  }
  window.addEventListener("pointermove", (e) => {
    const d = listDrag; if (!d || e.pointerId !== d.pid) return;
    d.px = e.clientX; d.py = e.clientY;
    if (!d.active) {
      const dist = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (d.mouse) { if (dist > 5) beginListDrag(); } else if (dist > 8) { clearTimeout(d.timer); listDrag = null; }
      return;
    }
    e.preventDefault();
  }, { passive: false });
  window.addEventListener("pointerup", (e) => { if (listDrag && e.pointerId === listDrag.pid) endListDrag(true); });
  window.addEventListener("pointercancel", (e) => { if (listDrag && e.pointerId === listDrag.pid) endListDrag(false); });
  document.addEventListener("touchmove", (e) => { if (listDrag && listDrag.active) e.preventDefault(); }, { passive: false });
  function deleteTask(t) {
    const i = S.tasks.indexOf(t); if (i < 0) return;
    const kids = S.tasks.filter((k) => k.link === t.id); kids.forEach((k) => S.tasks.splice(S.tasks.indexOf(k), 1));
    S.tasks.splice(S.tasks.indexOf(t), 1); persist(); render();
    toast("Задача удалена", "Отменить", () => { if (!S.tasks.includes(t)) { S.tasks.splice(Math.min(i, S.tasks.length), 0, t); kids.forEach((k) => S.tasks.push(k)); persist(); render(); } });
  }
  const doneCount = () => S.tasks.filter((t) => t.done || t.where === "done").length;
  function clearDone() {
    const gone = S.tasks.map((t, i) => ({ t, i })).filter((x) => x.t.done || x.t.where === "done");
    if (!gone.length) { toast("Завершённых нет."); return; }
    S.tasks = S.tasks.filter((t) => !(t.done || t.where === "done"));
    persist(); render();
    toast("Убрано завершённых: " + gone.length, "Отменить", () => { gone.forEach(({ t, i }) => S.tasks.splice(Math.min(i, S.tasks.length), 0, t)); persist(); render(); });
  }
  let zoomT = null;
  function setZoom(v, anchorY) {
    v = Math.max(30, Math.min(260, Math.round(v)));
    if (v === HR) return;
    const ay = anchorY == null ? window.innerHeight / 2 : anchorY, s1 = document.querySelector(".dgrid .slots");
    const hours = s1 ? (ay - s1.getBoundingClientRect().top) / HR : null;
    HR = v; clearTimeout(zoomT); zoomT = setTimeout(saveUI, 400); render();
    const s2 = document.querySelector(".dgrid .slots");
    if (s2 && hours != null) window.scrollBy(0, s2.getBoundingClientRect().top + hours * HR - ay);
  }
  let pinch = null;
  const tdist = (ts) => Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
  document.addEventListener("touchstart", (e) => {
    const g = e.target.closest && e.target.closest(".dgrid");
    if (e.touches.length === 2 && g) { if (dayDrag) { clearTimeout(dayDrag.timer); dayDrag = null; } if (listDrag) { clearTimeout(listDrag.timer); listDrag = null; } pinch = { d: tdist(e.touches), s: 1, g, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 }; const r = g.getBoundingClientRect(); g.style.transformOrigin = "0 " + (pinch.y - r.top) + "px"; }
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    pinch.s = Math.max(30 / HR, Math.min(260 / HR, tdist(e.touches) / pinch.d));
    pinch.g.style.transform = "scaleY(" + pinch.s + ")";
  }, { passive: false });
  const endPinch = (e) => { if (pinch && e.touches.length < 2) { const p = pinch; pinch = null; p.g.style.transform = ""; setZoom(HR * p.s, p.y); } };
  document.addEventListener("touchend", endPinch); document.addEventListener("touchcancel", endPinch);
  const canToggle = (t) => t.where === "today" || t.where === "tomorrow" || t.where === "backlog";

  function reorderToday() { // calendar order -> list order: timed tasks by time, then the rest as they were
    const idx = []; S.tasks.forEach((t, i) => { if (t.where === "today") idx.push(i); });
    const arr = idx.map((i) => S.tasks[i]);
    const next = [...arr.filter((t) => t.at).sort((a, b) => toMin(a.at) - toMin(b.at)), ...arr.filter((t) => !t.at)];
    idx.forEach((i, k) => { S.tasks[i] = next[k]; });
  }
  function renderDay(col, opts = {}) {
    const emb = !!opts.embedded, mkCard = () => { const c = document.createElement("div"); c.className = emb ? "sub" : "card"; return c; };
    const today = dayISO();
    if (!calSel) calSel = today;
    const list = emb ? S.tasks.filter((t) => t.where === "today" && kmatch(t)) : tasksOnDay(calSel);
    const timed = list.filter((t) => t.at && !lnHidden(t)), loose = list.filter((t) => !t.at);
    const canAdd = calSel >= today, day = fromISO(calSel);
    const armedTask = armed ? S.tasks.find((t) => t.id === armed) : null;
    if (armed && !armedTask) armed = "";

    const head = document.createElement("div"); head.className = "card";
    head.innerHTML = `<div class="cal-h"><button class="act" data-n="-1" aria-label="Предыдущий день">‹</button><span class="t" style="text-transform:none">${WDF[day.getDay()]}, ${day.getDate()} ${MON[day.getMonth()]}</span><button class="act" data-n="1" aria-label="Следующий день">›</button></div>
      <div class="card-h"><span class="sum">${list.length ? list.length + " · " + list.reduce((s, t) => s + (t.min || 0), 0) + " мин" : "Пусто"}</span>${calSel !== today ? '<button class="link accent" id="dToday">К сегодняшнему дню</button>' : '<button class="act primary" id="dNow">Начать сейчас</button>'}</div>`;
    head.querySelectorAll("[data-n]").forEach((b) => b.onclick = () => { calSel = addDays(calSel, +b.dataset.n); calMonth = calSel.slice(0, 7) + "-01"; render(); });
    const dt = head.querySelector("#dToday"); if (dt) dt.onclick = () => { calSel = today; calMonth = today.slice(0, 7) + "-01"; render(); };
    const dn = head.querySelector("#dNow"); if (dn) dn.onclick = startNow;
    if (!emb) col.appendChild(head);

    // tasks without a time
    const lc = mkCard();
    lc.innerHTML = `<div class="card-h"><h2 class="card-t">Без времени</h2><span class="sum">${loose.length || ""}</span></div>`;
    if (armedTask) {
      const h = document.createElement("div"); h.className = "arm-hint";
      h.innerHTML = `<span>«${esc(armedTask.name)}»: нажми на время в сетке</span><button class="act" id="unarm">Отмена</button>`;
      h.querySelector("#unarm").onclick = () => { armed = ""; render(); };
      lc.appendChild(h);
    }
    const ul = document.createElement("ul"); ul.className = "tl";
    if (!loose.length) ul.innerHTML = `<li class="empty">Все задачи дня стоят на времени.</li>`;
    loose.forEach((t) => ul.appendChild(taskRow(t, false)));
    lc.appendChild(ul);
    if (canAdd && !emb) {
      const f = document.createElement("form"); f.className = "add"; f.autocomplete = "off";
      f.innerHTML = `<input type="text" id="day-in" maxlength="90" placeholder="Новая задача на этот день">
        <div class="add-row"><select aria-label="Минуты" id="day-min">${[5, 10, 15, 25, 30, 45, 60, 90].map((m) => `<option value="${m}"${m === 25 ? " selected" : ""}>${m} мин</option>`).join("")}</select>
        <select aria-label="Проект" id="day-pj">${projectOptions(S.projects.find((p) => onlyKind() && p.kind === onlyKind())?.id || "")}</select>
        <button type="submit" class="pill-btn">Добавить</button></div>`;
      const inp = f.querySelector("#day-in"), btn = f.querySelector(".pill-btn");
      inp.value = drafts.day || ""; btn.disabled = !inp.value.trim();
      inp.oninput = () => { drafts.day = inp.value; btn.disabled = !inp.value.trim(); };
      f.onsubmit = (e) => { e.preventDefault(); const v = inp.value.trim(); if (!v) return; addDayTask(v, +f.querySelector("#day-min").value, f.querySelector("#day-pj").value, ""); drafts.day = ""; render(); };
      lc.appendChild(f);
      const pool = S.tasks.filter((t) => t.where === "backlog" && !t.due && tmatch(t));
      if (pool.length) {
        const pb = document.createElement("button"); pb.className = "link"; pb.style.alignSelf = "flex-start";
        pb.textContent = (poolOpen ? "Скрыть склад" : "Из склада (" + pool.length + ")") + (poolOpen ? " ▴" : " ▾");
        pb.onclick = () => { poolOpen = !poolOpen; render(); };
        lc.appendChild(pb);
        if (poolOpen) { const pu = document.createElement("ul"); pu.className = "tl"; pool.forEach((t) => pu.appendChild(taskRow(t, true))); lc.appendChild(pu); }
      }
    }
    if (!emb || loose.length || armedTask) col.appendChild(lc);

    // the grid
    let startH = DAY_START; timed.forEach((t) => { startH = Math.min(startH, Math.floor(toMin(t.at) / 60)); });
    dayStartH = startH;
    let endH = 24; timed.forEach((t) => { endH = Math.max(endH, Math.ceil((toMin(t.at) + Math.max(t.min || 0, 15)) / 60)); }); endH = Math.min(24 + LATE_H, endH);
    const H = (endH - startH) * HR;
    const gc = mkCard();
    gc.innerHTML = `<div class="card-h"><h2 class="card-t">${I.list}Расписание</h2><span class="zoom"><button class="act" id="zm" aria-label="Отдалить"${HR <= ZOOMS[0] ? " disabled" : ""}>−</button><button class="act" id="zp" aria-label="Приблизить"${HR >= ZOOMS[ZOOMS.length - 1] ? " disabled" : ""}>+</button>${calSel === today ? '<button class="act" id="zn">Сейчас</button>' : ""}</span></div>`;
    gc.querySelector("#zm").onclick = () => setZoom([...ZOOMS].reverse().find((z) => z < HR) || ZOOMS[0]);
    gc.querySelector("#zp").onclick = () => setZoom(ZOOMS.find((z) => z > HR) || ZOOMS[ZOOMS.length - 1]);
    const zn = gc.querySelector("#zn"); if (zn) zn.onclick = () => { const n = document.querySelector(".dnow"); if (n && !n.hidden) n.scrollIntoView({ block: "center", behavior: "smooth" }); };
    const grid = document.createElement("div"); grid.className = "dgrid"; grid.style.height = H + "px"; grid.dataset.start = startH; grid.dataset.end = endH;
    for (let h = startH; h < endH; h++) {
      const l = document.createElement("div"); l.className = "hl"; l.style.top = (h - startH) * HR + "px"; l.innerHTML = `<span>${pad(h % 24)}:00</span>`; grid.appendChild(l);
      const q = document.createElement("div"); q.className = "hq"; q.style.top = (h - startH) * HR + HR / 2 + "px"; grid.appendChild(q);
      if (HR >= 112) [0.25, 0.75].forEach((f) => { const q2 = document.createElement("div"); q2.className = "hq hq2"; q2.style.top = (h - startH) * HR + HR * f + "px"; grid.appendChild(q2); });
    }
    const slots = document.createElement("div"); slots.className = "slots"; slots.setAttribute("aria-label", "Время дня");
    slots.onclick = (e) => {
      const r = slots.getBoundingClientRect();
      const m = Math.max(startH * 60, Math.min(endH * 60 - snapV(), startH * 60 + Math.floor((e.clientY - r.top) / HR * 60 / snapV()) * snapV()));
      if (armedTask) placeAt(armedTask, m);
      else if (canAdd) openSheet({ isNew: true, at: hhmm(m), name: "", min: 25, project: S.projects.find((p) => onlyKind() && p.kind === onlyKind())?.id || "" });
    };
    grid.appendChild(slots);
    layoutBlocks(timed).forEach((it) => {
      const t = it.t, top = (it.s - startH * 60) / 60 * HR, h = Math.max(22, (it.e - it.s) / 60 * HR - 2);
      const b = document.createElement("div"); b.className = "dblk pc-" + (proj(t.project)?.color || "gray") + (t.done || t.where === "done" ? " done" : "") + (h < 40 ? " sm" : "") + (h > 56 ? " tall" : "");
      b.dataset.id = t.id; b.style.top = top + "px"; b.style.height = h + "px";
      b.style.left = `calc(${it.col / it.cols * 100}% + 2px)`; b.style.width = `calc(${100 / it.cols}% - 4px)`;
      b.innerHTML = `<button class="dchk" aria-label="Отметить"${canToggle(t) ? "" : " disabled"}>${I.check}</button><span class="dtx"><b>${esc(t.name)}</b><i>${t.at}${t.min ? " · " + t.min + " мин" : ""}</i></span>${t.min && !t.done && t.where !== "done" ? `<button class="dplay" aria-label="Запустить таймер">${I.play}</button>` : ""}`;
      if (!t.done && t.where !== "done") b.insertAdjacentHTML("beforeend", '<span class="dres" title="Потяни, чтобы изменить длительность"></span>');
      const pl = b.querySelector(".dplay"); if (pl) pl.onclick = (e) => { e.stopPropagation(); startTimer(t.id); };
      b.querySelector(".dchk").onclick = (e) => { e.stopPropagation(); if (canToggle(t)) toggleDone(t); };
      b.onclick = (e) => { const nm = tdNameHit(e); if (nm) { e.stopPropagation(); return tdRename(nm, t); } openSheet({ id: t.id }); };
      b.addEventListener("contextmenu", (e) => e.preventDefault());
      b.addEventListener("pointerdown", (e) => {
        if (dayDrag || e.target.closest(".dchk, .dplay") || (e.pointerType === "mouse" && e.button !== 0)) return;
        const res = !!e.target.closest(".dres"); if (res) { e.preventDefault(); e.stopPropagation(); }
        dayDrag = res ? { t, b, pid: e.pointerId, sy: e.clientY, sx: e.clientX, res: true, base: t.min || 15, to: t.min || 15, startH, active: false, mouse: true, timer: null }
          : { t, b, pid: e.pointerId, sy: e.clientY, sx: e.clientX, base: toMin(t.at), to: toMin(t.at), startH, dur: Math.max(t.min || 0, 15), active: false, mouse: e.pointerType === "mouse", timer: null };
        if (!dayDrag.mouse) dayDrag.timer = setTimeout(() => { if (dayDrag && !dayDrag.active) beginDayDrag(); }, 350);
      });
      lnDecor(b, t);
      grid.appendChild(b);
    });
    grid.addEventListener("touchmove", (e) => { if (dayDrag && dayDrag.active) e.preventDefault(); }, { passive: false });
    grid.addEventListener("wheel", (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(HR * Math.exp(-e.deltaY * 0.01), e.clientY); } }, { passive: false });
    if (calSel === dayISO(Date.now())) {
      const n = document.createElement("div"); n.className = "dnow"; grid.appendChild(n); placeNow(grid);
    }
    gc.appendChild(grid);
    col.appendChild(gc);
  }
  function placeNow(grid) {
    const n = grid.querySelector(".dnow"); if (!n) return;
    let m = minutesOfDay(Date.now()); if (m < LATE_H * 60) m += 1440; const s = +grid.dataset.start * 60;
    if (m < s || m >= (+grid.dataset.end || 24) * 60) { n.hidden = true; return; }
    n.hidden = false; n.style.top = (m - s) / 60 * HR - 1 + "px";
  }
  setInterval(() => { const g = document.querySelector(".dgrid"); if (g) placeNow(g); }, 60000);

  function beginDayDrag() {
    if (!dayDrag) return;
    dayDrag.active = true; suppressClick = true; dayDrag.b.classList.add("dragging");
    document.body.style.userSelect = "none";
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
  }
  function endDayDrag(commit) {
    const d = dayDrag; if (!d) return; dayDrag = null;
    clearTimeout(d.timer); document.body.style.userSelect = "";
    if (!d.active) return;
    if (commit && d.to !== d.base) { if (d.res) d.t.min = d.to; else d.t.at = hhmm(d.to); persist(); }
    render();
    setTimeout(() => { suppressClick = false; }, 60);
  }
  window.addEventListener("pointermove", (e) => {
    const d = dayDrag; if (!d || e.pointerId !== d.pid) return;
    if (!d.active) {
      const dist = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (d.mouse) { if (dist > 5) beginDayDrag(); } else if (dist > 8) { clearTimeout(d.timer); dayDrag = null; }
      if (!dayDrag || !dayDrag.active) return;
    }
    e.preventDefault();
    if (d.res) {
      const sn = snapV(), st = toMin(d.t.at), mx = (24 + LATE_H) * 60 - st;
      d.to = Math.max(5, Math.min(mx, Math.round((d.base + (e.clientY - d.sy) / HR * 60) / sn) * sn));
      d.b.style.height = Math.max(22, d.to / 60 * HR - 2) + "px"; d.b.classList.toggle("sm", d.to / 60 * HR < 40);
      const ri = d.b.querySelector("i"); if (ri) ri.textContent = d.t.at + " · " + d.to + " мин";
      d.b.dataset.dur = d.to + " мин"; return;
    }
    const lo = d.startH * 60, hi = (+(document.querySelector(".dgrid") || {}).dataset?.end || 24) * 60 - d.dur;
    d.to = Math.max(lo, Math.min(hi, Math.round((d.base + (e.clientY - d.sy) / HR * 60) / snapV()) * snapV()));
    d.b.style.top = (d.to - lo) / 60 * HR + "px";
    const i = d.b.querySelector("i"); if (i) i.textContent = hhmm(d.to) + (d.t.min ? " · " + d.t.min + " мин" : "");
  }, { passive: false });
  window.addEventListener("pointerup", (e) => { if (dayDrag && e.pointerId === dayDrag.pid) endDayDrag(true); });
  window.addEventListener("pointercancel", (e) => { if (dayDrag && e.pointerId === dayDrag.pid) endDayDrag(false); });

  // ---------- bottom sheet: add / edit a task on the grid ----------
  function closeSheet() { const wasW = !!wSpec; sheetSpec = null; wSpec = null; $("sheetBg").hidden = true; $("sheet").innerHTML = ""; if (wasW && view === "work") renderWork(); }
  function openSheet(spec) { sheetSpec = spec; renderSheet(); }
  function renderSheet() {
    const bg = $("sheetBg"), box = $("sheet");
    if (!sheetSpec) { bg.hidden = true; return; }
    const isNew = !!sheetSpec.isNew, id = sheetSpec.id, cur = () => S.tasks.find((x) => x.id === id);
    const t = isNew ? sheetSpec : cur();
    if (!t) { closeSheet(); return; }
    const when = fromISO(calSel);
    box.innerHTML = `<div class="sheet-h"><b>${isNew ? "Новая задача · " + when.getDate() + " " + MON[when.getMonth()] : "Задача"}</b><button class="icon-btn" id="shX" aria-label="Закрыть">${I.del.replace(/<svg[^>]*>.*<\/svg>/, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>')}</button></div>
      <input type="text" class="field" id="sh-name" maxlength="90" placeholder="Что сделать?" value="${esc(t.name)}">
      <div class="add-row">
        <label class="f">Начало <input type="time" class="field" id="sh-at" value="${esc(t.at || "")}"></label>
        <div class="step"><button type="button" data-d="-1" aria-label="Меньше">−</button><span id="sh-min">${t.min ? t.min + " мин" : "чек"}</span><button type="button" data-d="1" aria-label="Больше">+</button></div>
      </div>
      <select class="field" id="sh-pj" aria-label="Проект">${projectOptions(t.project)}</select>
      <div class="add-row" id="sh-act"></div>`;
    const set = (k, v) => { const x = isNew ? sheetSpec : cur(); if (!x) return; x[k] = v; if (!isNew) { persist(); render(); } };
    const nm = box.querySelector("#sh-name"), at = box.querySelector("#sh-at"), pj = box.querySelector("#sh-pj");
    nm.onchange = () => { const v = nm.value.trim(); if (v) set("name", v); else nm.value = (isNew ? sheetSpec : cur())?.name || ""; };
    if (isNew) nm.oninput = () => { sheetSpec.name = nm.value; addBtn.disabled = !nm.value.trim(); };
    at.onchange = () => set("at", at.value);
    pj.onchange = () => set("project", pj.value);
    box.querySelectorAll(".step button").forEach((b) => b.onclick = () => {
      const x = isNew ? sheetSpec : cur(); if (!x) return; let m = x.min || 0;
      m = +b.dataset.d > 0 ? (m < 10 ? m + 1 : m + 5) : (m <= 10 ? m - 1 : m - 5);
      m = Math.max(0, Math.min(240, m)); box.querySelector("#sh-min").textContent = m ? m + " мин" : "чек"; set("min", m);
    });
    box.querySelector("#shX").onclick = closeSheet;
    const act = box.querySelector("#sh-act");
    const mkBtn = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "act " + cls; b.textContent = label; b.onclick = fn; act.appendChild(b); return b; };
    let addBtn = null;
    if (isNew) {
      addBtn = mkBtn("Добавить", "primary", () => {
        const v = (sheetSpec.name || "").trim(); if (!v) return;
        addDayTask(v, sheetSpec.min || 0, sheetSpec.project || "", sheetSpec.at || ""); closeSheet(); render();
      });
      addBtn.disabled = !(sheetSpec.name || "").trim();
      setTimeout(() => nm.focus(), 0);
    } else {
      if (canToggle(t)) mkBtn(t.done ? "Вернуть" : "Готово ✓", "primary", () => { const x = cur(); if (x) { toggleDone(x); renderSheet(); } });
      if (t.min && !t.done && canToggle(t)) mkBtn("▶ Таймер", "", () => { closeSheet(); startTimer(id); });
      if (t.at) mkBtn("Без времени", "", () => { const x = cur(); if (x) { x.at = ""; persist(); closeSheet(); render(); } });
      mkBtn("Удалить", "danger", () => { const x = cur(); if (x) { closeSheet(); deleteTask(x); } });
    }
    bg.hidden = false;
  }
  $("sheetBg").addEventListener("click", (e) => { if (e.target.id === "sheetBg") closeSheet(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetSpec) closeSheet(); });

