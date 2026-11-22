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
  function wProgHTML(t) {
    const g = t.status === "done" ? null : wProg(t); if (!g) return "";
    return `<div class="wprog${g.over ? " over" : ""}"><div class="wpbar"><i style="width:${Math.min(100, g.pct)}%"></i></div><div class="wpl"><span>${g.label}</span><b>${g.pct}%</b></div></div>`;
  }
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
  S.work.tasks.filter((t) => t.status === "doing").sort(byOrd).forEach((t) => q.push({ t, work: true }));
  const own = S.tasks.filter((t) => t.where === "today" && !t.done && kmatch(t));
  own.filter((t) => t.at).sort((a, b) => toMin(a.at) - toMin(b.at)).forEach((t) => q.push({ t }));
  own.filter((t) => !t.at).forEach((t) => q.push({ t }));
  S.work.tasks.filter((t) => t.status === "todo" && t.date === today).sort(byOrd).forEach((t) => q.push({ t, work: true }));
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
  wrap.appendChild(focusSeg());
  const q = fQueue(), today = dayISO();
  const doneN = S.tasks.filter((t) => t.where === "today" && t.done).length + S.work.tasks.filter((t) => t.status === "done" && t.doneAt && dayISO(t.doneAt) === today).length;
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
    const rest = q.slice(1, 5);
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

  // ===== quick add: "Купить тройник 18:10 10м #дом завтра" =====
  function parseQuick(v) {
    const r = { name: v };
    let s = " " + v + " ";
    const tm = s.match(/\s(?:в\s)?([01]?\d|2[0-3])[:.]([0-5]\d)(?=\s)/);
    if (tm) { r.at = String(tm[1]).padStart(2, "0") + ":" + tm[2]; s = s.replace(tm[0], " "); }
    const mn = s.match(/\s(\d{1,3})\s?(м|мин|min|m|ч|h)(?=\s)/i);
    if (mn) { r.min = Math.min(480, +mn[1] * (/^[чh]/i.test(mn[2]) ? 60 : 1)); s = s.replace(mn[0], " "); }
    const pj = s.match(/\s#([^\s#]+)(?=\s)/);
    if (pj) { const q = pj[1].toLowerCase(), p = S.projects.find((x) => x.name.toLowerCase().startsWith(q)) || S.projects.find((x) => x.name.toLowerCase().includes(q)); if (p) { r.project = p.id; s = s.replace(pj[0], " "); } }
    const wd = s.match(/\s(сегодня|завтра)(?=\s)/i);
    if (wd) { r.where = wd[1].toLowerCase() === "завтра" ? "tomorrow" : "today"; s = s.replace(wd[0], " "); }
    const nm = s.replace(/\s+/g, " ").trim(); if (nm) r.name = nm;
    return r;
  }

  // ===== phone: swipe a task row right to complete =====
  (function () {
    let sw = null;
    document.addEventListener("touchstart", (e) => {
      const li = e.target.closest && e.target.closest("#vToday li.task.live, #vTasks li.task.live"); if (!li || e.touches.length > 1) return;
      sw = { li, x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, on: false };
    }, { passive: true });
    document.addEventListener("touchmove", (e) => {
      if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
      if (!sw.on) { if (Math.abs(dy) > 10) { sw = null; return; } if (dx > 12 && dx > Math.abs(dy) * 2) { sw.on = true; sw.li.classList.add("swiping"); } else return; }
      e.preventDefault(); sw.dx = Math.max(0, dx); sw.li.style.transform = `translateX(${Math.min(140, sw.dx)}px)`; sw.li.classList.toggle("swipe-ok", sw.dx > 90);
    }, { passive: false });
    document.addEventListener("touchend", () => {
      if (!sw) return; const s = sw; sw = null; if (!s.on) return;
      s.li.style.transform = ""; s.li.classList.remove("swiping", "swipe-ok");
      if (s.dx > 90) { const c = s.li.querySelector(".check"); if (c) { try { navigator.vibrate && navigator.vibrate(10); } catch {} c.click(); } }
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 350);
    });
  })();

  // ===== desktop: ⌘K command palette + hotkeys =====
  function cmdItems() {
    const go = (id) => () => { view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); };
    const it = [];
    VIEWS.forEach(([id, label]) => it.push({ k: "Раздел", l: label, run: go(id) }));
    it.push({ k: "Действие", l: "Новое дело на сегодня", run: () => { go("today")(); calSel = dayISO(); openSheet({ isNew: true, at: "", name: "", min: 25, project: "" }); } });
    it.push({ k: "Действие", l: "Новая задача в Работе", run: () => { go("work")(); setTimeout(() => wOpenNewTask({}), 30); } });
    it.push({ k: "Действие", l: "Новый проект в Работе", run: () => { go("work")(); setTimeout(() => wOpenSheet({ type: "project", draft: newWProject({ id: "w-" + uid() }), isNew: true }), 30); } });
    if (typeof T !== "undefined" && T) it.push({ k: "Таймер", l: T.endsAt == null ? "Продолжить таймер" : "Пауза таймера", run: () => { T.endsAt == null ? resume() : pause(); } });
    const WH = { today: "Сегодня", tomorrow: "Завтра", backlog: "Дела", wait: "Жду" };
    S.tasks.filter((t) => !t.done && WH[t.where]).forEach((t) => it.push({ k: "Дела · " + WH[t.where], l: t.name, run: () => openSheet({ id: t.id }), alt: t.min ? () => startTimer(t.id) : null }));
    S.work.tasks.filter((t) => t.status !== "done").forEach((t) => { const p = wproj(t.project); it.push({ k: "Работа" + (p ? " · " + p.name : ""), l: t.name, run: () => { go("work")(); wExp.clear(); wExp.add(t.id); renderWork(); setTimeout(() => { const el = document.querySelector(`#vWork .wcard[data-id="${t.id}"]`); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 50); }, alt: () => startWorkTimer(t.id) }); });
    return it;
  }
  function cmdOpen() {
    if ($("cmdk")) return;
    const all = cmdItems(); let sel = 0, list = all;
    const bg = document.createElement("div"); bg.id = "cmdk"; bg.innerHTML = `<div class="ck" role="dialog" aria-label="Команды"><input class="ck-in" placeholder="Куда перейти или что сделать…" aria-label="Поиск команд" autocomplete="off"><div class="ck-l" role="listbox"></div><div class="ck-f"><span><b>↵</b> открыть</span><span><b>⇧↵</b> запустить таймер</span><span><b>esc</b> закрыть</span></div></div>`;
    document.body.appendChild(bg);
    const inp = bg.querySelector(".ck-in"), box = bg.querySelector(".ck-l");
    const draw = () => {
      const q = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      list = all.filter((x) => q.every((w) => (x.l + " " + x.k).toLowerCase().includes(w))).slice(0, 50); sel = Math.min(sel, Math.max(0, list.length - 1));
      box.innerHTML = list.length ? list.map((x, i) => `<div class="ck-i${i === sel ? " on" : ""}" role="option" aria-selected="${i === sel}" data-i="${i}"><span>${esc(x.l)}</span><em>${esc(x.k)}${x.alt ? " · ▶" : ""}</em></div>`).join("") : `<div class="ck-e">Ничего не найдено</div>`;
      const on = box.querySelector(".on"); if (on) on.scrollIntoView({ block: "nearest" });
    };
    const close = () => bg.remove();
    const run = (i, alt) => { const x = list[i]; if (!x) return; close(); (alt && x.alt ? x.alt : x.run)(); };
    inp.oninput = () => { sel = 0; draw(); };
    inp.onkeydown = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      else if (e.key === "Enter") { e.preventDefault(); run(sel, e.shiftKey); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    box.onclick = (e) => { const r = e.target.closest(".ck-i"); if (r) run(+r.dataset.i, e.shiftKey); };
    bg.onpointerdown = (e) => { if (e.target === bg) close(); };
    draw(); inp.focus();
  }
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") { e.preventDefault(); $("cmdk") ? $("cmdk").remove() : cmdOpen(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey || $("cmdk")) return;
    const el = e.target, typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
    if (typing || !$("sheetBg").hidden) return;
    if (/^Digit[1-6]$/.test(e.code)) { const v = VIEWS[+e.code.slice(5) - 1]; if (v) { e.preventDefault(); view = v[0]; lsSet(LS_VIEW, view); saveUI(); render(); } return; }
    if (e.code === "KeyN") { e.preventDefault(); if (view === "work") wOpenNewTask({}); else qaOpen(view === "tasks" ? "backlog" : "today", { where: true, def: view === "tasks" ? "backlog" : "today" }); return; }
    if (e.code === "Space" && typeof T !== "undefined" && T && !T.finished && (el === document.body || !el.closest("button, a"))) { e.preventDefault(); T.endsAt == null ? resume() : pause(); }
  });

  // ===== tab title shows the running timer =====
  (function () {
    const base = document.title;
    setInterval(() => {
      if (typeof T === "undefined" || !T) { if (document.title !== base) document.title = base; return; }
      const ms = remaining(), m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000);
      let nm = ""; if (T.work) { const t = wtask(T.id); nm = t ? t.name : ""; } else { const x = findItem(T.id); nm = x ? x.t.name : ""; }
      document.title = (T.finished ? "✓ " : (T.endsAt == null ? "⏸ " : "")) + (T.finished ? "" : m + ":" + String(s).padStart(2, "0") + " · ") + (nm || base);
    }, 1000);
  })();


  // ===== voice → tasks (dictation + Claude) =====
  const W_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  let wDict = null, wSample = null;
  try { if (window.claude && claude.use) { claude.use("dictation").then((d) => { wDict = d; }).catch(() => {}); claude.use("sample").then((x) => { wSample = x; }).catch(() => {}); } } catch {}
  function wVoiceOpen(listen) {
    if ($("wvoice")) return;
    const bg = document.createElement("div"); bg.id = "wvoice";
    bg.innerHTML = `<div class="wv" role="dialog" aria-label="Надиктовать задачи">
      <div class="wv-h"><b>Надиктуй задачи</b><button class="wv-x" aria-label="Закрыть">×</button></div>
      <p class="wv-hint">Например: «по Карандашу сделать интро, анимировать лого и фон; по Эронике собрать ТЗ и анимировать обложку»</p>
      <div class="wv-row"><button class="wv-mic" aria-pressed="false">${W_MIC}<span>Говорить</span></button><span class="wv-st"></span></div>
      <textarea class="wv-tx field" rows="5" placeholder="Текст появится здесь. Можно и напечатать."></textarea>
      <div class="wv-acts"><button class="act primary wv-go">Разобрать в задачи</button></div>
      <div class="wv-res"></div></div>`;
    document.body.appendChild(bg);
    const tx = bg.querySelector(".wv-tx"), mic = bg.querySelector(".wv-mic"), st = bg.querySelector(".wv-st"), res = bg.querySelector(".wv-res");
    let base = "", listening = false, offs = [];
    const close = () => { if (listening && wDict) wDict.stop().catch(() => {}); offs.forEach((f) => { try { f && f(); } catch {} }); bg.remove(); };
    bg.querySelector(".wv-x").onclick = close; bg.onpointerdown = (e) => { if (e.target === bg) close(); };
    bg.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    if (!wDict) { mic.hidden = true; st.textContent = "Микрофон здесь недоступен — напечатай текст."; }
    else {
      offs.push(wDict.onPartial(({ text }) => { tx.value = (base + " " + text).trim(); }));
      offs.push(wDict.onFinal(({ text }) => { base = (base + " " + text).trim(); tx.value = base; }));
      offs.push(wDict.onState(({ state, reason }) => { listening = state === "listening"; mic.setAttribute("aria-pressed", listening); mic.querySelector("span").textContent = listening ? "Стоп" : "Говорить"; st.textContent = listening ? "Слушаю…" : reason === "not_granted" ? "Нет доступа к микрофону" : ""; }));
      mic.onclick = () => {
        if (listening) { wDict.stop().catch(() => {}); return; }
        base = tx.value.trim();
        wDict.start().catch((e) => { st.textContent = e && e.code === "not_granted" ? "Нет доступа к микрофону — напечатай текст." : "Не получилось включить микрофон."; });
      };
      if (listen) mic.click();
    }
    bg.querySelector(".wv-go").onclick = async () => {
      if (listening && wDict) { try { await wDict.stop(); } catch {} }
      const text = tx.value.trim(); if (!text) { st.textContent = "Сначала скажи или напиши задачи."; return; }
      if (!wSample) { res.innerHTML = `<p class="wv-err">Разбор через Claude здесь недоступен.</p>`; return; }
      res.innerHTML = `<p class="wv-wait">Разбираю…</p>`;
      const projects = S.work.projects.filter((p) => !p.archived).map((p) => ({ id: p.id, name: p.name }));
      const prompt = `Ты разбираешь надиктованный текст на задачи для канбан-доски. Сегодня ${dayISO()}.
Проекты пользователя (id и название): ${JSON.stringify(projects)}.
Правила:
- Каждое отдельное действие = отдельная задача. Название короткое, с глагола или существительного, без слов-паразитов («тааак», «ну», «там»), с заглавной буквы. Пример: «лого анимировать там» → «Анимировать лого».
- project: id подходящего проекта из списка (учитывай склонения и опечатки: «Эроника» = Eronika, «карандаш» = проект с карандашом). Если проект не подходит ни один, но назван — оставь project пустым и впиши название в newProject.
- today: true, если сказано «сегодня» для этой задачи или для всего блока.
- est: минуты, только если явно названы, иначе 0.
- parent: если задача явно часть другой задачи из этого же списка («для интро сделать раскадровку»), впиши название родителя ровно как в его name, иначе пусто.
Верни только JSON: {"tasks":[{"name":"","project":"","newProject":"","today":false,"est":0,"parent":""}]}
Текст: """${text}"""`;
      let out;
      try { out = await wSample.json(prompt, { modelTier: "default" }); }
      catch (e) { res.innerHTML = `<p class="wv-err">${e && e.code === "not_granted" ? "Нет разрешения на Claude." : e && e.code === "rate_limited" ? "Слишком часто, попробуй через минуту." : "Не получилось разобрать."}</p>`; return; }
      const items = (out && Array.isArray(out.tasks) ? out.tasks : []).filter((x) => x && String(x.name || "").trim()).slice(0, 40);
      if (!items.length) { res.innerHTML = `<p class="wv-err">Задач не нашлось. Попробуй сказать конкретнее.</p>`; return; }
      const pname = (x) => { const p = wproj(x.project); return p ? p.icon + " " + p.name : x.newProject ? "＋ " + x.newProject : "Без проекта"; };
      res.innerHTML = `<div class="wv-list">${items.map((x, i) => `<label class="wv-it${x.parent ? " sub" : ""}"><input type="checkbox" checked data-i="${i}"><span class="wv-n">${esc(x.name)}</span><em>${esc(pname(x))}${x.today ? " · сегодня" : ""}${x.est ? " · " + x.est + " мин" : ""}</em></label>`).join("")}</div><div class="wv-acts"><button class="act primary wv-add">Создать ${items.length}</button></div>`;
      const addBtn = res.querySelector(".wv-add");
      res.querySelectorAll("input[type=checkbox]").forEach((c) => c.onchange = () => { addBtn.textContent = "Создать " + res.querySelectorAll("input:checked").length; });
      addBtn.onclick = () => {
        const pick = [...res.querySelectorAll("input:checked")].map((c) => items[+c.dataset.i]); if (!pick.length) return;
        const made = {}, newP = {};
        wBatch(() => {
          pick.forEach((x) => {
            let p = wproj(x.project);
            if (!p) {
              const nm = String(x.newProject || "").trim() || "Входящие", key = nm.toLowerCase();
              p = newP[key] || S.work.projects.find((q) => q.name.toLowerCase() === key);
              if (!p) { p = newWProject({ id: "w-" + uid() }); p.name = nm; S.work.projects.push(p); }
              newP[key] = p;
            }
            const par = x.parent && made[String(x.parent).trim().toLowerCase()];
            const t = newWTask({ name: String(x.name).trim().slice(0, 140), project: p.id, stage: p.stages[0].id, est: Math.max(0, Math.min(480, Math.round(+x.est || 0))), parent: par && !par.parent ? par.id : "", ord: maxOrd(S.work.tasks) + 1 });
            if (x.today && !t.parent) { t.status = "todo"; t.date = dayISO(); }
            S.work.tasks.push(t); made[t.name.toLowerCase()] = t;
          });
        });
        S.work = normWork(S.work); persist(); close(); renderWork();
        toast(`Создано задач: ${pick.length}`, "Отменить", () => wUndo());
      };
    };
    setTimeout(() => tx.focus(), 0);
  }

  // ===== inline timer: the running task expands in place in its list =====
  const TIN_R = 34, TIN_C = 2 * Math.PI * TIN_R;
  function tinAttach(li, t, key) {
    li.classList.add("trun");
    li.insertAdjacentHTML("beforeend", `<div class="tin" data-id="${esc(t.id)}" data-key="${esc(key)}"><svg class="tin-ring" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${TIN_R}" class="tin-bg"/><circle cx="40" cy="40" r="${TIN_R}" class="tin-fg" stroke-dasharray="${TIN_C.toFixed(2)}" stroke-dashoffset="0" transform="rotate(-90 40 40)"/></svg><div class="tin-t"><b class="tin-time">--:--</b><span class="tin-st"></span></div><div class="tin-c"></div></div>`);
    setTimeout(() => { if (T) update(true); }, 0);
  }
  function tinNext(f) {
    if (!f) return null;
    if (isRoutine(f.key)) return routineNext(f);
    const list = itemsOf(f.key).filter((x) => !x.done), i = list.indexOf(f.t);
    return list.slice(i + 1).find((x) => x.min > 0) || list.find((x) => x.min > 0 && x !== f.t) || null;
  }
  function tinSkip(f) {
    if (!f) { closeTimer(); return; }
    const nx = tinNext(f);
    if (isRoutine(f.key)) closeTimer(true);
    else { finish(false); const t = f.t, i = S.tasks.indexOf(t); if (i >= 0) { S.tasks.splice(i, 1); S.tasks.push(t); } if (t.at) t.at = ""; persist(); }
    if (nx && nx !== f.t) startTimer(nx.id); else render();
  }
  function tinAddMenu(btn) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu tin-menu";
    m.innerHTML = [1, 3, 5, 10, 15, 30].map((v) => `<button data-m="${v}">+${v} мин</button>`).join("");
    document.body.appendChild(m); const r = btn.getBoundingClientRect(), mr = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - mr.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - mr.height - 8)) + "px";
    m.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; m.remove(); addTime(+b.dataset.m); };
    setTimeout(() => document.addEventListener("pointerdown", function once(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener("pointerdown", once); } }), 0);
  }
  function tinControls(box, mode, f) {
    const nx = tinNext(f), mk = (label, cls, fn, title) => { const b = document.createElement("button"); b.className = "tb " + cls; b.textContent = label; if (title) b.title = title; b.onclick = (e) => { e.stopPropagation(); fn(); }; return b; };
    const add = mk("+5 мин", "", () => addTime(5), "Правый клик — выбрать сколько"); add.oncontextmenu = (e) => { e.preventDefault(); e.stopPropagation(); tinAddMenu(add); };
    const skip = mk("Пропустить", "", () => tinSkip(f), f && isRoutine(f.key) ? "Пропустить и перейти дальше" : "В конец списка, время сохранится");
    const fin = nx ? mk("Далее ▶", "pri", () => { finish(true); startTimer(nx.id); }, "Готово и сразу: " + nx.name) : mk("Готово ✓", "pri", () => finish(true));
    box.replaceChildren(...(mode === "done" ? [add, skip, fin] : [mode === "paused" ? mk("Продолжить", "", resume) : mk("Пауза", "", pause), add, skip, fin]));
    if (nx) { const n = document.createElement("div"); n.className = "tin-nx"; n.textContent = "Дальше: " + nx.name; box.appendChild(n); }
  }
  function tinUpdate(f, txt, rem, mode) {
    const el = document.querySelector(`.tin[data-id="${T.id}"]`);
    $("timer").hidden = true; $("mini").hidden = !!el; document.body.classList.toggle("has-mini", !el);
    if (!el) { $("miniName").textContent = f ? f.t.name : "Задача"; $("miniTime").textContent = txt; $("miniTime").classList.toggle("paused", mode === "paused"); return true; }
    el.querySelector(".tin-time").textContent = txt;
    el.querySelector(".tin-fg").setAttribute("stroke-dashoffset", (T.finished ? 0 : TIN_C * (1 - rem / T.total)).toFixed(2));
    el.classList.toggle("ringing", mode === "done"); el.classList.toggle("paused", mode === "paused");
    el.querySelector(".tin-st").textContent = mode === "done" ? "время вышло" : mode === "paused" ? "пауза" : "осталось · " + Math.round(T.total / 60000) + " мин";
    if (el.dataset.mode !== mode) { el.dataset.mode = mode; tinControls(el.querySelector(".tin-c"), mode, f); }
    return true;
  }

  // ===== "+" quick add window for Сегодня / Завтра / Дела =====
  let qaLast = { min: 25, project: "" };
  function qaButton(key, opts) {
    const w = document.createElement("div"); w.className = "qa-wrap";
    w.innerHTML = `<button type="button" class="qa-plus" id="qa-${key}" aria-label="Добавить задачу" title="Добавить задачу (N)">+</button>`;
    w.firstChild.onclick = () => qaOpen(key, opts);
    return w;
  }
  function qaOpen(key, opts = {}) {
    if ($("qa")) return;
    const where0 = opts.def || (opts.where ? "backlog" : key), d = { min: qaLast.min, project: filterProject !== "all" ? filterProject : qaLast.project, at: "", due: "", note: "", where: where0 };
    const CH = [[0, "Без таймера"], [5, "5"], [10, "10"], [15, "15"], [25, "25"], [50, "50"]];
    const lnP = opts.link ? S.tasks.find((x) => x.id === opts.link) : null;
    const title = lnP ? (opts.rel === "pre" ? "перед «" : "после «") + lnP.name + "»" : opts.where ? "" : ({ today: "Сегодня", tomorrow: "Завтра", backlog: "Дела" }[key] || "");
    const bg = document.createElement("div"); bg.id = "qa";
    bg.innerHTML = `<form class="qa" role="dialog" aria-label="Новая задача" autocomplete="off">
      <div class="qa-h"><b>Новая задача</b><span>${esc(title)}</span><button type="button" class="qa-x" aria-label="Закрыть">×</button></div>
      <input class="field qa-name" maxlength="120" placeholder="Что сделать?" aria-label="Название">
      <div class="qa-l">Время</div>
      <div class="qa-ch">${CH.map(([m, l]) => `<button type="button" class="chip" data-m="${m}" aria-pressed="${m === d.min}">${l}${m ? " мин" : ""}</button>`).join("")}</div>
      <button type="button" class="qa-more" aria-expanded="false">Дополнительно <i>›</i></button>
      <div class="qa-adv" hidden>
        <label>Проект<select class="field qa-pj">${projectOptions(d.project)}</select></label>
        ${opts.where ? `<label>Куда<select class="field qa-wh">${[["today", "Сегодня"], ["tomorrow", "Завтра"], ["backlog", "В дела"], ["wait", "Жду"]].map(([v, l]) => `<option value="${v}"${v === where0 ? " selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
        <div class="qa-2"><label>Начало<input type="time" class="field qa-at"></label><label>Дата<input type="date" class="field qa-due"></label></div>
        <label>Комментарий<input class="field qa-note" maxlength="160" placeholder="Необязательно"></label>
      </div>
      <div class="qa-f"><span class="qa-hint">Можно писать прямо в названии: «18:10 10м #дом»</span><button type="submit" class="act primary qa-add" disabled>Добавить</button></div>
    </form>`;
    document.body.appendChild(bg);
    const f = bg.querySelector("form"), nm = f.querySelector(".qa-name"), add = f.querySelector(".qa-add"), adv = f.querySelector(".qa-adv"), more = f.querySelector(".qa-more");
    const esc0 = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    const close = () => { bg.remove(); document.removeEventListener("keydown", esc0, true); };
    f.querySelector(".qa-x").onclick = close; bg.onpointerdown = (e) => { if (e.target === bg) close(); };
    document.addEventListener("keydown", esc0, true);
    nm.oninput = () => { add.disabled = !nm.value.trim(); };
    f.querySelectorAll(".qa-ch .chip").forEach((c) => c.onclick = () => { d.min = +c.dataset.m; f.querySelectorAll(".qa-ch .chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); nm.focus(); });
    more.onclick = () => { adv.hidden = !adv.hidden; more.setAttribute("aria-expanded", !adv.hidden); };
    f.onsubmit = (e) => {
      e.preventDefault(); const raw = nm.value.trim(); if (!raw) return;
      const q = parseQuick(raw), pj = f.querySelector(".qa-pj").value, wh = f.querySelector(".qa-wh");
      const where = q.where || (wh ? wh.value : where0), min = q.min ?? d.min;
      const t = { id: uid(), name: q.name, min, done: false, spent: 0, note: f.querySelector(".qa-note").value.trim(), project: q.project ?? pj, where, sessions: 0, acc: 0, waitUntil: where === "wait" ? addDays(dayISO(), 2) : "", doneAt: 0, due: f.querySelector(".qa-due").value || "", at: q.at || f.querySelector(".qa-at").value || "" };
      if (lnP) { t.link = lnP.id; t.rel = opts.rel; t.where = lnP.where; t.project = t.project || lnP.project; lnP.lnOpen = true; const ks = S.tasks.filter((x) => x.link === lnP.id), pres = ks.filter((x) => x.rel === "pre"), posts = ks.filter((x) => x.rel !== "pre"); let at, after;
        const an = opts.anchor && opts.anchor !== lnP.id ? S.tasks.find((x) => x.id === opts.anchor) : null;
        if (an) { at = an; after = opts.side === "post"; }
        else if (opts.rel === "pre") { at = pres.length ? pres[pres.length - 1] : lnP; after = !!pres.length; }
        else { at = posts.length ? posts[0] : lnP; after = !posts.length; }
        S.tasks.splice(S.tasks.indexOf(at) + (after ? 1 : 0), 0, t); }
      else S.tasks.push(t);
      qaLast = { min, project: t.project };
      pullDue(); persist(); close(); render();
    };
    setTimeout(() => nm.focus(), 0);
  }


  // ===== new minimal "Сегодня" =====
  let tdPop = false, tdMorningForce = null;
  const tdMin = (m) => m < 60 ? m + " мин" : Math.floor(m / 60) + " ч" + (m % 60 ? " " + (m % 60) + " мин" : "");
  const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
  function tdGroup(key, today) {
    const items = S.routines[key], dn = items.filter((t) => t.done).length, all = items.length, mins = items.filter((t) => !t.done).reduce((s, t) => s + (t.min || 0), 0);
    const running = T && !T.work && items.some((t) => t.id === T.id);
    const started = key === "morning" || S.day.evening === today;
    const open = running || (key === "morning" ? (tdMorningForce ?? (dn < all && morningOpen)) : started);
    const g = document.createElement("div"); g.className = "td-g" + (open ? " open" : "");
    const name = key === "morning" ? "Утро" : started ? "Вечер" : "Вечерняя рутина";
    const meta = started || key === "morning" ? `${dn} из ${all}${mins ? " · " + tdMin(mins) : ""}` : `${all} пунктов${mins ? " · " + tdMin(mins) : ""}`;
    g.innerHTML = `<button class="td-gh" aria-expanded="${open}"><span class="td-gc${dn === all && all ? " on" : ""}">${dn === all && all ? I.check : ""}</span><span class="td-gn">${name}</span><span class="td-gm">${meta}</span><i>›</i></button>`;
    g.querySelector(".td-gh").onclick = () => {
      if (key === "evening" && !started) { S.day.evening = today; persist(); render(); return; }
      if (key === "morning") { tdMorningForce = !open; morningOpen = !open; saveUI(); } else if (S.day.evening === today && dn === 0) { S.day.evening = null; persist(); }
      render();
    };
    if (open) g.appendChild(renderList(key, key === "morning" ? "Утро пустое" : "Вечер пустой"));
    return g;
  }
  function tdPopEl() {
    const p = document.createElement("div"); p.className = "td-pop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Вид и фильтры");
    p.innerHTML = `<div class="tp-l">Режим</div>`; p.appendChild(focusSeg());
    p.insertAdjacentHTML("beforeend", `<div class="tp-l">Показывать</div>`); p.appendChild(kindBar());
    const acts = document.createElement("div"); acts.className = "tp-acts";
    const n = doneCount(), back = S.tasks.filter((t) => t.where === "backlog").length;
    const mk = (label, fn, id) => { const b = document.createElement("button"); b.className = "tp-a"; if (id) b.id = id; b.textContent = label; b.onclick = fn; acts.appendChild(b); };
    if (n) mk(`Очистить завершённые (${n})`, () => { clearDone(); }, "clearDone");
    if (back) mk(`Взять из дел (${back}) →`, () => { tdPop = false; view = "tasks"; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); });
    mk("Заметки для Claude", () => { tdPop = false; render(); notesOpen(); });
    p.appendChild(acts);
    return p;
  }
  function renderToday2() {
    const el = $("vToday"); el.innerHTML = "";
    const today = dayISO();
    const page = document.createElement("div"); page.className = "tday";
    workTaskSync();
    const items = itemsOf("today").filter(kmatch), dn = items.filter((t) => t.done).length, left = items.filter((t) => !t.done).reduce((s, t) => s + (t.min || 0), 0);
    const head = document.createElement("div"); head.className = "td-h";
    head.innerHTML = `<div><h1 class="td-t">Сегодня</h1><div class="td-s">${items.length ? dn + " из " + items.length : "Пока пусто"}${left ? " · осталось " + tdMin(left) : ""}</div></div>
      <div class="td-ctl">${fMode ? "" : `<div class="seg sm td-seg" role="group" aria-label="Вид"><button data-tm="list" aria-pressed="${todayMode === "list"}">Список</button><button data-tm="cal" aria-pressed="${todayMode === "cal"}">День</button></div>`}<button class="td-gear" aria-label="Вид и фильтры" aria-expanded="${tdPop}">${GEAR}</button></div>`;
    head.querySelectorAll("[data-tm]").forEach((b) => b.onclick = () => { const m = b.dataset.tm; if (m === todayMode) return; if (m === "list") reorderToday(); todayMode = m; saveUI(); render(); });
    head.querySelector(".td-gear").onclick = (e) => { e.stopPropagation(); tdPop = !tdPop; render(); };
    page.appendChild(head);
    if (!fMode) {
      const qf = document.createElement("form"); qf.className = "td-qa"; qf.autocomplete = "off";
      qf.innerHTML = `<input class="field" id="tdQa" maxlength="120" placeholder="Добавить задачу… (Магазин 18:00 40м)" aria-label="Быстро добавить задачу">`;
      qf.onsubmit = (e) => { e.preventDefault(); const inp = qf.querySelector("input"), raw = inp.value.trim(); if (!raw) return; const q = parseQuick(raw);
        S.tasks.push({ id: uid(), name: q.name, min: q.min ?? qaLast.min, done: false, spent: 0, note: "", project: q.project ?? "", where: q.where || "today", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: "", at: q.at || "" });
        pullDue(); persist(); render(); setTimeout(() => { const n = $("tdQa"); if (n) n.focus(); }, 0); };
      page.appendChild(qf);
    }
    if (tdPop) { const p = tdPopEl(); head.appendChild(p); setTimeout(() => document.addEventListener("pointerdown", function cl(ev) { if (!ev.target.closest(".td-pop, .td-gear")) { tdPop = false; document.removeEventListener("pointerdown", cl); const pp = document.querySelector(".td-pop"); if (pp) pp.remove(); const gb = document.querySelector(".td-gear"); if (gb) gb.setAttribute("aria-expanded", "false"); } else if (!document.querySelector(".td-pop")) document.removeEventListener("pointerdown", cl); }), 0); }
    if (fMode) { const fb = document.createElement("div"); renderFocus(fb); page.appendChild(fb); el.appendChild(page); return; }
    if (S.routines.morning.length && S.day.evening !== today) page.appendChild(tdGroup("morning", today));
    if (todayMode === "cal") { calSel = dayISO(); const box = document.createElement("div"); box.className = "sub"; renderDay(box, { embedded: true }); page.appendChild(box); }
    else { const ul = renderList("today", "Пусто. Нажми «+», чтобы добавить задачу."); ul.classList.add("td-list"); page.appendChild(ul); }
    { const hh = hiddenHint("today"); if (hh) page.appendChild(hh); }
    if (S.routines.evening.length) page.appendChild(tdGroup("evening", today));
    el.appendChild(page);
    const first = [...page.querySelectorAll("li.task:not(.done)")].find((li) => li.querySelector(".mins") || li.classList.contains("trun")); if (first) first.classList.add("nx");
    if (todayMode === "cal") { const bl = [...page.querySelectorAll(".dblk:not(.done)")].filter((b) => b.querySelector(".dplay")).sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top)); if (bl[0]) bl[0].classList.add("nx"); }
  }
  function notesOpen() {
    if ($("notesDlg")) return;
    const bg = document.createElement("div"); bg.id = "notesDlg";
    bg.innerHTML = `<div class="qa" role="dialog" aria-label="Заметки"><div class="qa-h"><b>Заметки для Claude</b><span class="nd-st">${S.notes ? "сохранено" : ""}</span><button type="button" class="qa-x" aria-label="Закрыть">×</button></div><textarea class="field nd-ta" rows="10" placeholder="Мысли и комментарии для Claude. Сохраняется само, с телефона и с компа."></textarea><div class="qa-f"><span></span><button class="act nd-copy">Скопировать</button></div></div>`;
    document.body.appendChild(bg);
    const ta = bg.querySelector("textarea"), st = bg.querySelector(".nd-st"); ta.value = S.notes || "";
    let tm = null; const save = () => { clearTimeout(tm); tm = null; persist(); st.textContent = S.notes ? "сохранено" : ""; };
    ta.oninput = () => { S.notes = ta.value; st.textContent = "сохраняю…"; clearTimeout(tm); tm = setTimeout(save, 600); };
    const close = () => { if (tm) save(); bg.remove(); };
    bg.querySelector(".qa-x").onclick = close; bg.onpointerdown = (e) => { if (e.target === bg) close(); };
    bg.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    bg.querySelector(".nd-copy").onclick = (e) => { try { navigator.clipboard.writeText(ta.value); e.target.textContent = "Скопировано"; } catch {} };
    setTimeout(() => ta.focus(), 0);
  }
  function fabSync() {
    let f = $("fab");
    if (!f) { f = document.createElement("button"); f.id = "fab"; f.setAttribute("aria-label", "Добавить задачу"); f.title = "Добавить задачу (N)"; f.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'; f.onclick = () => qaOpen(view === "tasks" ? "backlog" : "today", { where: true, def: view === "tasks" ? "backlog" : "today" }); document.body.appendChild(f); }
    f.hidden = !(view === "today" || view === "tasks");
  }

  // "Поработать": one task in Today whose time = sum of estimates of work tasks in To do / In progress
  function workTaskSync() {
    const sum = S.work.tasks.filter((t) => (t.status === "todo" || t.status === "doing")).reduce((a, t) => a + (t.est || 0), 0);
    let w = S.tasks.find((t) => t.id === "work-auto");
    const n = S.work.tasks.filter((t) => t.status === "todo" || t.status === "doing").length;
    if (!n) { if (w && !w.done && !w.acc && T?.id !== w.id) { S.tasks.splice(S.tasks.indexOf(w), 1); persist(); } return; }
    if (!w) { w = { id: "work-auto", name: "Поработать 💼", min: 0, done: false, spent: 0, note: "", project: "", where: "today", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: "", at: "" }; S.tasks.unshift(w); }
    const m = Math.max(5, Math.min(480, sum || 25));
    if (w.where !== "done" && (w.min !== m || w.where !== "today") && !w.done) { w.min = m; w.where = "today"; persist(); }
  }

  // ===== morning scenarios: Быстро / Дома / Кастом =====
  const MS_STRIP = (l) => l.map((x) => ({ id: x.id, name: x.name, min: x.min || 0, note: x.note || "" }));
  function mScenInit() {
    if (Array.isArray(S.mScen) && S.mScen.length === 3) return;
    const home = MS_STRIP(S.routines.morning || []);
    if (!home.some((x) => /^раздуплиться/i.test(x.name))) home.unshift({ id: uid(), name: "Раздуплиться ☕", min: 3, note: "" });
    const pick = (re, min, name) => { const f = home.find((x) => re.test(x.name)); return { id: uid(), name: f ? f.name : name, min: f ? (f.min || min) : min, note: "" }; };
    const fast = [pick(/раздуплиться/i, 3, "Раздуплиться ☕"), pick(/душ/i, 10, "Душ 🚿"), pick(/зубы/i, 0, "Почистить зубы 🪥"), pick(/одеться/i, 0, "Одеться 👕"), pick(/выход/i, 0, "Выход из дома 💼")];
    S.mScen = [{ id: "fast", name: "Быстро", icon: "⚡", items: fast }, { id: "home", name: "Дома", icon: "🏠", items: home }, { id: "custom", name: "Кастом", icon: "✏️", items: home.map((x) => ({ ...x, id: uid() })) }];
  }
  function mScenSave() {
    if (!S.mScenCur || !Array.isArray(S.mScen) || !S.routines || !S.routines.morning) return;
    const sc = S.mScen.find((x) => x.id === S.mScenCur); if (sc) sc.items = MS_STRIP(S.routines.morning);
  }
  const mScenDefault = () => [1, 3, 5].includes(new Date().getDay()) ? "fast" : "home";
  function mScenApply(id) {
    mScenInit(); const sc = S.mScen.find((x) => x.id === id) || S.mScen[1];
    S.mScenCur = null;
    S.routines.morning = sc.items.map((x) => ({ ...x, done: false, spent: 0 }));
    S.mScenCur = sc.id; morningOpen = true; persist(); render(); morningKick();
  }
  function mScenPick() {
    mScenInit(); if ($("mscen")) return;
    const def = mScenDefault(), mins = (l) => l.reduce((a, x) => a + (x.min || 0), 0);
    const bg = document.createElement("div"); bg.id = "mscen";
    bg.innerHTML = `<div class="ms" role="dialog" aria-label="Выбор утра"><div class="ms-t">Доброе утро</div><div class="ms-s">Какое утро? Через <b class="ms-cd">5:00</b> начнётся «${esc(S.mScen.find((x) => x.id === def).name)}»</div>
      <div class="ms-l">${S.mScen.map((sc) => `<button class="ms-o${sc.id === def ? " on" : ""}" data-id="${sc.id}"><span class="ms-i">${sc.icon}</span><span class="ms-n"><b>${esc(sc.name)}</b><em>${esc(sc.items.slice(0, 5).map((x) => x.name.replace(/\s*\p{Extended_Pictographic}.*$/u, "")).join(" · "))}${sc.items.length > 5 ? " …" : ""} — ${mins(sc.items)} мин</em></span><span class="ms-go">▶</span></button>`).join("")}</div></div>`;
    document.body.appendChild(bg);
    const end = Date.now() + 5 * 60000; let iv = null;
    const go = (id) => { clearInterval(iv); bg.remove(); try { unlockSound(); } catch {} mScenApply(id); };
    bg.querySelectorAll(".ms-o").forEach((b) => b.onclick = () => go(b.dataset.id));
    iv = setInterval(() => { const l = end - Date.now(); if (l <= 0) { go(def); return; } const cd = bg.querySelector(".ms-cd"); if (cd) cd.textContent = Math.floor(l / 60000) + ":" + String(Math.floor(l % 60000 / 1000)).padStart(2, "0"); }, 1000);
    bg.addEventListener("keydown", (e) => { const n = { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code]; if (n != null) { e.stopPropagation(); go(S.mScen[n].id); } else if (e.key === "Enter") go(def); });
    setTimeout(() => (bg.querySelector(".ms-o.on") || bg.querySelector(".ms-o")).focus(), 0);
  }

  // ===== linked pre/post tasks: hover top/bottom edge → "+" =====
  const lnKids = (p) => S.tasks.filter((x) => x.link === p.id);
  function lnSync() {
    S.tasks.forEach((c) => { if (c.link && !S.tasks.some((p) => p.id === c.link)) { delete c.link; delete c.rel; } });
    S.tasks.forEach((p) => {
      if (p.link) return; const ks = lnKids(p); if (!ks.length) return;
      const pre = ks.filter((k) => k.rel === "pre"), post = ks.filter((k) => k.rel !== "pre");
      ks.forEach((k) => { if (k.where !== p.where && k.where !== "done" && !k.done) k.where = p.where; });
      if (!p.at) { ks.forEach((k) => k.at = ""); return; }
      let cur = toMin(p.at); for (let i = pre.length - 1; i >= 0; i--) { cur -= pre[i].min || 5; pre[i].at = hhmm(cur); }
      cur = toMin(p.at) + (p.min || 0); post.forEach((k) => { k.at = hhmm(cur); cur += k.min || 5; });
    });
  }
  function lnHidden(t) { if (!t.link) return false; const p = S.tasks.find((x) => x.id === t.link); return !!p && !p.lnOpen; }
  function lnOrder(items) {
    const ids = new Set(items.map((t) => t.id)), out = [];
    items.forEach((t) => {
      if (t.link && ids.has(t.link)) return;
      const ks = t.link ? [] : items.filter((k) => k.link === t.id), open = !!t.lnOpen;
      if (open) ks.filter((k) => k.rel === "pre").forEach((k) => out.push(k));
      out.push(t);
      if (open) ks.filter((k) => k.rel !== "pre").forEach((k) => out.push(k));
    });
    return out;
  }
  const LNPLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>';
  function lnDecor(el, t) {
    if (!t || t.done || t.where === "done") { if (t && t.link) el.classList.add("lnc"); return; }
    if (t.link) el.classList.add("lnc", t.rel === "pre" ? "lnpre" : "lnpost");
    el.classList.add("lnh");
    [["pre", "Добавить задачу перед"], ["post", "Добавить задачу после"]].forEach(([side, lbl]) => {
      const rel = t.link ? t.rel : side;
      const b = document.createElement("button"); b.type = "button"; b.className = "lnp lnp-" + side; b.setAttribute("aria-label", lbl); b.title = lbl; b.innerHTML = LNPLUS;
      b.addEventListener("pointerdown", (e) => e.stopPropagation());
      b.onclick = (e) => { e.stopPropagation(); e.preventDefault(); qaOpen(t.where, { link: t.link || t.id, rel, anchor: t.id, side }); };
      el.appendChild(b);
    });
    const ks = t.link ? [] : lnKids(t); if (!ks.length) return;
    const k = document.createElement("button"); k.type = "button"; k.className = "lnk" + (t.lnOpen ? " on" : ""); k.setAttribute("aria-expanded", !!t.lnOpen);
    k.setAttribute("aria-label", t.lnOpen ? "Свернуть связанные" : "Показать связанные"); k.title = ks.map((x) => (x.rel === "pre" ? "до: " : "после: ") + x.name).join("\n");
    k.innerHTML = `<span>${ks.length}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
    k.addEventListener("pointerdown", (e) => e.stopPropagation());
    k.onclick = (e) => { e.stopPropagation(); e.preventDefault(); t.lnOpen = !t.lnOpen; persist(); render(); };
    const host = el.querySelector(".go") ? el : (el.querySelector(".dtx") || el);
    if (el.querySelector(".pen")) el.insertBefore(k, el.querySelector(".pen")); else host.appendChild(k);
  }

  // ===== click task → expand in place (time + ▶ Старт, ✎ for all props); click name text → rename =====
  let tdOpen = null, tdHideRun = null;
  const tdCollapse = () => { tdOpen = null; if (T && !T.work) tdHideRun = T.id; render(); };
  function tdRename(el, t) {
    const host = el.closest("li.task, .dblk") || el.parentElement, hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
    const inp = document.createElement("input"); inp.className = "tdren"; inp.value = t.name || ""; inp.maxLength = 140; inp.setAttribute("aria-label", "Название");
    const cs = getComputedStyle(el); inp.style.cssText = `left:${r.left - hr.left - 4}px;top:${r.top - hr.top - 3}px;width:${Math.max(160, hr.right - r.left - 60)}px;height:${r.height + 6}px;font:${cs.font};`;
    host.appendChild(inp); el.style.visibility = "hidden"; inp.focus(); inp.select();
    let done = false;
    const fin = (save) => { if (done) return; done = true; const v = inp.value.replace(/\s+/g, " ").trim(); if (save && v && v !== t.name) { t.name = v; persist(); } render(); };
    ["click", "pointerdown", "keyup", "dblclick"].forEach((ev) => inp.addEventListener(ev, (e) => e.stopPropagation()));
    inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); fin(true); } else if (e.key === "Escape") { e.preventDefault(); fin(false); } });
    inp.addEventListener("blur", () => fin(true));
  }
  function tdNameHit(e) { const n = e.target.closest(".name, .dblk b"); return n && wHitText(n, e.clientX, e.clientY) ? n : null; }
  function tdToggle(t) {
    if (T && !T.work && T.id !== t.id && T.endsAt != null) pause();
    if (T && !T.work && T.id === t.id) { tdOpen = null; tdHideRun = tdHideRun === t.id ? null : t.id; render(); return; }
    if (tdOpen === t.id) return tdCollapse();
    tdOpen = t.id; if (T && !T.work) tdHideRun = T.id;
    render();
  }
  const PENSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>';
  function tdPen(li, t, key) {
    const p = document.createElement("button"); p.className = "tdx-pen"; p.setAttribute("aria-label", "Все настройки"); p.title = "Все настройки"; p.innerHTML = PENSVG;
    p.onclick = (e) => { e.stopPropagation(); if (!isRoutine(key)) openSheet({ id: t.id }); else inlineEdit(li, t, li.querySelector(".go")); };
    li.appendChild(p);
  }
  function tdExpand(li, t, key) {
    li.classList.add("tdopen");
    const box = document.createElement("div"); box.className = "tin tdx";
    const m = t.min || 0;
    box.innerHTML = `<div class="tin-t"><b class="tin-time">${m ? pad(m) + ":00" : "без таймера"}</b><span class="tin-st">${t.acc ? "уже ушло " + durShort(t.acc) : m ? "не начато" : ""}</span></div><div class="tin-c"></div>`;
    const c = box.querySelector(".tin-c");
    const mk = (label, cls, fn) => { const b = document.createElement("button"); b.className = "tb " + cls; b.innerHTML = label; b.onclick = (e) => { e.stopPropagation(); fn(); }; c.appendChild(b); return b; };
    tdLnBox(box, t, key);
    if (m) mk("▶ Старт", "pri tdx-go", () => { tdOpen = null; tdHideRun = null; startTimer(t.id); });
    mk("Готово ✓", "", () => { tdOpen = null; t.done = true; t.spent = 0; if (!isRoutine(key)) t.doneAt = Date.now(); persist(); render(); maybeCloseDay(key); });
    mk("Свернуть", "", tdCollapse);
    li.appendChild(box); tdPen(li, t, key);
  }

  document.addEventListener("click", (e) => {
    if (view !== "today" || !(tdOpen || (T && !T.work && tdHideRun !== T.id && document.querySelector("li.trun")))) return;
    if (e.target.closest("li.task, .dblk, button, input, select, textarea, label, a, #sheet, .sheet, #qa, .wmenu, #mini, #timer, .td-pop, [role=dialog]")) return;
    tdCollapse();
  });

  function tdLnBox(box, t, key) {
    const ks = !isRoutine(key) && !t.link ? lnKids(t) : []; if (!ks.length) return;
    const pre = ks.filter((k) => k.rel === "pre").length, post = ks.length - pre;
    const lb = document.createElement("label"); lb.className = "tdx-ln"; lb.innerHTML = `<input type="checkbox"${t.lnOpen ? " checked" : ""}> Показать связанные <em>${[pre ? pre + " до" : "", post ? post + " после" : ""].filter(Boolean).join(" · ")}</em>`;
    lb.onclick = (e) => e.stopPropagation(); lb.querySelector("input").onchange = (e) => { t.lnOpen = e.target.checked; persist(); render(); }; box.appendChild(lb);
  }

  // ===== right-click menu on a task =====
  document.addEventListener("contextmenu", (e) => {
    const el = e.target.closest("#vToday li.task[data-id], #vTasks li.task[data-id], .dblk[data-id]"); if (!el || editing) return;
    if (e.target.closest(".tin .tb, input, .tdren")) return;
    const f = findItem(el.dataset.id); if (!f || f.work) return;
    e.preventDefault(); e.stopPropagation();
    if (e.target.closest(".mins, .dplay, .tdx-go")) return tdTimeMenu(f.t, e.clientX, e.clientY);
    tdCtx(f.t, f.key, e.clientX, e.clientY, el);
  }, true);
  function tdCtx(t, key, x, y, el) {
    const old = $("wmenu"); if (old) old.remove();
    const rout = isRoutine(key), m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu"; m.setAttribute("role", "menu");
    const items = [];
    const it = (label, fn, cls) => items.push([label, fn, cls]), hr = () => items.push(null);
    const done = t.done || t.where === "done";
    if (t.min && !done) it("▶ Запустить", () => { tdOpen = null; tdHideRun = null; startTimer(t.id); });
    if (!done) it(tdOpen === t.id ? "Свернуть" : "Раскрыть", () => tdToggle(t));
    it("Переименовать", () => { const n = el.querySelector(".name, b"); if (n) tdRename(n, t); });
    it("Все настройки…", () => { if (!rout) openSheet({ id: t.id }); else { const li = el.closest("li.task"); if (li) inlineEdit(li, t, li.querySelector(".go")); } });
    hr();
    it(done ? "Вернуть в работу" : "Готово ✓", () => { if (!rout && t.where === "done") { t.where = "today"; t.done = false; } else { t.done = !t.done; t.spent = 0; if (!rout) t.doneAt = t.done ? Date.now() : 0; } persist(); render(); if (t.done) maybeCloseDay(key); });
    if (!rout && !t.link && !done) { hr(); it("＋ Задача до", () => qaOpen(t.where, { link: t.id, rel: "pre" })); it("＋ Задача после", () => qaOpen(t.where, { link: t.id, rel: "post" })); if (lnKids(t).length) it(t.lnOpen ? "Скрыть связанные" : "Показать связанные", () => { t.lnOpen = !t.lnOpen; persist(); render(); }); }
    if (!rout && !t.link && !done) {
      hr();
      [["today", "На сегодня"], ["tomorrow", "На завтра"], ["backlog", "В дела"]].filter(([k]) => k !== t.where).forEach(([k, l]) => it(l, () => { moveTask(t, k); persist(); render(); }));
      if (t.at) it("Убрать время", () => { t.at = ""; persist(); render(); });
    }
    if (t.link) { hr(); it("Отвязать от задачи", () => { delete t.link; delete t.rel; persist(); render(); }); }
    hr();
    it("Удалить", () => { if (rout) { const a = S.routines[key], i = a.indexOf(t); if (i >= 0) a.splice(i, 1); persist(); render(); toast("Удалено", "Отменить", () => { a.splice(Math.min(i, a.length), 0, t); persist(); render(); }); } else deleteTask(t); }, "d");
    items.forEach((x, i) => { if (!x) { if (i && items[i - 1]) m.appendChild(document.createElement("hr")); return; } const b = document.createElement("button"); b.textContent = x[0]; if (x[2]) b.className = x[2]; b.setAttribute("role", "menuitem"); b.onclick = (ev) => { ev.stopPropagation(); m.remove(); x[1](); }; m.appendChild(b); });
    document.body.appendChild(m); const mr = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth - mr.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(y, innerHeight - mr.height - 8)) + "px";
    const close = (ev) => { if (ev.type === "keydown" && ev.key !== "Escape") return; if (ev.type === "pointerdown" && m.contains(ev.target)) return; m.remove(); document.removeEventListener("pointerdown", close, true); document.removeEventListener("keydown", close, true); };
    setTimeout(() => { document.addEventListener("pointerdown", close, true); document.addEventListener("keydown", close, true); }, 0);
  }

  function tdTimeMenu(t, x, y) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu wtm";
    const draw = () => { m.innerHTML = `<div class="wtm-h">${esc(t.name || "Задача")}</div><div class="wtm-g">${[5, 10, 15, 20, 25, 30, 45, 60].map((v) => `<button data-m="${v}" aria-pressed="${t.min === v}">${v}</button>`).join("")}</div>
      <div class="wtm-r"><button data-s="-1" aria-label="Меньше">−</button><b>${t.min ? t.min + " мин" : "без таймера"}</b><button data-s="1" aria-label="Больше">+</button></div>
      <hr>${t.min ? `<button data-a="go" class="wtm-go">▶ Старт · ${t.min} мин</button>` : ""}<button data-a="clr">Без таймера</button>`; };
    draw(); document.body.appendChild(m); const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x - r.width + 20, innerWidth - r.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(y + 8, innerHeight - r.height - 8)) + "px";
    const close = () => { m.remove(); document.removeEventListener("pointerdown", out, true); document.removeEventListener("keydown", esc_, true); };
    const out = (ev) => { if (!m.contains(ev.target)) close(); }, esc_ = (ev) => { if (ev.key === "Escape") close(); };
    setTimeout(() => { document.addEventListener("pointerdown", out, true); document.addEventListener("keydown", esc_, true); }, 0);
    m.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return; e.stopPropagation();
      if (b.dataset.m) { t.min = +b.dataset.m; persist(); close(); render(); return; }
      if (b.dataset.s) { const s = +b.dataset.s, v = t.min || 0; t.min = Math.max(0, Math.min(240, s > 0 ? (v < 10 ? v + 1 : v + 5) : (v <= 10 ? v - 1 : v - 5))); persist(); draw(); render(); return; }
      if (b.dataset.a === "go") { close(); tdOpen = null; tdHideRun = null; startTimer(t.id); return; }
      if (b.dataset.a === "clr") { t.min = 0; persist(); close(); render(); }
    };
  }

  document.addEventListener("focusout", (e) => { const i = e.target; if (!i.classList || !i.classList.contains("wsadd")) return; setTimeout(() => { if (wAdding && !document.activeElement?.classList?.contains("wsadd") && !i.value.trim()) { wAdding = null; renderWork(); } }, 120); });

  document.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest("#vWork .wsplus"); if (!b) return; e.stopPropagation(); wAdding = { id: b.dataset.pid, pre: !!b.dataset.pre }; renderWork(); }, true);

  function wNest(t, n) {
    const P = wtask(n.pid); if (!P || P.id === t.id) return;
    t.parent = P.id; if (n.pre) t.pre = true; else delete t.pre;
    t.status = ""; t.doneAt = 0; t.project = P.project; t.stage = P.stage;
    const sib = S.work.tasks.filter((x) => x.parent === P.id && !!x.pre === !!n.pre && x.id !== t.id).sort(byOrd);
    let i = n.before ? sib.findIndex((x) => x.id === n.before) : n.after ? sib.findIndex((x) => x.id === n.after) + 1 : sib.length;
    if (i < 0) i = sib.length;
    const prev = sib[i - 1], next = sib[i];
    t.ord = prev && next ? (prev.ord + next.ord) / 2 : prev ? prev.ord + 1 : next ? next.ord - 1 : 1;
    (n.pre ? wPreOpen : wSubOpen).add(P.id); persist();
  }

  // ===== morning scenarios editor (tab "Сценарии") =====
  function renderScen() {
    mScenInit();
    const el = $("vScen"); el.innerHTML = "";
    const page = document.createElement("div"); page.className = "sce";
    const def = mScenDefault();
    page.innerHTML = `<div class="sce-h"><h1 class="td-t">Сценарии утра</h1><div class="td-s">Утром выбираешь один из них. Если не выбрал, через 5 минут запускается: пн, ср, пт — «${esc(S.mScen[0].name)}», в остальные дни — «${esc(S.mScen[1].name)}».</div></div><div class="sce-g"></div>`;
    const g = page.querySelector(".sce-g");
    const touch = () => { S.mScenCur = null; persist(); };
    S.mScen.forEach((sc) => {
      const c = document.createElement("div"); c.className = "sce-c" + (sc.id === def ? " def" : "");
      const mins = sc.items.reduce((a, x) => a + (x.min || 0), 0);
      c.innerHTML = `<div class="sce-ch"><input class="sce-ic" maxlength="2" value="${esc(sc.icon)}" aria-label="Иконка"><input class="sce-nm" maxlength="30" value="${esc(sc.name)}" aria-label="Название сценария"><span class="sce-sum">${sc.items.length} · ${tdMin(mins) || "0 мин"}</span></div>${sc.id === def ? '<div class="sce-def">сегодня по умолчанию</div>' : ""}<ul class="sce-l"></ul><form class="sce-add"><input placeholder="+ пункт (Душ 10м)" maxlength="80" aria-label="Новый пункт"></form>`;
      c.querySelector(".sce-ic").onchange = (e) => { sc.icon = e.target.value.trim() || "•"; touch(); };
      c.querySelector(".sce-nm").onchange = (e) => { sc.name = e.target.value.trim() || sc.name; touch(); renderScen(); };
      const ul = c.querySelector(".sce-l");
      sc.items.forEach((it, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="sce-n">${i + 1}</span><input class="sce-in" value="${esc(it.name)}" maxlength="80" aria-label="Пункт"><input class="sce-mn" type="number" min="0" max="240" value="${it.min || 0}" aria-label="Минуты"><span class="sce-u">мин</span><button class="sce-b" data-a="up" aria-label="Выше"${i ? "" : " disabled"}>↑</button><button class="sce-b" data-a="dn" aria-label="Ниже"${i < sc.items.length - 1 ? "" : " disabled"}>↓</button><button class="sce-b sce-x" data-a="del" aria-label="Удалить">×</button>`;
        li.querySelector(".sce-in").onchange = (e) => { const v = e.target.value.trim(); if (v) { it.name = v; touch(); } else e.target.value = it.name; };
        li.querySelector(".sce-mn").onchange = (e) => { it.min = Math.max(0, Math.min(240, Math.round(+e.target.value || 0))); touch(); renderScen(); };
        li.querySelectorAll(".sce-b").forEach((b) => b.onclick = () => {
          const a = b.dataset.a;
          if (a === "del") sc.items.splice(i, 1);
          else { const j = a === "up" ? i - 1 : i + 1; if (j < 0 || j >= sc.items.length) return; [sc.items[i], sc.items[j]] = [sc.items[j], sc.items[i]]; }
          touch(); renderScen();
        });
        ul.appendChild(li);
      });
      c.querySelector(".sce-add").onsubmit = (e) => {
        e.preventDefault(); const inp = e.target.querySelector("input"), raw = inp.value.trim(); if (!raw) return;
        const q = parseQuick(raw); sc.items.push({ id: uid(), name: q.name, min: q.min ?? 0, note: "" }); touch(); renderScen();
        const n = document.querySelector(`#vScen .sce-c:nth-child(${S.mScen.indexOf(sc) + 1}) .sce-add input`); if (n) n.focus();
      };
      g.appendChild(c);
    });
    el.appendChild(page);
  }
