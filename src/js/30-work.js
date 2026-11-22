  // ================= РАБОТА (изолированная вкладка: проекты → этапы → таски, доска статусов) =================
  const W_ST = ["todo", "doing", "wait", "done"];
  const W_NAME = { "": "Без статуса", todo: "To do", doing: "In progress", wait: "Wait", done: "Done" };
  const W_COL = { "": "gray", todo: "blue", doing: "yellow", wait: "gray", done: "green" };
  const W_EMO = ["🌙", "🥊", "🎤", "🌾", "💍", "🏍️", "🎬", "🎨", "🧩", "📦", "🚀", "💼"];
  function newWTask(o) { return { id: uid(), name: "", project: "", stage: "", status: "", date: "", time: "", est: 0, parent: "", check: [], note: "", spent: 0, acc: 0, sessions: 0, ord: 0, doneAt: 0, ...o }; }
  function newWProject(o) { const id = o.id || "w-" + uid(); return { id, name: "", icon: "📁", color: "gray", date: "", money: "", paid: false, contact: "", note: "", archived: false, stages: [{ id: id + "-1", name: "Stage 1" }], ...o }; }
  function seedWork() {
    const defs = [["moon", "Moon", "🌙", "orange", ["Сделать After проект под апскейл", "Loop", "Logos", "Upscale", "Вывод"]], ["ufc", "UFC", "🥊", "blue", []],
      ["eronika", "Eronika", "🎤", "red", ["Продолжить"]], ["apk", "АПК", "🌾", "yellow", []], ["wedding", "Wedding Promo", "💍", "violet", ["Придумать Промо для свадеб"]],
      ["ironhorse", "Iron Horse", "🏍️", "gray", ["Переделать лого под реф", "Коолесо другое, спицы убрать"]]];
    const w = { projects: [], tasks: [] };
    defs.forEach(([id, name, icon, color, ts]) => {
      w.projects.push(newWProject({ id: "w-" + id, name, icon, color }));
      ts.forEach((n, i) => w.tasks.push(newWTask({ id: "wt-" + id + "-" + i, name: n, project: "w-" + id, stage: "w-" + id + "-1", ord: i + 1 })));
    });
    w.tasks.push(newWTask({ id: "wt-apk-d", name: "Раскладку на 3 экрана согласовать", project: "w-apk", stage: "w-apk-1", status: "done", ord: 1 }));
    w.tasks.push(newWTask({ id: "wt-eronika-d", name: "Уточнение ТЗ", project: "w-eronika", stage: "w-eronika-1", status: "done", ord: 2 }));
    return w;
  }
  function normWork(w) {
    if (!w || typeof w !== "object" || !Array.isArray(w.projects) || !Array.isArray(w.tasks)) return seedWork();
    const projects = w.projects.map((p) => {
      const id = String(p.id || uid());
      let stages = Array.isArray(p.stages) ? p.stages.map((s) => ({ id: String(s.id || uid()), name: String(s.name || "Stage").slice(0, 60) })) : [];
      if (!stages.length) stages = [{ id: id + "-1", name: "Stage 1" }];
      return { id, name: String(p.name || "Проект").slice(0, 60), icon: String(p.icon || "📁").slice(0, 8), color: COLORS.includes(p.color) ? p.color : "gray",
        date: /^\d{4}-\d\d-\d\d$/.test(p.date || "") ? p.date : "", money: String(p.money || "").slice(0, 40), paid: !!p.paid, contact: String(p.contact || "").slice(0, 80),
        note: String(p.note || "").slice(0, 2000), archived: !!p.archived, stages };
    });
    const tasks = [];
    w.tasks.forEach((t) => {
      const p = projects.find((x) => x.id === t.project); if (!p) return;
      tasks.push(newWTask({ id: String(t.id || uid()), name: String(t.name || "").slice(0, 120), project: p.id, stage: p.stages.some((s) => s.id === t.stage) ? t.stage : p.stages[0].id,
        status: ["todo", "doing", "wait", "done"].includes(t.status) ? t.status : "", date: /^\d{4}-\d\d-\d\d$/.test(t.date || "") ? t.date : "", time: /^\d\d:\d\d$/.test(t.time || "") ? t.time : "",
        est: Math.max(0, Math.min(960, Number(t.est) || 0)), ...([1, 2].includes(+t.pri) ? { pri: +t.pri } : {}), note: String(t.note || "").slice(0, 4000), spent: Math.max(0, Number(t.spent) || 0), acc: Math.max(0, Number(t.acc) || 0),
        parent: String(t.parent || ""), ...(t.pre ? { pre: true } : {}), sessions: Math.max(0, Number(t.sessions) || 0), ord: Number(t.ord) || 0, doneAt: Number(t.doneAt) || 0,
        check: Array.isArray(t.check) ? t.check.slice(0, 60).map((c) => ({ id: String(c.id || uid()), text: String(c.text || "").slice(0, 120), done: !!c.done })) : [] }));
    });
    projects.forEach((p) => {
      if (p.stages.length < 2) return;
      const first = p.stages[0].id;
      p.stages.forEach((s, i) => {
        const kids = tasks.filter((t) => t.project === p.id && t.stage === s.id && !t.parent), id = "ws-" + s.id;
        if (i > 0 || kids.length) {
          const par = newWTask({ id, name: s.name, project: p.id, stage: first, ord: kids.length ? Math.min(...kids.map((k) => k.ord)) - 0.001 : i });
          tasks.push(par); kids.forEach((k) => { k.parent = id; });
        }
      });
      p.stages = [p.stages[0]];
    });
    tasks.forEach((t) => { const pr = tasks.find((x) => x.id === t.parent); if (!pr || pr.parent || pr.id === t.id) t.parent = ""; else { t.project = pr.project; t.stage = pr.stage; } });
    return { projects, tasks };
  }

  const WUI = lsGet("lifeos.work.ui.v1") || {};
  let wSeg = WUI.seg === "projects" ? "projects" : "board", wOpen = new Set(Array.isArray(WUI.open) ? WUI.open : []), wFilter = "all", wShowArch = false, wFocus = null, wSpec = null, wd = null, wExp = new Set(), wDoneAll = false, wPsc = 0, wSel = new Set(), wSelMode = false, wAnchor = null, wNew = null, wNewFocus = false, wLastProj = "", wHold = 0, wMq = null;
  let wRef = null, wLast = null, wUndoS = [], wRedoS = [], wSkip = false;
  function wReset() { wRef = S.work; wLast = JSON.stringify(S.work); wUndoS = []; wRedoS = []; }
  wReset();
  function wRecord() { try { if (wHold) return; const cur = JSON.stringify(S.work); if (wLast == null) { wLast = cur; return; } if (cur === wLast) return; if (!wSkip) { wUndoS.push(wLast); if (wUndoS.length > 100) wUndoS.shift(); wRedoS = []; } wLast = cur; } catch {} }
  const saveW = () => lsSet("lifeos.work.ui.v1", { seg: wSeg, open: [...wOpen] });
  const wproj = (id) => S.work.projects.find((p) => p.id === id) || null;
  const wtask = (id) => S.work.tasks.find((t) => t.id === id) || null;
  const byOrd = (a, b) => a.ord - b.ord;
  const wOver = (t) => t.date && t.date < dayISO() && t.status !== "done";
  const wEst = (m) => m >= 60 ? Math.floor(m / 60) + " ч" + (m % 60 ? " " + (m % 60) + " м" : "") : m + " м";
  const wCheckN = (t) => [t.check.filter((c) => c.done).length, t.check.length];
  const maxOrd = (list) => list.reduce((m, t) => Math.max(m, t.ord), 0);
  function wLink(c) {
    c = (c || "").trim(); if (!c) return "";
    const h = /^@[\w.]{3,}$/.test(c) ? "https://t.me/" + c.slice(1) : /^https?:\/\/\S+$/i.test(c) ? c : /^\+?[\d\s()-]{7,}$/.test(c) ? "tel:" + c.replace(/[^\d+]/g, "") : "";
    return h ? `<a class="wchip lnk" href="${esc(h)}" target="_blank" rel="noopener">${esc(c)}</a>` : `<span class="wchip">${esc(c)}</span>`;
  }
  function wMove(t, o) {
    let list;
    if (o.kind === "col") { list = S.work.tasks.filter((x) => x.id !== t.id && x.status === o.status); t.status = o.status; t.doneAt = o.status === "done" ? (t.doneAt || Date.now()) : 0; }
    else {
      list = S.work.tasks.filter((x) => x.id !== t.id && x.stage === o.stage); t.stage = o.stage; t.project = o.project;
      if (o.fromBoard) { t.status = ""; t.doneAt = 0; }
      S.work.tasks.forEach((x) => { if (x.parent === t.id) { x.stage = t.stage; x.project = t.project; } });
    }
    list.sort(byOrd);
    const i = o.before ? list.findIndex((x) => x.id === o.before) : -1;
    const prev = i < 0 ? list[list.length - 1] : list[i - 1], next = i < 0 ? null : list[i];
    t.ord = prev && next ? (prev.ord + next.ord) / 2 : prev ? prev.ord + 1 : next ? next.ord - 1 : 1;
    persist();
  }
  function wSetStatus(t, st) {
    t.status = st; t.doneAt = st === "done" ? Date.now() : 0;
    t.ord = maxOrd(S.work.tasks.filter((x) => x.status === st && x.id !== t.id)) + 1; persist();
  }
  function wAddTask(name, pid, sid, status) {
    const p = wproj(pid); if (!p) return null;
    const t = newWTask({ name, project: pid, stage: sid || p.stages[0].id, status: status || "", ord: maxOrd(S.work.tasks) + 1, doneAt: status === "done" ? Date.now() : 0 });
    S.work.tasks.push(t); persist(); return t;
  }
  function wClearDone() {
    const gone = S.work.tasks.filter((t) => t.status === "done" && (wFilter === "all" || t.project === wFilter)); if (!gone.length) return;
    const set = new Set(gone.map((t) => t.id)); S.work.tasks.forEach((t) => { if (set.has(t.parent)) set.add(t.id); }); const snap = S.work.tasks.slice();
    S.work.tasks = S.work.tasks.filter((t) => !set.has(t.id)); gone.forEach((t) => wExp.delete(t.id)); persist(); renderWork();
    toast("Удалено завершённых: " + gone.length, "Отменить", () => { S.work.tasks = snap.filter((t) => set.has(t.id) || S.work.tasks.some((x) => x.id === t.id)); persist(); renderWork(); });
  }
  const wTasksOf = (ids) => [...ids].map(wtask).filter(Boolean).sort(byOrd);
  function wBatch(fn) { wHold++; try { fn(); } finally { wHold--; } persist(); }
  function wLeave() { const b = $("wbulk"); if (b) b.remove(); document.body.classList.remove("has-bulk"); wSel.clear(); wSelMode = false; const m = $("wmenu"); if (m) m.remove(); }
  function wToggleSel(id) { wSel.has(id) ? wSel.delete(id) : wSel.add(id); wAnchor = id; wSelUI(); }
  function wRangeSel(row, id) {
    const kids = [...row.parentElement.children].filter((k) => k.dataset && k.dataset.id), a = kids.findIndex((k) => k.dataset.id === wAnchor), b = kids.findIndex((k) => k.dataset.id === id);
    if (a < 0 || b < 0) { wToggleSel(id); return; }
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) wSel.add(kids[i].dataset.id); wSelUI();
  }
  function wSelUI() {
    [...wSel].forEach((id) => { if (!wtask(id)) wSel.delete(id); });
    document.querySelectorAll("#vWork .wcard, #vWork .wtask").forEach((el) => el.classList.toggle("sel", wSel.has(el.dataset.id)));
    let bar = $("wbulk");
    if (view !== "work" || (!wSel.size && !wSelMode)) { if (bar) bar.remove(); document.body.classList.remove("has-bulk"); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "wbulk"; bar.className = "wbulk"; document.body.appendChild(bar);
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.st !== undefined) wBulkStatus(b.dataset.st); else if (b.dataset.a === "dup") wBulkDup(); else if (b.dataset.a === "del") wBulkDelete(); else if (b.dataset.a === "x") { wSel.clear(); wSelMode = false; wSelUI(); renderWork(); }
      });
    }
    const n = wSel.size;
    bar.innerHTML = `<b>${n ? "Выбрано " + n : "Выбери карточки"}</b><div class="wbs">${W_ST.map((st) => `<button data-st="${st}"${n ? "" : " disabled"}>${W_NAME[st]}</button>`).join("")}<button data-st=""${n ? "" : " disabled"}>В склад</button><button data-a="dup"${n ? "" : " disabled"}>Дублировать</button><button class="d" data-a="del"${n ? "" : " disabled"}>Удалить</button></div><button class="x" data-a="x" aria-label="Снять выбор">✕</button>`;
    document.body.classList.add("has-bulk");
  }
  function wBulkStatus(st) { if (!wSel.size) return; wBatch(() => wTasksOf(wSel).forEach((t) => wMove(t, { kind: "col", status: st, before: null }))); renderWork(); }
  function wBulkDup() {
    const src = wTasksOf(wSel); if (!src.length) return; const ids = [];
    wBatch(() => src.forEach((t) => { const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.check = c.check.map((k) => ({ ...k, id: uid() })); c.spent = 0; c.acc = 0; c.sessions = 0; c.ord = t.ord + 0.001; S.work.tasks.push(c); ids.push(c.id); wSubs(t).forEach((k) => { const d = JSON.parse(JSON.stringify(k)); d.id = uid(); d.parent = c.id; d.check = d.check.map((q) => ({ ...q, id: uid() })); d.spent = 0; d.acc = 0; d.sessions = 0; d.status = ""; d.doneAt = 0; S.work.tasks.push(d); }); }));
    wSel = new Set(ids); renderWork(); toast("Скопировано: " + ids.length);
  }
  function wBulkDelete() {
    const gone = wTasksOf(wSel); if (!gone.length) return; const set = new Set(gone.map((t) => t.id)), snap = S.work.tasks.slice();
    if (T && T.work && set.has(T.id)) closeTimer(true);
    S.work.tasks.forEach((t) => { if (set.has(t.parent)) set.add(t.id); });
    S.work.tasks = S.work.tasks.filter((t) => !set.has(t.id)); gone.forEach((t) => wExp.delete(t.id)); wSel.clear(); persist(); renderWork();
    toast("Удалено: " + gone.length, "Отменить", () => { S.work.tasks = snap.filter((t) => set.has(t.id) || S.work.tasks.some((x) => x.id === t.id)); persist(); renderWork(); });
  }
  function wNewForm(st, pos) {
    const f = document.createElement("form"); f.className = "wnewc";
    const act = S.work.projects.filter((p) => !p.archived), def = wproj(wFilter) ? wFilter : (wproj(wLastProj) && !wproj(wLastProj).archived ? wLastProj : (act[0] || {}).id);
    f.innerHTML = `<input type="text" maxlength="120" placeholder="Название задачи" aria-label="Новая задача"><select class="wnp" aria-label="Проект">${act.map((p) => `<option value="${esc(p.id)}"${p.id === def ? " selected" : ""}>${esc(p.icon + " " + p.name)}</option>`).join("")}</select>`;
    const inp = f.querySelector("input"), sel = f.querySelector("select");
    f.onsubmit = (e) => {
      e.preventDefault(); const v = inp.value.trim(); if (!v || !sel.value) return;
      const p = wproj(sel.value), all = S.work.tasks.filter((t) => t.status === st);
      const t = newWTask({ name: v, project: p.id, stage: p.stages[0].id, status: st, doneAt: st === "done" ? Date.now() : 0, ord: pos === "top" ? Math.min(0, ...all.map((x) => x.ord)) - 1 : maxOrd(all) + 1 });
      S.work.tasks.push(t); wLastProj = p.id; persist(); wNewFocus = true; renderWork();
    };
    f.addEventListener("keydown", (e) => { if (e.key === "Escape") { wNew = null; renderWork(); } });
    f.addEventListener("focusout", () => setTimeout(() => { if (wNew && !f.contains(document.activeElement) && !inp.value.trim()) { wNew = null; if (f.isConnected) renderWork(); } }, 120));
    return f;
  }
  // context menu (mouse): act on the selection, or on the card under the pointer
  function wMenu(x, y) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu"; const n = wSel.size;
    m.innerHTML = W_ST.map((st) => `<button data-st="${st}">→ ${W_NAME[st]}</button>`).join("") + `<button data-st="">→ В склад</button><hr><button data-a="dup">Дублировать${n > 1 ? " (" + n + ")" : ""}</button><button class="d" data-a="del">Удалить${n > 1 ? " (" + n + ")" : ""}</button>`;
    document.body.appendChild(m); const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + "px";
    m.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; m.remove(); if (b.dataset.st !== undefined) wBulkStatus(b.dataset.st); else if (b.dataset.a === "dup") wBulkDup(); else if (b.dataset.a === "del") wBulkDelete(); };
    setTimeout(() => document.addEventListener("pointerdown", function once(e) { if (!m.contains(e.target)) { m.remove(); } document.removeEventListener("pointerdown", once); }), 0);
  }
  // quick estimate menu (right-click / long-press on ▶)
  function wTimeMenu(t, x, y) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu wtm";
    const draw = () => {
      const left = t.est ? Math.max(0, Math.ceil(t.est - wSelfMs(t) / 60000)) : 0;
      m.innerHTML = `<div class="wtm-h">${esc(t.name || "Задача")}</div><div class="wtm-g">${[3, 5, 10, 15, 20, 30, 45, 60].map((v) => `<button data-m="${v}" aria-pressed="${t.est === v}">${v}</button>`).join("")}</div>
        <div class="wtm-r"><button data-s="-1" aria-label="Меньше">−</button><b>${t.est ? t.est + " мин" : "без оценки"}</b><button data-s="1" aria-label="Больше">+</button></div>
        <hr><button data-a="go" class="wtm-go">▶ Старт${left ? " · " + left + " мин" : ""}</button>${t.est ? `<button data-a="clr">Убрать оценку</button>` : ""}`;
    };
    draw(); document.body.appendChild(m); const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x - r.width + 20, innerWidth - r.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(y + 8, innerHeight - r.height - 8)) + "px";
    const upd = () => { persist(); const el = document.querySelector(`#vWork .wcard[data-id="${t.id}"], #vWork .wtask[data-id="${t.id}"]`); if (el) wTouch(el); if (t.parent) { const pe = document.querySelector(`#vWork .wcard[data-id="${t.parent}"]`); if (pe) wTouch(pe); } draw(); };
    m.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.m) { t.est = +b.dataset.m; upd(); }
      else if (b.dataset.s) { const c = t.est || 0, st = c < 10 ? 1 : c < 60 ? 5 : 15, d = +b.dataset.s; t.est = Math.max(0, Math.min(960, d > 0 ? c + st : (c <= 10 ? c - 1 : c - st))); upd(); }
      else if (b.dataset.a === "clr") { t.est = 0; upd(); }
      else if (b.dataset.a === "go") { m.remove(); startWorkTimer(t.id); }
    };
    setTimeout(() => document.addEventListener("pointerdown", function once(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("pointerdown", once); } }), 0);
  }
  function wFabMenu(x, y) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu wfabm";
    m.innerHTML = `<button data-a="t">Задача</button><button data-a="p">Проект</button>${wUndoS.length ? `<button data-a="u">↶ Отменить</button>` : ""}<button data-a="s">${wSelMode ? "Закончить выбор" : "Выбрать несколько"}</button>`;
    document.body.appendChild(m); const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, x - r.width) + "px"; m.style.top = Math.max(8, y - r.height - 8) + "px";
    m.onclick = (e) => { const a = e.target.closest("button")?.dataset.a; if (!a) return; m.remove();
      if (a === "t") wOpenNewTask({}); else if (a === "p") wOpenSheet({ type: "project", draft: newWProject({ id: "w-" + uid() }), isNew: true }); else if (a === "u") wUndo(); else { wSelMode = !wSelMode; if (!wSelMode) wSel.clear(); wSelUI(); renderWork(); } };
    setTimeout(() => document.addEventListener("pointerdown", function once(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("pointerdown", once); } }), 0);
  }
  function wDeleteTask(t) {
    const idx = S.work.tasks.indexOf(t); if (idx < 0) return;
    if (T && T.id === t.id) closeTimer(true);
    const kids = S.work.tasks.filter((x) => x.parent === t.id); S.work.tasks = S.work.tasks.filter((x) => x !== t && x.parent !== t.id); persist(); renderWork();
    toast("Задача удалена", "Отменить", () => { S.work.tasks.splice(Math.min(idx, S.work.tasks.length), 0, t, ...kids); persist(); renderWork(); });
  }

  // ---------- render ----------
  // progress = time actually worked (saved sessions + running timer) vs. planned estimate
  const wSubs = (t) => S.work.tasks.filter((x) => x.parent === t.id && !x.pre).sort(byOrd);
  const wPres = (t) => S.work.tasks.filter((x) => x.parent === t.id && x.pre).sort(byOrd);
  const wPreOpen = new Set(); let wAdding = null;
  const wSubOpen = new Set(), wSubEdit = new Set();
  function wSelfMs(t) { let ms = t.status === "done" ? Math.max(t.spent || 0, t.acc || 0) : (t.acc || 0); if (typeof T !== "undefined" && T && T.work && T.id === t.id && t.status !== "done") ms += Math.max(0, spentMs()); return ms; }
  // progress = how much of the work is done (never above 100%); time overrun is shown separately
  function wProg(t) {
    const subs = wSubs(t), pl = t.est || subs.reduce((a, k) => a + (k.est || 0), 0);
    const w = wSelfMs(t) + subs.reduce((a, k) => a + wSelfMs(k), 0), wm = Math.floor(w / 60000);
    let pct = null;
    if (subs.length) {
      const known = subs.filter((k) => k.est > 0), avg = known.length ? known.reduce((a, k) => a + k.est, 0) / known.length : 1;
      const wt = (k) => k.est > 0 ? k.est : avg, tot = subs.reduce((a, k) => a + wt(k), 0);
      const part = subs.reduce((a, k) => a + (k.status === "done" ? wt(k) : Math.min(0.9, k.est > 0 ? wSelfMs(k) / (k.est * 60000) : 0) * wt(k)), 0);
      pct = Math.round(part / tot * 100);
      if (subs.some((k) => k.status !== "done")) pct = Math.min(99, pct);
    } else if (pl) pct = Math.min(99, Math.round(w / (pl * 60000) * 100));
    if (pct === null) return null;
    const over = pl > 0 && wm > pl;
    const label = !pl ? "" : over ? wm + " из " + pl + " мин · +" + (wm - pl) : wm + " из " + pl + " мин";
    const tp = !pl ? 0 : over ? pl / wm * 100 : Math.min(100, w / (pl * 60000) * 100), to = over ? 100 - tp : 0;
    return { pct, over, label, pl, tp, to };
  }
  const wTBar = (g) => `<div class="wtbar${g.over ? " over" : ""}" title="Время: ${g.label}"><i class="wtb-p" style="width:${g.tp.toFixed(1)}%"></i><i class="wtb-o" style="width:${g.to.toFixed(1)}%"></i></div>`;
  function wUpdProg(t) {
    const el = document.querySelector(`#vWork .wcard[data-id="${t.id}"]:not(.wsub)`); if (!el) return;
    const g = t.status === "done" ? null : wProg(t), bg = el.querySelector(".wbig"), lt = el.querySelector(".wlt");
    if (!g || !bg || !lt) { wTouch(el); return; }
    bg.textContent = g.pct + "%"; lt.classList.toggle("over", !!g.over); lt.innerHTML = g.over ? esc(g.label).replace(/ · (\+\d+)$/, ' <b class="wov">$1</b>') : esc(g.label);
    const tb = el.querySelector(".wtbar"); if (tb && g.pl) { tb.classList.toggle("over", !!g.over); tb.querySelector(".wtb-p").style.width = g.tp.toFixed(1) + "%"; tb.querySelector(".wtb-o").style.width = g.to.toFixed(1) + "%"; } else if (!tb && g.pl) { wTouch(el); return; }
  }
  function wLive() {
    if (view !== "work" || !T || !T.work) return; const t = wtask(T.id); if (!t) return;
    wUpdProg(t); if (t.parent) { const pp = wtask(t.parent); if (pp) wUpdProg(pp); }
  }
  function bankTimer() {
    if (!T || !T.work) return; const t = wtask(T.id), ms = Math.round(spentMs()); if (!t || ms < 5000) return;
    t.acc = (t.acc || 0) + ms; t.sessions = (t.sessions || 0) + 1; persist();
  }
  function wSubTog(t, el) {
    if (t.parent) return ""; let edges = "";
    const pres = wPres(t), subs0 = wSubs(t);
    if (t.status !== "done") edges = (pres.length ? "" : `<button type="button" class="wedge wedge-pre" data-pre="1" aria-label="Добавить предзадачу" title="Предзадача"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg></button>`) + (subs0.length ? "" : `<button type="button" class="wedge wedge-sub" aria-label="Добавить подзадачу" title="Подзадача"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg></button>`); if (pres.length) { const po = wPreOpen.has(t.id); edges += `<button type="button" class="wsubt wknob wkpre" data-pre="1" aria-expanded="${po}" aria-label="${po ? "Скрыть предзадачи" : "Показать предзадачи"}" title="Предзадачи: ${pres.length}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg></button>`; }
    const subs = wSubs(t); if (!subs.length) return edges;
    const open = wSubOpen.has(t.id);
    return edges + `<button type="button" class="wsubt wknob" aria-expanded="${open}" aria-label="${subs.length ? (open ? "Скрыть подзадачи" : "Показать подзадачи") : "Добавить подзадачу"}" title="${subs.length ? "Подзадачи" : "Добавить подзадачу"}">${subs.length ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>'}</button>`;
  }
  const W_SHORT = { todo: "To do", doing: "В работе", wait: "Wait", done: "" };
  const W_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  function wDatePill(t) {
    if (!t.date && !t.time) return "";
    const today = dayISO(), d = t.date ? Math.round((new Date(t.date + "T12:00") - new Date(today + "T12:00")) / 864e5) : 0;
    const cls = t.status === "done" ? "ok" : t.date && d < 0 ? "bad" : d <= 1 ? "warn" : "ok";
    const lbl = t.date ? (d === 0 ? "сегодня" : d === 1 ? "завтра" : d === -1 ? "вчера" : shortDate(t.date)) : "";
    return `<span class="wdp ${cls}">${W_CLOCK}${esc(lbl)}${t.time ? (lbl ? " " : "") + t.time : ""}</span>`;
  }
  function wCardHTML(h, el, t, p) {
    const stock = el.classList.contains("stock"), sub = el.classList.contains("wsub"), done = t.status === "done";
    const play = done ? "" : `<button class="wplay" aria-label="Таймер">${I.play}</button>`;
    if (sub) {
      h.innerHTML = `<div class="wsrow"><button class="wchk sm" aria-label="Готово" aria-pressed="${done}">${I.check}</button><span class="wct">${esc(t.name || "Без названия")}</span>${wDatePill(t)}${t.est ? `<em class="wsm">${wEst(t.est)}</em>` : ""}${play}</div>`;
      return;
    }
    if (done) {
      const sp = Math.max(t.spent || 0, t.acc || 0);
      h.innerHTML = `<div class="wtrow wdone"><span class="wdk">${I.check}</span><div class="wct">${esc(t.name || "Без названия")}</div>${!stock && p ? `<span class="wpj">${esc(p.icon)}</span>` : ""}${sp >= 60000 ? `<em class="wsm">${durShort(sp)}</em>` : ""}</div>${wSubTog(t, el)}`;
      el.classList.toggle("has-knob", !!wSubTog(t, el)); return;
    }
    const pill = stock ? "" : p ? `<span class="wpi" title="${esc(p.name)}">${esc(p.icon)}</span>` : "";
    const up = t.parent ? `<span class="wpj">↳ ${esc((wtask(t.parent) || {}).name || "")}</span>` : "";
    const top = pill + up + wDatePill(t);
    const g = wProg(t), subs = t.parent ? [] : wSubs(t);
    const spent = done ? Math.max(t.spent || 0, t.acc || 0) : 0;
    const lbl = done ? "Готово" + (spent >= 60000 ? " · " + durShort(spent) : "") : g ? g.label : "";
    const big = done ? "100%" : g ? g.pct + "%" : "";
    const cl = t.check.length ? `<div class="wcl">${t.check.map((c) => `<div class="wcli${c.done ? " on" : ""}"><button type="button" class="wcc" data-cid="${esc(c.id)}" aria-pressed="${c.done}" aria-label="Пункт">${I.check}</button><span>${esc(c.text)}</span></div>`).join("")}</div>` : "";
    const nt = t.note ? `<div class="wcn">${esc(t.note)}</div>` : "", tog = wSubTog(t, el), sc = subs.length ? `<span class="wscnt">${subs.filter((k) => k.status === "done").length}/${subs.length} подзадач</span>` : "";
    el.classList.toggle("has-knob", !!tog);
    { const [cd, cn] = wCheckN(t), pr = t.pri ? `<span class="wpri p${t.pri}" title="${t.pri === 2 ? "Срочно" : "Важно"}">${t.pri === 2 ? "🔥" : "!"}</span>` : "";
      const meta = [g && g.pl ? `<span class="${g.over ? "over" : ""}">${esc(g.label)}</span>` : "", sc, cn ? `<span>${cd}/${cn} ✓</span>` : ""].filter(Boolean).join("");
      h.innerHTML = `<div class="wv3"><div class="wtrow">${pill}${pr}<div class="wct">${esc(t.name || "Без названия")}</div>${play}</div>${up || wDatePill(t) ? `<div class="wtop2">${up}${wDatePill(t)}</div>` : ""}${nt}${g && g.pl ? wTBar(g) : ""}${meta ? `<div class="wmeta">${meta}</div>` : ""}</div>${tog}`; return; }
    if (!big && !lbl && !sc) { h.innerHTML = `${top ? `<div class="wtop2">${top}</div>` : ""}<div class="wtrow"><div class="wct">${esc(t.name || "Без названия")}</div>${play}</div>${nt}${cl}${tog}`; return; }
    h.innerHTML = `${top ? `<div class="wtop2">${top}</div>` : ""}<div class="wct">${esc(t.name || "Без названия")}</div>${nt}${cl}<div class="wbot"><div class="wbl">${big ? `<b class="wbig">${big}</b>` : ""}<span class="wlbl"><span class="wlt${g && g.over ? " over" : ""}">${g && g.over ? esc(lbl).replace(/ · (\+\d+)$/, ' <b class="wov">$1</b>') : esc(lbl)}</span>${sc}</span></div>${play}</div>${g && g.pl ? wTBar(g) : ""}${tog}`;
  }
  function wFillHead(el, t) {
    const h = el.querySelector(".whead"), p = wproj(t.project), [cd, cn] = wCheckN(t), card = el.classList.contains("wcard");
    const sp = t.status === "done" ? t.spent : t.acc;
    const chips = `${t.date ? `<span class="wchip${wOver(t) ? " late" : ""}">${shortDate(t.date)}${t.time ? " " + t.time : ""}</span>` : ""}${t.est && !(card && t.status !== "done") ? `<span class="wchip">${wEst(t.est)}</span>` : ""}${cn ? `<span class="wchip">${cd}/${cn}</span>` : ""}${sp >= 30000 && !(card && t.est && t.status !== "done") ? `<span class="wchip">${durShort(sp)}</span>` : ""}${t.note ? `<span class="wchip">≡</span>` : ""}`;
    const stock = el.classList.contains("stock");
    if (card) { wCardHTML(h, el, t, p); return; }
    else h.innerHTML = `<button class="wchk" aria-label="Готово" aria-pressed="${t.status === "done"}">${I.check}</button><div class="wtx"><span class="wtn">${esc(t.name || "Без названия")}</span><span class="wtm">${chips}</span></div>${t.status !== "done" ? `<button class="wplay" aria-label="Таймер">${I.play}</button>` : ""}`;
  }
  function wItemEl(t, cls, stock) {
    const el = document.createElement("div");
    el.className = cls + (stock ? " stock" : "") + (t.status === "done" ? " done" : "") + (wExp.has(t.id) ? " open" : "") + (!t.parent && cls === "wcard" && !wSubOpen.has(t.id) && wSubs(t).some((k) => !k.status) ? " wstack" : ""); el.dataset.id = t.id;
    { const pp = wproj(t.project); if (pp) { el.style.setProperty("--cc", `var(--pc-${pp.color})`); el.style.setProperty("--cb", `var(--pc-${pp.color}-bg)`); } }
    el.innerHTML = '<div class="whead"></div>'; wFillHead(el, t);
    if (wExp.has(t.id)) { const b = document.createElement("div"); b.className = "wbody"; el.appendChild(b); wTaskForm(b, t, {}); }
    return el;
  }
  const wCardEl = (t, stock, sub) => wItemEl(t, sub ? "wcard wsub" : "wcard", stock);
  let wSubFocus = null;
  function wPutCard(box, t, stock) {
    const addIn = (pre) => { const w = document.createElement("div"); w.className = "wsadd-w" + (pre ? " pre" : ""); w.innerHTML = `<input type="text" class="wsadd" data-pid="${esc(t.id)}"${pre ? ' data-pre="1"' : ""} maxlength="120" placeholder="${pre ? "Предзадача… Enter" : "Подзадача… Enter"}" aria-label="${pre ? "Новая предзадача" : "Новая подзадача"}">`; box.appendChild(w); };
    const preTop = !t.parent && wPreOpen.has(t.id) && wPres(t).length && t.status !== "done" && !(wAdding && wAdding.id === t.id && wAdding.pre);
    if (preTop) { const b = document.createElement("button"); b.type = "button"; b.className = "wsplus pre"; b.dataset.pid = t.id; b.dataset.pre = "1"; b.textContent = "+ предзадача"; box.appendChild(b); }
    if (!t.parent && wPreOpen.has(t.id)) wPres(t).filter((k) => !k.status).forEach((k) => { const c = wCardEl(k, true, true); c.classList.add("wpre"); box.appendChild(c); });
    if (!t.parent && wAdding && wAdding.id === t.id && wAdding.pre) addIn(true);

    box.appendChild(wCardEl(t, stock));
    if (t.parent) return;
    if (wSubOpen.has(t.id)) wSubs(t).filter((k) => !k.status).forEach((k) => box.appendChild(wCardEl(k, true, true)));
    if (wAdding && wAdding.id === t.id && !wAdding.pre) addIn(false);
    else if (wSubOpen.has(t.id) && wSubs(t).length && t.status !== "done") { const b = document.createElement("button"); b.type = "button"; b.className = "wsplus"; b.dataset.pid = t.id; b.textContent = "+ подзадача"; box.appendChild(b); }
  }
  function wTouch(box) { const el = box.closest(".wcard, .wtask"); if (!el) return; const t = wtask(el.dataset.id); if (!t) return; wFillHead(el, t); el.classList.toggle("done", t.status === "done"); }
  function renderWork() {
    const el = $("vWork"), sc = el.querySelector(".wcols")?.scrollLeft || 0; wPsc = el.querySelector(".wpcols")?.scrollLeft || 0;
    el.innerHTML = "";
    const wk = document.createElement("div"); wk.className = "wk col"; wk.dataset.seg = wSeg; el.appendChild(wk);
    const projs = S.work.projects.filter((p) => !p.archived), arch = S.work.projects.filter((p) => p.archived);

    const top = document.createElement("div"); top.className = "wtop";
    const seg = document.createElement("div"); seg.className = "seg wseg";
    [["board", "Доска"], ["projects", "Проекты"]].forEach(([id, l]) => { const b = document.createElement("button"); b.textContent = l; b.setAttribute("aria-pressed", wSeg === id); b.onclick = () => { wSeg = id; saveW(); renderWork(); }; seg.appendChild(b); });
    const acts = document.createElement("div"); acts.className = "wacts";
    const bt = document.createElement("button"); bt.className = "act primary"; bt.textContent = "+ Задача"; bt.id = "wFab"; bt.setAttribute("aria-label", "Создать"); bt.onclick = (e) => { if (!matchMedia("(max-width: 700px)").matches) { wOpenNewTask({}); return; } const r = bt.getBoundingClientRect(); wFabMenu(r.right, r.top); };
    const bp = document.createElement("button"); bp.className = "act"; bp.textContent = "+ Проект"; bp.onclick = () => wOpenSheet({ type: "project", draft: newWProject({ id: "w-" + uid() }), isNew: true });
    const bu = document.createElement("button"); bu.className = "act"; bu.id = "wUndoBtn"; bu.textContent = "↶"; bu.title = "Отменить (⌘Z)"; bu.setAttribute("aria-label", "Отменить"); bu.disabled = !wUndoS.length; bu.onclick = wUndo;
    const bsel = document.createElement("button"); bsel.className = "act"; bsel.textContent = wSelMode ? "Готово" : "Выбрать"; bsel.setAttribute("aria-pressed", wSelMode); bsel.id = "wSelBtn"; bsel.onclick = () => { wSelMode = !wSelMode; if (!wSelMode) wSel.clear(); wSelUI(); renderWork(); };
    const bv = document.createElement("button"); bv.className = "act wvbtn"; bv.innerHTML = W_MIC + "<span>Надиктовать</span>"; bv.title = "Надиктовать задачи голосом"; bv.onclick = () => wVoiceOpen(true);
    acts.append(bv, bsel, bu, bt, bp); top.append(seg, acts); wk.appendChild(top);

    // board
    const bs = document.createElement("section"); bs.className = "wboard";
    const fl = document.createElement("div"); fl.className = "wfilt";
    [["all", "Все"], ...projs.map((p) => [p.id, p.icon + " " + p.name])].forEach(([id, l]) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = l; b.setAttribute("aria-pressed", wFilter === id); b.onclick = () => { wFilter = id; renderWork(); }; fl.appendChild(b); });
    bs.appendChild(fl);
    const cols = document.createElement("div"); cols.className = "wcols";
    W_ST.forEach((st) => {
      let list = S.work.tasks.filter((t) => t.status === st && (wFilter === "all" || t.project === wFilter));
      list = st === "done" ? list.sort((a, b) => (b.doneAt - a.doneAt) || (a.ord - b.ord)) : list.sort(byOrd);
      const col = document.createElement("div"); col.className = "wcol c-" + W_COL[st]; col.dataset.st = st;
      col.innerHTML = `<div class="wch"><span class="wpill pc-${W_COL[st]}"><span class="wdot"></span>${W_NAME[st]}</span><i>${list.length}</i>${list.reduce((a, x) => a + (x.est || 0), 0) ? `<em class="wsumt" title="Сумма времени задач в колонке">${wEst(list.reduce((a, x) => a + (x.est || 0), 0))}</em>` : ""}${st === "done" && list.length ? `<button class="wclear" aria-label="Очистить завершённые">Очистить</button>` : ""}<button class="wplus" aria-label="Добавить в ${W_NAME[st]}">+</button></div><div class="wcards"></div>`;
      const box = col.querySelector(".wcards");
      if (wNew && wNew.st === st && wNew.pos === "top") box.appendChild(wNewForm(st, "top"));
      list.slice(0, st === "done" && !wDoneAll ? 12 : 500).forEach((t) => wPutCard(box, t, false));
      if (wNew && wNew.st === st && wNew.pos === "bottom") box.appendChild(wNewForm(st, "bottom"));
      else { const nb = document.createElement("button"); nb.className = "wnewbtn"; nb.innerHTML = "<span>+</span> Новая"; nb.onclick = () => { wNew = { st, pos: "bottom" }; wNewFocus = true; renderWork(); }; col.appendChild(nb); }
      if (st === "done" && list.length > 12) { const m = document.createElement("button"); m.className = "wmore"; m.textContent = wDoneAll ? "Свернуть" : "Показать все (" + list.length + ")"; m.onclick = () => { wDoneAll = !wDoneAll; renderWork(); }; box.appendChild(m); }
      cols.appendChild(col);
    });
    bs.appendChild(cols); wk.appendChild(bs);

    // projects
    const ps = document.createElement("section"); ps.className = "wprojects"; const pcols = document.createElement("div"); pcols.className = "wpcols"; ps.appendChild(pcols);
    if (!projs.length && !arch.length) { const e = document.createElement("div"); e.className = "card wempty"; e.textContent = "Проектов нет. Нажми «+ Проект»."; ps.appendChild(e); }
    projs.forEach((p) => pcols.appendChild(wProjectEl(p)));
    if (arch.length || projs.length) {
      const b = document.createElement("button"); b.className = "act"; b.textContent = (wShowArch ? "Скрыть архив" : "Архив") + " (" + arch.length + ")"; b.onclick = () => { wShowArch = !wShowArch; renderWork(); }; ps.appendChild(b);
      if (wShowArch) { const ac = document.createElement("div"); ac.className = "wpcols wacols"; arch.forEach((p) => ac.appendChild(wProjectEl(p))); ps.appendChild(ac); }
    }
    wk.appendChild(ps);
    wk.querySelector(".wcols").scrollLeft = sc; const pcs = wk.querySelector(".wpcols"); if (pcs) pcs.scrollLeft = wPsc;
    if (wAdding) { const ai = wk.querySelector(`.wsadd[data-pid="${wAdding.id}"]`); if (ai) ai.focus(); }
    if (wNewFocus) { const ni = wk.querySelector(".wnewc input"); if (ni) ni.focus(); wNewFocus = false; }
    wSelUI();
    if (wFocus) { const inp = wk.querySelector(`.wadd[data-sid="${wFocus}"] input`); if (inp) inp.focus(); wFocus = null; }
    wBindList(wk);
  }
  function wProjectEl(p) {
    const all = S.work.tasks.filter((t) => t.project === p.id), tasks = all.filter((t) => !t.status && !t.parent), onBoard = all.length - tasks.length;
    const col = document.createElement("div"); col.className = "wpcol" + (p.archived ? " arch" : ""); col.dataset.pid = p.id; col.style.cssText = `--cc:var(--pc-${p.color});--cb:var(--pc-${p.color}-bg);background:var(--pc-${p.color}-bg)`;
    col.innerHTML = `<div class="wph"><span class="wpill wptag pc-${p.color}">${esc(p.icon)} ${esc(p.name)}</span><i>${tasks.length}</i><button class="pen" aria-label="Редактировать проект">${PEN}</button></div>
      <div class="wpm">${p.date ? `<span class="wchip">до ${shortDate(p.date)}</span>` : ""}${p.money ? `<span class="wchip ${p.paid ? "paid" : ""}">${esc(p.money)}${p.paid ? " ✓" : ""}</span>` : ""}${wLink(p.contact)}</div>`;
    col.querySelector(".pen").onclick = () => wOpenSheet({ type: "project", id: p.id });
    if (p.note) { const n = document.createElement("div"); n.className = "wnote"; n.textContent = p.note; col.appendChild(n); }
    p.stages.forEach((s) => {
      const st = document.createElement("div"); st.className = "wstage"; st.dataset.pid = p.id; st.dataset.sid = s.id;
      st.innerHTML = `${p.stages.length > 1 ? `<div class="wsh"><b>${esc(s.name)}</b><button class="pen" aria-label="Этап">${PEN}</button></div>` : ""}<div class="wlist wcards"></div>
        <form class="wadd" data-sid="${s.id}"><input type="text" maxlength="120" placeholder="+ Задача" aria-label="Новая задача"></form>`;
      const lst = st.querySelector(".wlist");
      tasks.filter((t) => t.stage === s.id).sort(byOrd).forEach((t) => wPutCard(lst, t, true));
      const pen = st.querySelector(".pen"); if (pen) pen.onclick = () => wOpenSheet({ type: "stage", pid: p.id, sid: s.id });
      st.querySelector(".wadd").onsubmit = (e) => { e.preventDefault(); const inp = e.target.querySelector("input"), v = inp.value.trim(); if (!v) return; wAddTask(v, p.id, s.id, ""); wFocus = s.id; renderWork(); };
      col.appendChild(st);
    });
    const as = document.createElement("button"); as.className = "wmore"; as.textContent = "+ Этап";
    as.onclick = () => { p.stages.push({ id: "s-" + uid(), name: "Stage " + (p.stages.length + 1) }); persist(); renderWork(); };
    return col;
  }
  // click handling for cards / rows (delegated per render)
  // inline rename: click right on the title text
  function wHitText(el, x, y) {
    const r = document.createRange(); r.selectNodeContents(el);
    return [...r.getClientRects()].some((q) => x >= q.left - 2 && x <= q.right + 2 && y >= q.top - 2 && y <= q.bottom + 2);
  }
  function wRename(el, t, row, x, y) {
    const old = t.name || "";
    el.textContent = old;
    try { el.contentEditable = "plaintext-only"; } catch { el.contentEditable = "true"; }
    if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
    el.classList.add("wedit"); el.spellcheck = false; el.focus();
    const sel = getSelection(), pos = document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
    sel.removeAllRanges(); if (pos && el.contains(pos.startContainer)) sel.addRange(pos); else { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.addRange(r); }
    let done = false;
    const finish = (save) => {
      if (done) return; done = true;
      const v = el.textContent.replace(/\s+/g, " ").trim().slice(0, 140);
      el.removeAttribute("contenteditable"); el.classList.remove("wedit");
      if (save && v && v !== old) { t.name = v; persist(); }
      wTouch(row); if (t.parent) { const pe = document.querySelector(`#vWork .wcard[data-id="${t.parent}"]`); if (pe) wTouch(pe); }
    };
    el.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); finish(true); } else if (e.key === "Escape") { e.preventDefault(); finish(false); } };
    el.onblur = () => finish(true);
    el.onpaste = (e) => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData.getData("text") || "").replace(/\s+/g, " ")); };
  }
  function wBindList(wk) {
    wk.addEventListener("click", (e) => {
      if (e.target.closest(".wclear")) { wClearDone(); return; }
      const plus = e.target.closest(".wplus"); if (plus) { wNew = { st: plus.closest(".wcol").dataset.st, pos: "top" }; wNewFocus = true; renderWork(); return; }
      const row = e.target.closest(".wcard, .wtask");
      if (!row) { if (wSel.size && !wSelMode && !e.target.closest("button, input, select, textarea, a, label")) { wSel.clear(); wSelUI(); } return; }
      const t = wtask(row.dataset.id); if (!t) return;
      const ttl = e.target.closest(".whead .wct");
      if (ttl && ttl.isContentEditable) return;
      if (ttl && !(e.metaKey || e.ctrlKey || e.shiftKey || wSelMode) && wHitText(ttl, e.clientX, e.clientY)) { wRename(ttl, t, row, e.clientX, e.clientY); return; }
      const sr = e.target.closest(".wsr");
      if (sr) {
        const k = wtask(sr.dataset.sid); if (!k) return;
        if (e.target.closest(".wsck")) { if (k.status === "done") { k.status = ""; k.doneAt = 0; persist(); } else wSetStatus(k, "done"); renderWork(); }
        else if (e.target.closest(".wsplay")) startWorkTimer(k.id);
        else if (e.target.closest(".wsgo")) { wSetStatus(k, "todo"); renderWork(); }
        else if (e.target.closest(".wsc")) { wSubEdit.has(k.id) ? wSubEdit.delete(k.id) : wSubEdit.add(k.id); const row = sr.closest(".wcard"); wFillHead(row, wtask(row.dataset.id)); }
        return;
      }
      const edg = e.target.closest(".wedge"); if (edg) { const pre = !!edg.dataset.pre; wAdding = { id: t.id, pre }; (pre ? wPreOpen : wSubOpen).add(t.id); renderWork(); return; }
      const stg = e.target.closest(".wsubt"); if (stg) { const S2 = stg.dataset.pre ? wPreOpen : wSubOpen; S2.has(t.id) ? S2.delete(t.id) : S2.add(t.id); renderWork(); return; }
      if (e.target.closest(".wsp")) return;
      const cc = e.target.closest(".wcc");
    if (cc) { const c = t.check.find((x) => x.id === cc.dataset.cid); if (c) { c.done = !c.done; persist(); wTouch(row); } return; }
    if (e.target.closest(".wcli span") && !wExp.has(t.id) && !(e.metaKey || e.ctrlKey || e.shiftKey || wSelMode)) { const c = t.check.find((x) => x.id === e.target.closest(".wcli").querySelector(".wcc").dataset.cid); if (c) { c.done = !c.done; persist(); wTouch(row); } return; }
    if (e.target.closest(".wplay")) { startWorkTimer(t.id); return; }
      if (e.target.closest(".wgo")) { wSetStatus(t, "todo"); renderWork(); return; }
      if (e.target.closest(".whead .wchk")) { if (t.status === "done") wSetStatus(t, "todo"); else wSetStatus(t, "done"); renderWork(); return; }
      if (e.metaKey || e.ctrlKey) { wToggleSel(t.id); return; }
      if (e.shiftKey) { wRangeSel(row, t.id); return; }
      if (e.target.closest("input, textarea, select, button, label, a") || String(getSelection()).trim()) return;
      if (wSelMode) { wToggleSel(t.id); return; }
      if (wSel.size) { wSel.clear(); wSelUI(); }
      wExp.has(t.id) ? wExp.delete(t.id) : wExp.add(t.id);
      row.replaceWith(wCardEl(t, row.classList.contains("stock"), row.classList.contains("wsub")));
    });
  }

  document.addEventListener("change", (e) => {
    const sr = e.target.closest && e.target.closest("#vWork .wsr"); if (!sr) return; const k = wtask(sr.dataset.sid); if (!k) return; const row = sr.closest(".wcard"), t = row && wtask(row.dataset.id);
    if (e.target.classList.contains("wsn")) { const v = e.target.value.trim(); if (!v) { wDeleteTask(k); return; } k.name = v; persist(); }
    else if (e.target.classList.contains("wse")) { k.est = Math.max(0, Math.min(960, Math.round(+e.target.value || 0))); persist(); if (t) wUpdProg(t); }
  });
  document.addEventListener("keydown", (e) => {
    const inp = e.target; if (!inp.classList) return;
    if (inp.classList.contains("wsn") && e.key === "Enter") { e.preventDefault(); inp.blur(); return; }
    if (!inp.classList.contains("wsadd")) return;
    if (e.key === "Escape") { e.preventDefault(); wAdding = null; renderWork(); return; }
    if (e.key !== "Enter") return; e.preventDefault();
    const t = wtask(inp.dataset.pid), v = inp.value.trim(); if (!t) return; if (!v) { wAdding = null; renderWork(); return; }
    const k = newWTask({ name: v, project: t.project, stage: t.stage, parent: t.id, ord: maxOrd(S.work.tasks) + 1 }); if (inp.dataset.pre) k.pre = true;
    S.work.tasks.push(k); wAdding = { id: t.id, pre: !!inp.dataset.pre }; persist(); renderWork();
  });

  let wKnobRaf = 0, wKnobXY = null;
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || view !== "work") return; wKnobXY = [e.clientX, e.clientY]; if (wKnobRaf) return;
    wKnobRaf = requestAnimationFrame(() => {
      wKnobRaf = 0; const [x, y] = wKnobXY;
      document.querySelectorAll("#vWork .wknob").forEach((b) => {
        const r = b.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)), k = d > 110 ? 1 : 1 + 0.75 * (1 - d / 110);
        b.style.setProperty("--k", k.toFixed(3));
      });
    });
  });

  // ---------- drag: board cards and stage rows ----------
  const wColOf = (x, y) => {
    const e = document.elementFromPoint(x, y); if (!e) return null;
    const c = e.closest(".wcol"); if (c) return { kind: "col", box: c.querySelector(".wcards"), status: c.dataset.st, el: c };
    const pc = e.closest(".wpcol"), s = e.closest(".wstage") || (pc && pc.querySelector(".wstage")); if (s) return { kind: "stage", box: s.querySelector(".wlist"), stage: s.dataset.sid, project: s.dataset.pid, el: s };
    return null;
  };
  function wBegin() {
    const d = wd; if (!d || d.active) return;
    d.active = true; suppressClick = true; try { getSelection().removeAllRanges(); } catch {}
    const r = d.src.getBoundingClientRect();
    d.ox = d.x - r.left; d.oy = d.y - r.top;
    d.ghost = d.src.cloneNode(true); d.ghost.classList.add("wghost"); d.ghost.style.width = r.width + "px"; document.body.appendChild(d.ghost);
    d.ph = document.createElement("div"); d.ph.className = d.kind === "proj" ? "wph-vline" : "wph-line";
    d.src.classList.add("wlift"); document.body.style.userSelect = "none";
    d.multi = d.kind !== "proj" && wSel.size > 1 && wSel.has(d.t.id) ? new Set(wSel) : null;
    if (d.multi) { document.querySelectorAll("#vWork .wcard, #vWork .wtask").forEach((el) => { if (d.multi.has(el.dataset.id)) el.classList.add("wlift"); }); d.ghost.insertAdjacentHTML("beforeend", `<span class="wcount">${d.multi.size}</span>`); }
    wGhostPos(); wLoop();
  }
  function wGhostPos() { const d = wd; if (d && d.ghost) d.ghost.style.transform = `translate(${d.x - d.ox}px, ${d.y - d.oy}px)`; }
  function wTrackProj() {
    const d = wd, ps = document.querySelector("#vWork .wprojects"), hit = document.elementFromPoint(d.x, d.y);
    const ab = ps && ps.querySelector(".wacols"), nb = ps && [...ps.querySelectorAll(".wpcols")].find((x) => !x.classList.contains("wacols"));
    let box = hit && hit.closest("#vWork .wpcols");
    if (!box && hit && ab && hit.closest("#vWork .wprojects")) box = nb && d.y < nb.getBoundingClientRect().bottom ? nb : ab;
    box = box || d.box || d.src.parentElement; if (!box) return; d.box = box;
    document.querySelectorAll("#vWork .wpcols.wdrop").forEach((n) => n.classList.remove("wdrop")); if (ab && box === ab && d.src.parentElement !== ab) ab.classList.add("wdrop");
    const cols = [...box.children].filter((n) => n.classList.contains("wpcol") && n !== d.src);
    const before = cols.find((c) => { const r = c.getBoundingClientRect(); return d.x < r.left + r.width / 2; }) || null;
    d.before = before ? before.dataset.pid : null;
    if (before) box.insertBefore(d.ph, before); else box.appendChild(d.ph);
  }
  function wTrack() {
    const d = wd; if (!d || !d.active) return;
    if (d.kind === "proj") { wTrackProj(); return; }
    document.querySelectorAll(".wdrop, .wdz-pre, .wdz-sub").forEach((n) => n.classList.remove("wdrop", "wdz-pre", "wdz-sub"));
    d.nest = null;
    if (!d.multi && !S.work.tasks.some((x) => x.parent === d.t.id)) {
      const hit = document.elementFromPoint(d.x, d.y), card = hit && hit.closest("#vWork .wcard");
      if (card && card !== d.src) {
        const ct = wtask(card.dataset.id), r = card.getBoundingClientRect(), fy = (d.y - r.top) / r.height;
        if (ct && card.classList.contains("wsub") && ct.parent && ct.parent !== d.t.id) {
          const up = fy < 0.5; d.nest = { pid: ct.parent, pre: !!ct.pre, before: up ? ct.id : null, after: up ? null : ct.id };
          if (up) card.parentElement.insertBefore(d.ph, card); else card.after(d.ph); return;
        }
        if (ct && !ct.parent && ct.id !== d.t.id && ct.status !== "done" && (d.y - r.top < 14 || r.bottom - d.y < 14)) {
          const pre = d.y - r.top < 14; d.nest = { pid: ct.id, pre }; card.classList.add(pre ? "wdz-pre" : "wdz-sub"); d.ph.remove(); return;
        }
      }
    }
    const tg = wColOf(d.x, d.y); d.tgt = tg;
    if (!tg) { d.ph.remove(); return; }
    tg.el.classList.add("wdrop");
    const kids = [...tg.box.children].filter((n) => (n.classList.contains("wcard") || n.classList.contains("wtask")) && !n.classList.contains("wsub") && n !== d.src && !(d.multi && d.multi.has(n.dataset.id)));
    let before = null;
    if (!(tg.kind === "col" && tg.status === "done")) for (const k of kids) { const r = k.getBoundingClientRect(); if (d.y < r.top + r.height / 2) { before = k; break; } }
    d.before = before ? before.dataset.id : null;
    if (before) tg.box.insertBefore(d.ph, before); else tg.box.appendChild(d.ph);
  }
  function wLoop() {
    const d = wd; if (!d || !d.active) return;
    if (d.y < 70) window.scrollBy(0, -12); else if (d.y > innerHeight - 70) window.scrollBy(0, 12);
    const cs = d.kind === "proj" ? (d.box || d.src.parentElement) : (document.elementFromPoint(d.x, d.y)?.closest(".wcols, .wpcols") || d.src.closest(".wcols, .wpcols"));
    if (cs) { const r = cs.getBoundingClientRect(); if (d.y > r.top && d.y < r.bottom) { if (d.x < r.left + 40) cs.scrollLeft -= 14; else if (d.x > r.right - 40) cs.scrollLeft += 14; } }
    wTrack(); d.raf = requestAnimationFrame(wLoop);
  }
  function wReorder(pid, before, arch) {
    const arr = S.work.projects, i = arr.findIndex((p) => p.id === pid); if (i < 0) return;
    const [p] = arr.splice(i, 1); if (arch !== undefined) p.archived = !!arch;
    const j = before ? arr.findIndex((x) => x.id === before) : -1;
    if (j < 0) arr.push(p); else arr.splice(j, 0, p); persist();
  }
  function wEnd(drop) {
    const d = wd; if (!d) return; wd = null;
    clearTimeout(d.timer); cancelAnimationFrame(d.raf); document.body.style.userSelect = "";
    if (d.active) {
      d.ghost.remove(); d.ph.remove(); d.src.classList.remove("wlift"); document.querySelectorAll(".wdrop").forEach((n) => n.classList.remove("wdrop"));
      if (drop && d.kind === "proj") wReorder(d.src.dataset.pid, d.before, d.box ? d.box.classList.contains("wacols") : undefined);
      else if (drop && d.nest) wNest(d.t, d.nest);
      else if (drop && d.tgt) {
        const o = d.tgt.kind === "col" ? { kind: "col", status: d.tgt.status, before: d.before } : { kind: "stage", stage: d.tgt.stage, project: d.tgt.project, before: d.before, fromBoard: d.from === "board" };
        if (d.multi) { wBatch(() => wTasksOf(d.multi).forEach((x) => wMove(x, d.tgt.kind === "col" ? o : { ...o, fromBoard: true }))); wSel.clear(); }
        else wMove(d.t, o);
      }
      setTimeout(() => { suppressClick = false; }, 60);
      renderWork(); try { getSelection().removeAllRanges(); } catch {}
    }
  }
  const vw = $("vWork");
  vw.addEventListener("selectstart", (e) => { if ((wd && (wd.active || wd.mouse)) || wMq) e.preventDefault(); });
  vw.addEventListener("contextmenu", (e) => {
    const pl = e.target.closest(".wplay"); if (pl) { e.preventDefault(); const c = pl.closest(".wcard, .wtask"), t = c && wtask(c.dataset.id); if (t) { const r = pl.getBoundingClientRect(); wTimeMenu(t, r.right, r.bottom); } return; }
    const c = e.target.closest(".wcard, .wtask");
    if (c && matchMedia("(pointer: fine)").matches && !e.target.closest("input, textarea, select")) { e.preventDefault(); if (!wSel.has(c.dataset.id)) { wSel = new Set([c.dataset.id]); } wSelUI(); wMenu(e.clientX, e.clientY); return; }
    if (e.target.closest(".wcard, .wtask, .wpcol > .wph")) e.preventDefault();
  });
  let wLp = null;
  vw.addEventListener("pointerdown", (e) => {
    const pl = e.target.closest(".wplay"); if (!pl || e.pointerType === "mouse") return;
    clearTimeout(wLp); wLp = setTimeout(() => { wLp = null; const c = pl.closest(".wcard, .wtask"), t = c && wtask(c.dataset.id); if (!t) return; suppressClick = true; setTimeout(() => { suppressClick = false; }, 500); const r = pl.getBoundingClientRect(); wTimeMenu(t, r.right, r.bottom); }, 450);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => vw.addEventListener(ev, () => { clearTimeout(wLp); wLp = null; }));
  vw.addEventListener("touchmove", (e) => { if (wd && wd.active) e.preventDefault(); }, { passive: false });
  vw.addEventListener("pointerdown", (e) => {
    if (wd || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (e.pointerType === "mouse" && e.button === 0 && e.target.closest(".wk") && !e.target.closest(".wcard, .wtask, .wpcol > .wph, button, input, select, textarea, a, label, .wbody, .wfilt, .wtop, .wch, .wsh, .wadd, .wnewc, .wmore")) {
      wMq = { x0: e.clientX, y0: e.clientY, on: false, add: e.metaKey || e.ctrlKey || e.shiftKey, base: new Set(wSel), el: null };
      return;
    }
    const hd = e.target.closest(".wpcol > .wph");
    if (hd && !e.target.closest("button, input, a")) {
      wd = { kind: "proj", t: null, src: hd.parentElement, from: "proj", sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false, mouse: e.pointerType === "mouse", timer: null, raf: 0, tgt: null, before: null };
      if (!wd.mouse) wd.timer = setTimeout(wBegin, 350);
      return;
    }
    const src = e.target.closest(".wcard, .wtask"); if (!src || e.target.closest("button, input, a, .wbody, .wsp, [contenteditable]")) return;
    const t = wtask(src.dataset.id); if (!t) return;
    wd = { t, src, from: src.closest(".wstage") ? "stage" : "board", sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, active: false, mouse: e.pointerType === "mouse", timer: null, raf: 0, tgt: null, before: null };
    if (!wd.mouse) wd.timer = setTimeout(wBegin, 350);
  });
  document.addEventListener("pointermove", (e) => {
    const d = wd; if (!d) return; d.x = e.clientX; d.y = e.clientY;
    if (!d.active) { const dist = Math.hypot(d.x - d.sx, d.y - d.sy); if (d.mouse) { if (dist > 5) wBegin(); } else if (dist > 8) { clearTimeout(d.timer); wd = null; } return; }
    wGhostPos(); e.preventDefault();
  });
  document.addEventListener("pointermove", (e) => {
    const q = wMq; if (!q) return;
    if (!q.on) { if (Math.hypot(e.clientX - q.x0, e.clientY - q.y0) < 6) return; q.on = true; q.el = document.createElement("div"); q.el.className = "wmarq"; document.body.appendChild(q.el); try { getSelection().removeAllRanges(); } catch {} }
    const x1 = Math.min(q.x0, e.clientX), y1 = Math.min(q.y0, e.clientY), x2 = Math.max(q.x0, e.clientX), y2 = Math.max(q.y0, e.clientY);
    Object.assign(q.el.style, { left: x1 + "px", top: y1 + "px", width: x2 - x1 + "px", height: y2 - y1 + "px" });
    const hit = new Set(q.add ? q.base : []);
    document.querySelectorAll("#vWork .wcard, #vWork .wtask").forEach((c) => { const r = c.getBoundingClientRect(); if (r.right > x1 && r.left < x2 && r.bottom > y1 && r.top < y2) hit.add(c.dataset.id); });
    wSel = hit; wSelUI(); e.preventDefault();
  });
  document.addEventListener("pointerup", () => { const q = wMq; if (q) { wMq = null; if (q.on) { q.el.remove(); suppressClick = true; setTimeout(() => { suppressClick = false; }, 60); } } });
  document.addEventListener("pointerup", () => wEnd(true));
  document.addEventListener("pointercancel", () => wEnd(false));

  // ---------- bottom sheets ----------
  function wOpenNewTask(o) {
    const act = S.work.projects.filter((p) => !p.archived); if (!act.length) { toast("Сначала создай проект"); return; }
    const p = wproj(wFilter) || act[0];
    wOpenSheet({ type: "task", isNew: true, draft: newWTask({ project: p.id, stage: p.stages[0].id, status: o.status || "" }) });
  }
  function wOpenSheet(spec) { wSpec = spec; sheetSpec = null; wRenderSheet(); }
  const wChips = (opts, cur, attr) => opts.map(([v, l]) => `<button type="button" class="chip" ${attr}="${esc(v)}" aria-pressed="${String(v) === String(cur)}">${esc(l)}</button>`).join("");
  function wRenderSheet() {
    const bg = $("sheetBg"), box = $("sheet"); if (!wSpec) { bg.hidden = true; return; }
    if (wSpec.type === "task") wTaskSheet(box); else if (wSpec.type === "project") wProjectSheet(box); else wStageSheet(box);
    bg.hidden = false;
  }
  const wX = '<button class="icon-btn" id="shX" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
  const wBindX = (box) => { const x = box.querySelector("#shX"); if (x) x.onclick = closeSheet; };
  function wTaskSheet(box) { const t = wSpec.draft; if (!t) { closeSheet(); return; } wTaskForm(box, t, { isNew: true }); }
  function wTaskForm(box, t, o) {
    const isNew = !!o.isNew, redo = () => wTaskForm(box, t, o), dtOpen = box._dt !== undefined ? box._dt : !!(t.date || t.time);
    const save = () => { if (!isNew) { persist(); wTouch(box); if (t.parent) { const pe = document.querySelector(`#vWork .wcard[data-id="${t.parent}"]`); if (pe) wTouch(pe); } } };
    const move = () => { persist(); renderWork(); };
    const p = wproj(t.project), projs = S.work.projects.filter((x) => !x.archived || x.id === t.project);
    if (!isNew) return wTaskForm2(box, t, save);
    box.innerHTML = `${isNew ? `<div class="sheet-h"><b>Новая задача</b>${wX}</div>` : ""}
      <input type="text" class="field wf-name" maxlength="120" placeholder="Что сделать?" value="${esc(t.name)}">
      ${isNew ? `<div class="add-row wf-st">${wChips(Object.entries(W_NAME), t.status, "data-st")}</div>` : ""}
      <button type="button" class="wdtbtn" aria-expanded="${dtOpen}"><span>Дата и время</span><i>${t.date || t.time ? esc((t.date ? shortDate(t.date) : "") + (t.time ? " " + t.time : "")) : "не задано"}</i></button>
      <div class="wrow dt"${dtOpen ? "" : " hidden"}><label class="f">Дата <input type="date" class="field wf-date" value="${esc(t.date)}"></label><label class="f">Время <input type="time" class="field wf-time" value="${esc(t.time)}"></label></div>
      <div class="f">Заложено времени</div>
      <div class="add-row wf-est">${wChips([[0, "—"], [3, "3"], [5, "5"], [10, "10"], [20, "20"], [30, "30"]], t.est, "data-m")}<button type="button" class="wstep" data-s="-1" aria-label="Меньше">−</button><input type="number" class="field wnum wf-estn" min="0" max="960" step="5" inputmode="numeric" placeholder="мин" value="${t.est || ""}"><button type="button" class="wstep" data-s="1" aria-label="Больше">+</button></div>
      <div class="f">Чеклист</div><div class="wck wf-ck"></div>
      <input type="text" class="field wf-ckadd" maxlength="120" placeholder="+ пункт, Enter">
      <textarea class="field wf-note" rows="3" maxlength="4000" placeholder="Описание">${esc(t.note)}</textarea>
      ${isNew ? `<div class="wrow"><select class="field wf-proj" aria-label="Проект">${projs.map((x) => `<option value="${esc(x.id)}"${x.id === t.project ? " selected" : ""}>${esc(x.icon + " " + x.name)}</option>`).join("")}</select>
        </div>` : ""}
      <div class="add-row wf-act"></div>`;
    wBindX(box);
    const $$ = (q) => box.querySelector(q);
    const nm = $$(".wf-name");
    nm.oninput = () => { t.name = nm.value; if (addBtn) addBtn.disabled = !t.name.trim(); };
    nm.onchange = () => { if (!isNew && !nm.value.trim()) nm.value = t.name; else { t.name = nm.value.trim(); save(); } };
    $$(".wdtbtn").onclick = () => { box._dt = !dtOpen; redo(); };
    if ($$(".wf-proj")) { $$(".wf-proj").onchange = (e) => { const np = wproj(e.target.value); t.project = np.id; t.stage = np.stages[0].id; redo(); }; }
    box.querySelectorAll("[data-st]").forEach((b) => b.onclick = () => { if (isNew) { t.status = b.dataset.st; t.doneAt = t.status === "done" ? Date.now() : 0; redo(); } else { wSetStatus(t, b.dataset.st); renderWork(); } });
    $$(".wf-date").onchange = (e) => { t.date = e.target.value; save(); };
    $$(".wf-time").onchange = (e) => { t.time = e.target.value; save(); };
    box.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { t.est = +b.dataset.m; save(); redo(); });
    box.querySelectorAll(".wstep").forEach((b) => b.onclick = () => { const c = t.est || 0, st = c < 10 ? 1 : c < 60 ? 5 : 15, d = +b.dataset.s; t.est = Math.max(0, Math.min(960, d > 0 ? c + st : (c <= 10 ? c - 1 : c - st))); save(); redo(); });
    $$(".wf-estn").onchange = (e) => { t.est = Math.max(0, Math.min(960, Math.round(+e.target.value || 0))); save(); redo(); };
    $$(".wf-note").onchange = (e) => { t.note = e.target.value; save(); };
    const ck = $$(".wf-ck");
    t.check.forEach((c) => {
      const r = document.createElement("div"); r.className = "wcr";
      r.innerHTML = `<button type="button" class="wchk sm" aria-pressed="${c.done}" aria-label="Готово">${I.check}</button><input type="text" class="field" maxlength="120" value="${esc(c.text)}"><button type="button" class="pen xbtn" aria-label="Удалить">${XIC}</button>`;
      r.querySelector(".wchk").onclick = () => { c.done = !c.done; save(); redo(); };
      r.querySelector("input").onchange = (e) => { const v = e.target.value.trim(); if (v) c.text = v; else t.check.splice(t.check.indexOf(c), 1); save(); redo(); };
      r.querySelector(".xbtn").onclick = () => { t.check.splice(t.check.indexOf(c), 1); save(); redo(); };
      ck.appendChild(r);
    });
    $$(".wf-ckadd").onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); const v = e.target.value.trim(); if (!v) return; t.check.push({ id: uid(), text: v, done: false }); save(); redo(); box.querySelector(".wf-ckadd").focus(); };
    const act = $$(".wf-act");
    const mk = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "act " + cls; b.textContent = label; b.onclick = fn; act.appendChild(b); return b; };
    let addBtn = null;
    if (isNew) {
      addBtn = mk("Добавить", "primary", () => { const v = (t.name || "").trim(); if (!v) return; t.name = v; t.ord = maxOrd(S.work.tasks) + 1; S.work.tasks.push(t); persist(); closeSheet(); });
      addBtn.disabled = !(t.name || "").trim(); setTimeout(() => nm.focus(), 0);
    } else {
      if (t.status !== "done") mk("▶ Таймер", "primary", () => startWorkTimer(t.id));
      mk(t.status === "done" ? "Вернуть в To do" : "Готово ✓", "", () => { wSetStatus(t, t.status === "done" ? "todo" : "done"); renderWork(); });
      mk("Удалить", "danger", () => wDeleteTask(t));
    }
  }
  function wTaskForm2(box, t, save) {
    const redo = () => wTaskForm2(box, t, save), p = wproj(t.project);
    const PR = [[0, "Обычно"], [1, "! Важно"], [2, "🔥 Срочно"]];
    const props = [["date", "ti-calendar", "Дата", !!t.date, t.date ? shortDate(t.date) : ""], ["time", "ti-clock", "Время", !!t.time, t.time], ["est", "ti-hourglass", "Оценка", !!t.est, t.est ? wEst(t.est) : ""], ["pri", "ti-flame", "Срочность", !!t.pri, t.pri ? PR[t.pri][1] : ""], ["proj", "", "Проект", false, p ? p.icon : "📁"]];
    box.innerHTML = `<textarea class="field wf-note" rows="2" maxlength="4000" placeholder="Описание…">${esc(t.note)}</textarea>
      <div class="wck wf-ck"></div><input type="text" class="field wf-ckadd" maxlength="120" placeholder="+ пункт, Enter">
      <div class="wpr">${props.map(([k, ic, l, on, v]) => `<button type="button" class="wpb${on ? " on" : ""}${k === "proj" ? " pj" : ""}" data-k="${k}" title="${l}${v ? ": " + esc(v) : ""}" aria-label="${l}">${ic ? `<i class="wpic">${{ date: "📅", time: "🕒", est: "⏳", pri: "🔥" }[k]}</i>` : esc(v)}</button>`).join("")}
        <span class="wpr-sp"></span>${t.status !== "done" ? `<button type="button" class="wpb play" data-k="play" aria-label="Таймер">▶</button>` : ""}<button type="button" class="wpb" data-k="done" aria-label="${t.status === "done" ? "Вернуть" : "Готово"}" title="${t.status === "done" ? "Вернуть в To do" : "Готово"}">${t.status === "done" ? "↩" : "✓"}</button><button type="button" class="wpb del" data-k="del" aria-label="Удалить" title="Удалить">🗑</button></div>
      <div class="wpop" hidden></div>`;
    const $$ = (q) => box.querySelector(q), pop = $$(".wpop");
    $$(".wf-note").onchange = (e) => { t.note = e.target.value; save(); };
    const ta = $$(".wf-note"), fit = () => { ta.style.height = "auto"; ta.style.height = Math.min(240, ta.scrollHeight + 2) + "px"; }; ta.oninput = fit; setTimeout(fit, 0);
    const ck = $$(".wf-ck");
    t.check.forEach((c) => {
      const r = document.createElement("div"); r.className = "wcr";
      r.innerHTML = `<button type="button" class="wchk sm" aria-pressed="${c.done}" aria-label="Готово">${I.check}</button><input type="text" class="field" maxlength="120" value="${esc(c.text)}"><button type="button" class="pen xbtn" aria-label="Удалить">${XIC}</button>`;
      r.querySelector(".wchk").onclick = () => { c.done = !c.done; save(); redo(); };
      r.querySelector("input").onchange = (e) => { const v = e.target.value.trim(); if (v) c.text = v; else t.check.splice(t.check.indexOf(c), 1); save(); redo(); };
      r.querySelector(".xbtn").onclick = () => { t.check.splice(t.check.indexOf(c), 1); save(); redo(); };
      ck.appendChild(r);
    });
    $$(".wf-ckadd").onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); const v = e.target.value.trim(); if (!v) return; t.check.push({ id: uid(), text: v, done: false }); save(); redo(); box.querySelector(".wf-ckadd").focus(); };
    const set = (fn) => { fn(); save(); redo(); };
    const chips = (opts, cur, fn) => opts.map(([v, l]) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = l; b.setAttribute("aria-pressed", String(v) === String(cur)); b.onclick = () => set(() => fn(v)); return b; });
    const open = (k, btn) => {
      if (pop.dataset.k === k && !pop.hidden) { pop.hidden = true; pop.dataset.k = ""; return; }
      pop.innerHTML = ""; pop.dataset.k = k; pop.hidden = false; box.querySelectorAll(".wpb").forEach((x) => x.classList.toggle("act-on", x === btn));
      const today = dayISO();
      if (k === "date") { pop.append(...chips([[today, "Сегодня"], [addDays(today, 1), "Завтра"], [addDays(today, 7), "Через неделю"], ["", "Без даты"]], t.date, (v) => { t.date = v; })); const i = document.createElement("input"); i.type = "date"; i.className = "field"; i.value = t.date; i.onchange = () => set(() => { t.date = i.value; }); pop.appendChild(i); }
      if (k === "time") { pop.append(...chips([["10:00", "10:00"], ["14:00", "14:00"], ["18:00", "18:00"], ["", "Без времени"]], t.time, (v) => { t.time = v; })); const i = document.createElement("input"); i.type = "time"; i.className = "field"; i.value = t.time; i.onchange = () => set(() => { t.time = i.value; }); pop.appendChild(i); }
      if (k === "est") { pop.append(...chips([[0, "—"], [5, "5"], [10, "10"], [20, "20"], [30, "30"], [60, "1 ч"], [120, "2 ч"]], t.est, (v) => { t.est = +v; })); const i = document.createElement("input"); i.type = "number"; i.min = 0; i.max = 960; i.className = "field wnum"; i.placeholder = "мин"; i.value = t.est || ""; i.onchange = () => set(() => { t.est = Math.max(0, Math.min(960, Math.round(+i.value || 0))); }); pop.appendChild(i); }
      if (k === "pri") pop.append(...chips(PR, t.pri || 0, (v) => { if (+v) t.pri = +v; else delete t.pri; }));
      if (k === "proj") pop.append(...chips(S.work.projects.filter((x) => !x.archived || x.id === t.project).map((x) => [x.id, x.icon + " " + x.name]), t.project, (v) => { const np = wproj(v); t.project = np.id; t.stage = np.stages[0].id; renderWork(); }));
    };
    box.querySelectorAll(".wpb").forEach((b) => b.onclick = (e) => { e.stopPropagation(); const k = b.dataset.k;
      if (k === "play") return startWorkTimer(t.id);
      if (k === "done") { wSetStatus(t, t.status === "done" ? "todo" : "done"); renderWork(); return; }
      if (k === "del") return wDeleteTask(t);
      open(k, b); });
  }
  function wProjectSheet(box) {
    const isNew = !!wSpec.isNew, p = isNew ? wSpec.draft : wproj(wSpec.id); if (!p) { closeSheet(); return; }
    const save = () => { if (!isNew) persist(); };
    box.innerHTML = `<div class="sheet-h"><b>${isNew ? "Новый проект" : "Проект"}</b>${wX}</div>
      <div class="wrow"><input type="text" class="field wicon" id="wpIcon" maxlength="8" value="${esc(p.icon)}" aria-label="Иконка"><input type="text" class="field" id="wpName" maxlength="60" placeholder="Название" value="${esc(p.name)}"></div>
      <div class="add-row">${W_EMO.map((e) => `<button type="button" class="chip emo" data-e="${e}">${e}</button>`).join("")}</div>
      <div class="add-row"><span class="f">Цвет</span>${COLORS.map((c) => `<button type="button" class="chip sw" style="background:var(--pc-${c});" data-c="${c}" aria-pressed="${p.color === c}" aria-label="${c}"></button>`).join("")}</div>
      <div class="wrow"><label class="f">Дедлайн <input type="date" class="field" id="wpDate" value="${esc(p.date)}"></label>
        <label class="f">Деньги <input type="text" class="field" id="wpMoney" maxlength="40" placeholder="50 000 ₽" value="${esc(p.money)}"></label></div>
      <div class="add-row"><button type="button" class="chip" id="wpPaid" aria-pressed="${p.paid}">Оплачено</button></div>
      <input type="text" class="field" id="wpContact" maxlength="80" placeholder="Контакт: @telegram, телефон или ссылка" value="${esc(p.contact)}">
      <textarea class="field" id="wpNote" rows="3" maxlength="2000" placeholder="Заметка о проекте">${esc(p.note)}</textarea>
      <div class="add-row" id="wpAct"></div>`;
    wBindX(box); const $$ = (s) => box.querySelector(s);
    const bind = (id, key, fn) => { $$(id).onchange = (e) => { p[key] = fn ? fn(e.target.value) : e.target.value; save(); }; };
    const nm = $$("#wpName"); nm.oninput = () => { p.name = nm.value; if (addBtn) addBtn.disabled = !p.name.trim(); };
    nm.onchange = () => { if (!isNew && !nm.value.trim()) nm.value = p.name; else { p.name = nm.value.trim(); save(); } };
    bind("#wpIcon", "icon", (v) => v.trim() || "📁"); bind("#wpDate", "date"); bind("#wpMoney", "money", (v) => v.trim()); bind("#wpContact", "contact", (v) => v.trim()); bind("#wpNote", "note");
    box.querySelectorAll("[data-e]").forEach((b) => b.onclick = () => { p.icon = b.dataset.e; $$("#wpIcon").value = p.icon; save(); });
    box.querySelectorAll("[data-c]").forEach((b) => b.onclick = () => { p.color = b.dataset.c; save(); wProjectSheet(box); });
    $$("#wpPaid").onclick = () => { p.paid = !p.paid; save(); wProjectSheet(box); };
    const act = $$("#wpAct");
    const mk = (label, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "act " + cls; b.textContent = label; b.onclick = fn; act.appendChild(b); return b; };
    let addBtn = null;
    if (isNew) {
      addBtn = mk("Создать", "primary", () => { if (!p.name.trim()) return; p.name = p.name.trim(); S.work.projects.push(p); wOpen.add(p.id); saveW(); persist(); wSeg = "projects"; closeSheet(); });
      addBtn.disabled = !p.name.trim(); setTimeout(() => nm.focus(), 0);
    } else {
      mk(p.archived ? "Вернуть из архива" : "В архив", "", () => { p.archived = !p.archived; persist(); closeSheet(); });
      let armed = false;
      const del = mk("Удалить", "danger", () => {
        if (!armed) { armed = true; del.textContent = "Точно? Удалится с задачами"; return; }
        const pi = S.work.projects.indexOf(p), gone = S.work.tasks.filter((t) => t.project === p.id); if (T && gone.some((t) => t.id === T.id)) closeTimer(true);
        S.work.projects.splice(pi, 1); S.work.tasks = S.work.tasks.filter((t) => t.project !== p.id); if (wFilter === p.id) wFilter = "all"; persist(); closeSheet();
        toast("Проект удалён", "Отменить", () => { S.work.projects.splice(Math.min(pi, S.work.projects.length), 0, p); S.work.tasks.push(...gone); persist(); renderWork(); });
      });
    }
  }
  function wStageSheet(box) {
    const p = wproj(wSpec.pid), s = p && p.stages.find((x) => x.id === wSpec.sid); if (!s) { closeSheet(); return; }
    box.innerHTML = `<div class="sheet-h"><b>Этап</b>${wX}</div><input type="text" class="field" id="wsName" maxlength="60" value="${esc(s.name)}"><div class="add-row" id="wsAct"></div>`;
    wBindX(box); const nm = box.querySelector("#wsName"); nm.onchange = () => { const v = nm.value.trim(); if (v) { s.name = v; persist(); } else nm.value = s.name; };
    const act = box.querySelector("#wsAct");
    const b = document.createElement("button"); b.type = "button"; b.className = "act danger"; b.textContent = p.stages.length > 1 ? "Удалить этап (задачи уйдут в первый)" : "Единственный этап не удалить"; b.disabled = p.stages.length < 2;
    b.onclick = () => { const rest = p.stages.filter((x) => x.id !== s.id); S.work.tasks.forEach((t) => { if (t.stage === s.id) t.stage = rest[0].id; }); p.stages = rest; persist(); closeSheet(); };
    act.appendChild(b);
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && wSpec) closeSheet(); });
  window.addEventListener("keydown", (e) => {
    if (view !== "work" || wSpec) return;
    if (wTyping(e.target)) return;
    const mod = e.metaKey || e.ctrlKey, k = e.code === "KeyA" ? "a" : e.code === "KeyD" ? "d" : e.key.toLowerCase();
    if (e.key === "Escape") { const m = $("wmenu"); if (m) m.remove(); if (wSel.size || wSelMode) { wSel.clear(); wSelMode = false; wSelUI(); renderWork(); } }
    else if ((e.key === "Delete" || e.key === "Backspace") && wSel.size) { e.preventDefault(); wBulkDelete(); }
    else if (mod && k === "a") { e.preventDefault(); wSel = new Set([...document.querySelectorAll("#vWork .wcol .wcard")].map((c) => c.dataset.id)); wSelUI(); }
    else if (mod && k === "d" && wSel.size) { e.preventDefault(); wBulkDup(); }
  });
  document.addEventListener("click", (e) => {
    if (view !== "work" || wSpec || !wExp.size || suppressClick) return;
    const keep = e.target.closest ? e.target.closest("#vWork .wcard.open, #vWork .wtask.open") : null;
    document.querySelectorAll("#vWork .wcard.open, #vWork .wtask.open").forEach((el) => {
      if (el === keep) return; const t = wtask(el.dataset.id); wExp.delete(el.dataset.id);
      if (t) el.replaceWith(wItemEl(t, el.classList.contains("wcard") ? (el.classList.contains("wsub") ? "wcard wsub" : "wcard") : "wtask", el.classList.contains("stock")));
    });
  }, true);
  // a field counts as "typing" only if its text was changed since focus (otherwise app-level undo wins)
  document.addEventListener("focusin", (e) => { const el = e.target; if (el && el.dataset && /^(INPUT|TEXTAREA)$/.test(el.tagName)) el.dataset.v0 = el.value; });
  function wTyping(el) {
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "select") return false;
    if (tag === "input" || tag === "textarea") return /^(text|search|number|tel|url|email|password|)$/.test(el.type || "") && el.value !== el.dataset.v0;
    return !!el.isContentEditable;
  }
  function wApply(snap) {
    S.work = JSON.parse(snap); wSkip = true; persist(); wSkip = false; wRef = S.work;
    if (T && T.work && !wtask(T.id)) closeTimer(true);
    [...wExp].forEach((id) => { if (!wtask(id)) wExp.delete(id); }); renderWork();
  }
  function wUndo() {
    if (!wUndoS.length) { toast("Нечего отменять"); return; }
    wRedoS.push(JSON.stringify(S.work)); wApply(wUndoS.pop()); toast("Отменено · ⇧⌘Z вернуть");
  }
  function wRedo() {
    if (!wRedoS.length) { toast("Нечего возвращать"); return; }
    wUndoS.push(JSON.stringify(S.work)); wApply(wRedoS.pop()); toast("Возвращено");
  }
  window.addEventListener("keydown", (e) => {
    if (view !== "work" || wSpec || !(e.metaKey || e.ctrlKey)) return;
    const k = e.code === "KeyZ" ? "z" : e.code === "KeyY" ? "y" : ""; if (!k) return;
    if (wTyping(e.target)) return;
    e.preventDefault(); (k === "y" || e.shiftKey) ? wRedo() : wUndo();
  });

  // ---------- timer for work tasks (starts as a compact bar so the board stays visible) ----------
  function startWorkTimer(id) {
    const t = wtask(id); if (!t) return;
    unlockSound(); bankTimer();
    if (t.status !== "doing" && t.status !== "done") { wSetStatus(t, "doing"); }
    const min = t.est ? Math.max(5, Math.ceil(t.est - (t.acc || 0) / 60000)) : 25;
    T = { id, work: true, total: min * 60000, endsAt: Date.now() + min * 60000, remaining: null, finished: false, finishedAt: null, elapsedBefore: 0, mini: true };
    lsSet(LS_TIMER, T); openTimer(); if (view === "work") renderWork();
  }

// ===== Focus mode on the home tab =====
let fMode = (() => { try { return localStorage.getItem("lifeos.focus.v1") !== "plan"; } catch { return true; } })();
const fSkip = new Set();
function fSetMode(m) { fMode = m; try { localStorage.setItem("lifeos.focus.v1", m ? "focus" : "plan"); } catch {} render(); }
function focusSeg() {
  const s = document.createElement("div"); s.className = "seg fseg"; s.setAttribute("role", "group"); s.setAttribute("aria-label", "Режим");
  s.innerHTML = `<button data-f="1" aria-pressed="${fMode}">Фокус</button><button data-f="0" aria-pressed="${!fMode}">План</button>`;
  s.querySelectorAll("button").forEach((b) => b.onclick = () => { const m = b.dataset.f === "1"; if (m !== fMode) fSetMode(m); });
  return s;
}
function fQueue() {
  const today = dayISO(), q = [];
  const own = S.tasks.filter((t) => t.where === "today" && !t.done && kmatch(t));
  own.filter((t) => t.at).sort((a, b) => toMin(a.at) - toMin(b.at)).forEach((t) => q.push({ t }));
  own.filter((t) => !t.at).forEach((t) => q.push({ t }));
  const live = q.filter((x) => !fSkip.has(x.t.id)), skipped = q.filter((x) => fSkip.has(x.t.id));
  return live.concat(skipped);
}
function fStart(x) {
  if (x.work) { startWorkTimer(x.t.id); return; }
  if (!x.t.min) { x.t.min = 25; persist(); }
  startTimer(x.t.id);
}
function fDone(x) {
  if (x.work) wSetStatus(x.t, "done"); else { x.t.done = true; x.t.spent = 0; x.t.doneAt = Date.now(); }
  fSkip.delete(x.t.id); persist(); render();
}
function renderFocus(el) {
  const wrap = document.createElement("div"); wrap.className = "col fwrap";
  wrap.appendChild(tdTriSeg("focus"));
  const q = fQueue(), today = dayISO();
  const doneN = S.tasks.filter((t) => t.where === "today" && t.done).length;
  const info = (x) => { const t = x.t, est = x.work ? wEst(t) : t.min; return `${x.work ? (wproj(t.project) ? `<span class="pchip">${esc(wproj(t.project).icon + " " + wproj(t.project).name)}</span>` : "") : pchip(t.project)}${t.at || t.time ? `<span class="sess">${esc(t.at || t.time)}</span>` : ""}${est ? `<span class="sess">${est} мин</span>` : ""}`; };
  if (!q.length) {
    const e = document.createElement("div"); e.className = "card fempty";
    e.innerHTML = `<h2 class="card-t">${doneN ? "На сегодня всё 🎉" : "Нет задач на сегодня"}</h2><p class="sum">${doneN ? "Сделано: " + doneN : "Добавь задачи в «Плане» или возьми из «Дел»."}</p><button class="act primary" id="fPlan">Открыть план</button>`;
    e.querySelector("#fPlan").onclick = () => fSetMode(false); wrap.appendChild(e);
  } else {
    const x = q[0], h = document.createElement("div"); h.className = "card fhero";
    h.innerHTML = `<span class="small-label">${x.work && x.t.status === "doing" ? "Сейчас в работе" : "Следующий шаг"}</span><h2 class="fname">${esc(x.t.name)}</h2><div class="meta">${info(x)}</div><div class="fact"><button class="act primary big" id="fGo">▶ Начать${x.work ? wEst(x.t) ? "" : "" : ""}</button><button class="act" id="fOk">✓ Готово</button>${q.length > 1 ? `<button class="act" id="fSkip">Пропустить</button>` : ""}</div>`;
    h.querySelector("#fGo").onclick = () => fStart(x); h.querySelector("#fOk").onclick = () => fDone(x);
    const sk = h.querySelector("#fSkip"); if (sk) sk.onclick = () => { fSkip.add(x.t.id); render(); };
    wrap.appendChild(h);
    const rest = q.slice(1, 3);
    if (rest.length) {
      const c = document.createElement("div"); c.className = "card fnext"; c.innerHTML = `<div class="card-h"><h2 class="card-t">Дальше</h2><span class="sum">ещё ${q.length - 1}</span></div>`;
      rest.forEach((y) => {
        const r = document.createElement("div"); r.className = "frow";
        r.innerHTML = `<button class="fchk" aria-label="Готово"></button><div class="txt"><span class="name">${esc(y.t.name)}</span><span class="meta">${info(y)}</span></div><button class="act fplay" aria-label="Старт">▶</button>`;
        r.querySelector(".fchk").onclick = () => fDone(y); r.querySelector(".fplay").onclick = () => fStart(y);
        r.querySelector(".txt").onclick = () => { fSkip.delete(y.t.id); q.forEach((z) => { if (z !== y) fSkip.add(z.t.id); }); fSkip.delete(y.t.id); render(); };
        c.appendChild(r);
      });
      wrap.appendChild(c);
    }
    const s = document.createElement("div"); s.className = "sum fcount"; s.textContent = `Сделано сегодня: ${doneN} · осталось ${q.length}`; wrap.appendChild(s);
  }
  el.appendChild(wrap);
}

// ===== Map tab (wish map) =====
const MP_W = 3200, MP_ZH = 1600, MP_GAP = 200;
const MP_ZONES = [
  { ttl: "МЕЧТА", lvl: "3", sub: "Роскошь, которую хочется хотеть", hint: "Вилла · дорогие машины · мотоциклы · красивые женщины", c: "#f3c969" },
  { ttl: "БАНГКОК", lvl: "2", sub: "Точка Б · Новый год 2027", hint: "Пентхаус с видом · Харлей на парковке · вечерний город · семья на отдыхе в Турции", c: "#ff7a1a" },
  { ttl: "ДАЛАТ", lvl: "1", sub: "Ближайшее · закрывается в начале роста", hint: "Кроссовый мотоцикл · бытовые ништяки", c: "#d4ff3a" },
];
const MP_B = { w: MP_W, h: MP_ZONES.length * MP_ZH + (MP_ZONES.length - 1) * MP_GAP };
const mpItems = new Map();
let mpRoot = null, mpVp = null, mpWorld = null, mpToastEl = null, mpDelBtn = null, mpView = { x: 0, y: 0, s: 0.2 }, mpSel = null, mpMax = 1, mpDrag = null, mpEditing = null;
let mpLastDown = { t: 0, id: null }, mpPtrs = new Map(), mpPinch = null, mpLastP = null, mpIdb = null, mpCloud = null, mpBuilt = false, mpHasView = false;
const mpPending = new Set(), mpSaveT = {};
const mpUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const mpStrip = (it) => { const { el, ...r } = it; return r; };
function mpToast(t) { if (!mpToastEl) return; mpToastEl.textContent = t; mpToastEl.classList.add("on"); clearTimeout(mpToast._t); mpToast._t = setTimeout(() => mpToastEl.classList.remove("on"), 2200); }

// storage: local IndexedDB cache + cloud (db) when available
function mpIdbOpen() {
  if (mpIdb) return mpIdb;
  mpIdb = new Promise((res, rej) => { try { const r = indexedDB.open("lifeos-map", 1); r.onupgradeneeded = () => r.result.createObjectStore("items", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  mpIdb.catch(() => {});
  return mpIdb;
}
const mpStore = (mode) => mpIdbOpen().then((db) => db.transaction("items", mode).objectStore("items"));
function mpSave(it) {
  const rec = mpStrip(it);
  mpStore("readwrite").then((s) => s.put(rec)).catch(() => {});
  if (mpCloud) { mpPending.add(it.id); Promise.resolve().then(() => mpCloud.col.doc("map-" + it.id).set(rec)).catch(() => mpToast("Не удалось сохранить в облако")).finally(() => setTimeout(() => mpPending.delete(it.id), 1500)); }
}
function mpSaveSoon(it) { clearTimeout(mpSaveT[it.id]); mpSaveT[it.id] = setTimeout(() => mpSave(it), 400); }
function mpDelRec(id) {
  mpStore("readwrite").then((s) => s.delete(id)).catch(() => {});
  if (mpCloud) Promise.resolve().then(() => mpCloud.col.doc("map-" + id).delete()).catch(() => {});
}

// view
function mpApply() { mpWorld.style.transform = `translate(${mpView.x}px,${mpView.y}px) scale(${mpView.s})`; mpVp.style.setProperty("--s", mpView.s); }
const mpXY = (e) => { const r = mpVp.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
const mpToWorld = (x, y) => ({ x: (x - mpView.x) / mpView.s, y: (y - mpView.y) / mpView.s });
function mpFit() {
  const W = mpVp.clientWidth, H = mpVp.clientHeight; if (!W || !H) return;
  const m = 20, top = 58, s = Math.min((W - 2 * m) / MP_B.w, (H - top - m) / MP_B.h);
  mpView = { s, x: (W - MP_B.w * s) / 2, y: top + (H - top - m - MP_B.h * s) / 2 }; mpApply(); mpSaveView();
}
function mpZoomAt(x, y, k) { const ns = Math.min(4, Math.max(0.03, mpView.s * k)), w = mpToWorld(x, y); mpView.s = ns; mpView.x = x - w.x * ns; mpView.y = y - w.y * ns; mpApply(); mpSaveViewSoon(); }
function mpSaveView() { try { localStorage.setItem("lifeos.map.view.v1", JSON.stringify(mpView)); } catch {} }
let mpSvT; function mpSaveViewSoon() { clearTimeout(mpSvT); mpSvT = setTimeout(mpSaveView, 300); }

// items
function mpMount(it) {
  const el = document.createElement("div"); el.className = "item" + (it.type === "text" ? " text" : ""); el.dataset.id = it.id;
  if (it.type === "img") { const img = document.createElement("img"); img.draggable = false; img.src = it.src || it.url || ""; el.appendChild(img); }
  else { const t = document.createElement("div"); t.className = "t"; t.textContent = it.text || ""; el.appendChild(t); }
  const h = document.createElement("div"); h.className = "handle"; el.appendChild(h);
  it.el = el; mpWorld.appendChild(el); mpItems.set(it.id, it); mpMax = Math.max(mpMax, it.z || 1); mpPlace(it);
}
function mpPlace(it) {
  const s = it.el.style; s.left = it.x + "px"; s.top = it.y + "px"; s.zIndex = 10 + (it.z || 1);
  if (it.type === "img") { s.width = it.w + "px"; s.height = it.h + "px"; }
  else { const t = it.el.querySelector(".t"); t.style.fontSize = it.fs + "px"; t.style.color = it.color || "#f2f2f2"; }
}
function mpSelect(it) { if (mpSel && mpSel.el) mpSel.el.classList.remove("sel"); mpSel = it; if (it) it.el.classList.add("sel"); if (mpDelBtn) mpDelBtn.hidden = !it; }
function mpFront(it) { if ((it.z || 0) < mpMax) { it.z = ++mpMax; mpPlace(it); } }
function mpRemove(it) { clearTimeout(mpSaveT[it.id]); it.el.remove(); mpItems.delete(it.id); mpDelRec(it.id); if (mpSel === it) mpSelect(null); }
function mpPrep(blob) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(u);
      const nw = img.naturalWidth, nh = img.naturalHeight, alpha = /png|webp|gif|svg|avif/.test(blob.type), c = document.createElement("canvas"), g = c.getContext("2d");
      let max = 1400, d = "", w = nw, h = nh;
      for (let i = 0; i < 6; i++) {
        const k = Math.min(1, max / Math.max(nw, nh)); w = Math.max(1, Math.round(nw * k)); h = Math.max(1, Math.round(nh * k));
        c.width = w; c.height = h; g.clearRect(0, 0, w, h);
        if (!alpha) { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }
        g.drawImage(img, 0, 0, w, h);
        d = alpha ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", i < 2 ? 0.86 : 0.7);
        if (d.length <= 850000) break; max = Math.round(max * 0.75);
      }
      res({ src: d, w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(); };
    img.src = u;
  });
}
async function mpAddBlob(blob, p) {
  try {
    const r = await mpPrep(blob), w = Math.min(800, Math.max(300, 380 / mpView.s)), h = w * r.h / r.w;
    const it = { id: mpUid(), type: "img", x: p.x - w / 2, y: p.y - h / 2, w, h, z: ++mpMax, src: r.src };
    mpMount(it); mpSelect(it); mpSave(it);
  } catch { mpToast("Не получилось загрузить картинку"); }
}
async function mpFromUrl(url, p) {
  try { const r = await fetch(url); const b = await r.blob(); if (!b.type.startsWith("image/")) throw 0; await mpAddBlob(b, p); }
  catch { mpToast("Не вышло — сохрани картинку и добавь через «+ Фото»"); }
}
function mpAddText(p, text, edit = true) {
  const it = { id: mpUid(), type: "text", x: p.x, y: p.y, fs: Math.min(160, Math.max(60, 48 / mpView.s)), text: text || "Новая цель", z: ++mpMax };
  mpMount(it); mpSelect(it); mpSave(it); if (edit) mpStartEdit(it);
}
function mpStartEdit(it) {
  const t = it.el.querySelector(".t"); mpEditing = it; t.contentEditable = "true"; t.focus();
  const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  t.onblur = () => { t.contentEditable = "false"; mpEditing = null; it.text = t.innerText.replace(/\n$/, ""); if (!it.text.trim()) mpRemove(it); else mpSave(it); };
  t.onkeydown = (e) => { if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); t.blur(); } };
}

// file backup (compatible with the standalone wish map JSON)
const mpB2D = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
async function mpExport() {
  const out = [...mpItems.values()].map((it) => { const r = mpStrip(it); if (r.src && r.src.startsWith("data:")) { r.data = r.src; delete r.src; } return r; });
  const text = JSON.stringify({ app: "wishmap", v: 2, items: out }), name = "Карта желаний " + new Date().toISOString().slice(0, 10) + ".json";
  try {
    const dl = await window.claude?.use("downloads");
    if (dl) { await dl.save({ filename: name, data: text }); mpToast("Сохранено: " + out.length); return; }
  } catch (e) { if (e && e.code === "declined") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); mpToast("Сохранено: " + out.length);
}
async function mpImport(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== "wishmap" || !Array.isArray(d.items)) throw 0;
    if (mpItems.size && !confirm("Заменить текущую карту (" + mpItems.size + ") данными из файла (" + d.items.length + ")?")) return;
    for (const it of [...mpItems.values()]) mpRemove(it);
    for (const rec of d.items) {
      if (rec.data) { rec.src = rec.data; delete rec.data; }
      else if (rec.blob) { rec.src = await mpB2D(rec.blob); }
      delete rec.blob; delete rec.objUrl; if (!rec.id) rec.id = mpUid();
      mpMount(rec); mpSave(rec);
    }
    mpToast("Загружено: " + d.items.length);
  } catch { mpToast("Файл не подходит"); }
}

// cloud
async function mpCloudInit() {
  try {
    const [db, user] = await Promise.all([window.claude?.use("db"), window.claude?.use("user")]); if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    const col = db.collection("data/users/" + id); mpCloud = { col }; let first = true;
    col.onSnapshot((snap) => {
      const docs = (snap.docs || []).filter((d) => d.id && d.id.startsWith("map-")); let any = false;
      docs.forEach((d) => {
        any = true; const r = d.data(); if (!r || !r.id) return;
        if (mpPending.has(r.id) || (mpDrag && mpDrag.it && mpDrag.it.id === r.id) || (mpEditing && mpEditing.id === r.id)) return;
        const cur = mpItems.get(r.id);
        if (!cur) { mpMount({ ...r }); mpSaveLocal(r); return; }
        if (JSON.stringify(mpStrip(cur)) === JSON.stringify(r)) return;
        const keep = cur.el; Object.keys(cur).forEach((k) => { if (k !== "el") delete cur[k]; }); Object.assign(cur, r); cur.el = keep;
        if (cur.type === "text") cur.el.querySelector(".t").textContent = cur.text || ""; else { const im = cur.el.querySelector("img"); if (im && im.getAttribute("src") !== cur.src) im.src = cur.src || ""; }
        mpPlace(cur); mpMax = Math.max(mpMax, cur.z || 1); mpSaveLocal(r);
      });
      const ch = typeof snap.docChanges === "function" ? snap.docChanges() : [];
      ch.forEach((c) => { if (c.type === "removed" && c.doc && c.doc.id.startsWith("map-")) { const it = mpItems.get(c.doc.id.slice(4)); if (it && !mpPending.has(it.id)) { it.el.remove(); mpItems.delete(it.id); if (mpSel === it) mpSelect(null); mpStore("readwrite").then((s) => s.delete(it.id)).catch(() => {}); } } });
      if (first && !(snap.metadata && snap.metadata.fromCache)) { first = false; if (!any && mpItems.size) [...mpItems.values()].forEach(mpSave); }
    }, () => {});
  } catch {}
}
function mpSaveLocal(rec) { mpStore("readwrite").then((s) => s.put(rec)).catch(() => {}); }

function mpBuild() {
  mpBuilt = true;
  const root = mpRoot = document.createElement("div"); root.className = "mp";
  root.innerHTML = `<div class="mpvp"><div class="mpworld"></div></div>
    <div class="mpbar"><button data-a="fit">Вписать</button><button data-a="text">+ Текст</button><button data-a="photo">+ Фото</button><button data-a="del" hidden class="d">Удалить</button><button data-a="save" title="Копия карты в файл">В файл</button><button data-a="load">Из файла</button></div>
    <div class="mphelp">Тяни фон — двигать · колёсико / щипок — зум · вставь картинку (⌘V) или перетащи · двойной тап по фону — текст</div>
    <div class="mptoast"></div><input type="file" accept="image/*" multiple hidden data-f="img"><input type="file" accept=".json,application/json" hidden data-f="json">`;
  mpVp = root.querySelector(".mpvp"); mpWorld = root.querySelector(".mpworld"); mpToastEl = root.querySelector(".mptoast"); mpDelBtn = root.querySelector('[data-a="del"]');
  MP_ZONES.forEach((z, i) => {
    const y = i * (MP_ZH + MP_GAP), d = document.createElement("div"); d.className = "zone"; d.style.cssText = `--c:${z.c};left:0;top:${y}px;width:${MP_W}px;height:${MP_ZH}px`;
    d.innerHTML = `<div class="lbl"><div class="ttl">${z.ttl}</div><div class="sub">${z.sub}</div><div class="hint">${z.hint}</div></div><div class="lvl">0${z.lvl}</div>`; mpWorld.appendChild(d);
    if (i < MP_ZONES.length - 1) { const a = document.createElement("div"); a.className = "arrow"; a.textContent = "↑"; a.style.left = MP_W / 2 + "px"; a.style.top = y + MP_ZH + 10 + "px"; mpWorld.appendChild(a); }
  });
  try { const v = JSON.parse(localStorage.getItem("lifeos.map.view.v1") || "null"); if (v && v.s) { mpView = v; mpHasView = true; } } catch {}
  const ctr = () => ({ x: mpVp.clientWidth / 2, y: mpVp.clientHeight / 2 });
  root.querySelector(".mpbar").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return; const a = b.dataset.a;
    if (a === "fit") mpFit();
    else if (a === "text") { const c = ctr(); setTimeout(() => mpAddText(mpToWorld(c.x, c.y))); }
    else if (a === "photo") root.querySelector('[data-f="img"]').click();
    else if (a === "del") { if (mpSel) mpRemove(mpSel); }
    else if (a === "save") mpExport();
    else if (a === "load") root.querySelector('[data-f="json"]').click();
  });
  root.querySelector('[data-f="img"]').onchange = (e) => { const c = ctr(), p = mpToWorld(c.x, c.y); [...e.target.files].forEach((f, i) => mpAddBlob(f, { x: p.x + i * 60, y: p.y + i * 60 })); e.target.value = ""; };
  root.querySelector('[data-f="json"]').onchange = (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) mpImport(f); };
  // pointer
  mpVp.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 1 && e.pointerType === "mouse") return;
    const q = mpXY(e); mpPtrs.set(e.pointerId, q); mpVp.setPointerCapture(e.pointerId);
    if (mpPtrs.size === 2) { const [a, b] = [...mpPtrs.values()]; mpPinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: mpView.s, w: mpToWorld((a.x + b.x) / 2, (a.y + b.y) / 2) }; if (mpDrag && mpDrag.m === "move") mpSave(mpDrag.it); mpDrag = null; return; }
    if (mpPtrs.size > 2) return;
    const itEl = e.target.closest(".item"), now = performance.now();
    if (mpEditing && itEl && itEl.dataset.id === mpEditing.id) return;
    if (mpEditing) mpEditing.el.querySelector(".t").blur();
    if (e.target.classList.contains("handle")) { const it = mpItems.get(itEl.dataset.id); mpSelect(it); mpDrag = { m: "resize", sx: q.x, sy: q.y, it, ow: it.w, oh: it.h, ofs: it.fs }; }
    else if (itEl) {
      const it = mpItems.get(itEl.dataset.id);
      if (it.type === "text" && mpLastDown.id === it.id && now - mpLastDown.t < 380) { e.preventDefault(); mpLastDown = { t: 0, id: null }; mpPtrs.clear(); setTimeout(() => mpStartEdit(it)); return; }
      mpLastDown = { t: now, id: it.id }; mpSelect(it); mpFront(it); mpDrag = { m: "move", sx: q.x, sy: q.y, it, ox: it.x, oy: it.y };
    } else {
      if (mpLastDown.id === "bg" && now - mpLastDown.t < 380) { e.preventDefault(); mpLastDown = { t: 0, id: null }; mpPtrs.clear(); const p = mpToWorld(q.x, q.y); setTimeout(() => mpAddText(p)); return; }
      mpLastDown = { t: now, id: "bg" }; mpSelect(null); mpDrag = { m: "pan", sx: q.x, sy: q.y, ox: mpView.x, oy: mpView.y }; mpVp.classList.add("panning");
    }
  });
  mpVp.addEventListener("pointermove", (e) => {
    const q = mpXY(e); mpLastP = mpToWorld(q.x, q.y); if (!mpPtrs.has(e.pointerId)) return; mpPtrs.set(e.pointerId, q);
    if (mpPinch && mpPtrs.size >= 2) {
      const [a, b] = [...mpPtrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ns = Math.min(4, Math.max(0.03, mpPinch.s0 * d / mpPinch.d0)), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      mpView.s = ns; mpView.x = mx - mpPinch.w.x * ns; mpView.y = my - mpPinch.w.y * ns; mpApply(); return;
    }
    if (!mpDrag) return; const dx = q.x - mpDrag.sx, dy = q.y - mpDrag.sy, it = mpDrag.it;
    if (mpDrag.m === "pan") { mpView.x = mpDrag.ox + dx; mpView.y = mpDrag.oy + dy; mpApply(); }
    else if (mpDrag.m === "move") { it.x = mpDrag.ox + dx / mpView.s; it.y = mpDrag.oy + dy / mpView.s; mpPlace(it); }
    else if (it.type === "img") { const k = Math.max(0.05, (mpDrag.ow + dx / mpView.s) / mpDrag.ow); it.w = mpDrag.ow * k; it.h = mpDrag.oh * k; mpPlace(it); }
    else { const base = it.el.offsetWidth * mpDrag.ofs / it.fs, k = Math.max(0.1, (base + dx / mpView.s) / base); it.fs = mpDrag.ofs * k; mpPlace(it); }
  });
  const end = (e) => {
    mpPtrs.delete(e.pointerId); if (mpPtrs.size < 2) mpPinch = null;
    if (!mpDrag) return; if (mpDrag.m === "pan") { mpVp.classList.remove("panning"); mpSaveView(); } else mpSave(mpDrag.it); mpDrag = null;
  };
  mpVp.addEventListener("pointerup", end); mpVp.addEventListener("pointercancel", end);
  mpVp.addEventListener("wheel", (e) => {
    e.preventDefault(); const q = mpXY(e);
    if (!e.ctrlKey && e.deltaMode === 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) { mpView.x -= e.deltaX; mpView.y -= e.deltaY; mpApply(); mpSaveViewSoon(); return; }
    mpZoomAt(q.x, q.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  }, { passive: false });
  // drop
  mpVp.addEventListener("dragover", (e) => { e.preventDefault(); root.classList.add("dropover"); });
  mpVp.addEventListener("dragleave", () => root.classList.remove("dropover"));
  mpVp.addEventListener("drop", (e) => {
    e.preventDefault(); root.classList.remove("dropover"); const q = mpXY(e), p = mpToWorld(q.x, q.y), dt = e.dataTransfer;
    const files = [...dt.files].filter((f) => f.type.startsWith("image/"));
    if (files.length) { files.forEach((f, i) => mpAddBlob(f, { x: p.x + i * 60, y: p.y + i * 60 })); return; }
    let url = ""; const html = dt.getData("text/html");
    if (html) { const m = html.match(/<img[^>]+src=["']([^"']+)["']/i); if (m) url = m[1].replace(/&amp;/g, "&"); }
    if (!url) url = (dt.getData("text/uri-list") || dt.getData("text/plain") || "").split("\n")[0].trim();
    if (/^(https?:|data:image\/)/.test(url)) mpFromUrl(url, p); else mpToast("Не вышло — вставь картинку через ⌘V");
  });
  // paste + keys (only on this tab, not while typing in fields)
  const typing = (e) => { const t = e.target; return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)); };
  document.addEventListener("paste", (e) => {
    if (view !== "map" || mpEditing || typing(e)) return;
    const p = mpLastP || (() => { const c = ctr(); return mpToWorld(c.x, c.y); })(), f = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (f) { e.preventDefault(); mpAddBlob(f.getAsFile(), p); return; }
    const t = (e.clipboardData.getData("text/plain") || "").trim();
    if (/^https?:\/\/\S+$/.test(t)) { e.preventDefault(); mpFromUrl(t, p); } else if (t) { e.preventDefault(); mpAddText(p, t, false); }
  });
  document.addEventListener("keydown", (e) => {
    if (view !== "map" || mpEditing || typing(e) || e.metaKey || e.ctrlKey) return;
    const c = ctr();
    if ((e.key === "Delete" || e.key === "Backspace") && mpSel) { e.preventDefault(); mpRemove(mpSel); }
    else if (e.key === "Escape") mpSelect(null);
    else if (e.key === "0") mpFit();
    else if (e.key === "=" || e.key === "+") mpZoomAt(c.x, c.y, 1.25);
    else if (e.key === "-") mpZoomAt(c.x, c.y, 0.8);
    else if (e.key === "Enter" && mpSel && mpSel.type === "text") { e.preventDefault(); mpStartEdit(mpSel); }
  });
  // load local cache, then cloud
  mpStore("readonly").then((s) => new Promise((r) => { const q = s.getAll(); q.onsuccess = () => r(q.result); q.onerror = () => r([]); })).then((all) => { all.forEach((r) => { if (!mpItems.has(r.id)) mpMount(r); }); }).catch(() => {}).finally(mpCloudInit);
}
function renderMap() {
  if (!mpBuilt) mpBuild();
  const host = $("vMap"); if (mpRoot.parentNode !== host) host.replaceChildren(mpRoot);
  mpApply(); if (!mpHasView) { mpHasView = true; requestAnimationFrame(mpFit); }
}

