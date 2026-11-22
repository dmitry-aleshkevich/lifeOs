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
      ul._arr = sc.items; ul._done = () => { touch(); renderScen(); };
      c.querySelector(".sce-add").onsubmit = (e) => {
        e.preventDefault(); const inp = e.target.querySelector("input"), raw = inp.value.trim(); if (!raw) return;
        const q = parseQuick(raw); sc.items.push({ id: uid(), name: q.name, min: q.min ?? 0, note: "" }); touch(); renderScen();
        const n = document.querySelector(`#vScen .sce-c:nth-child(${S.mScen.indexOf(sc) + 1}) .sce-add input`); if (n) n.focus();
      };
      g.appendChild(c);
    });
    tplEditor(page);
    planEditor(page);
    el.appendChild(page); sceDnd(page);
  }

  // ===== daily plan (template): blocks appear in Today every day =====
  const PLAN_DAYS = [1, 2, 3, 4, 5, 6, 0], PLAN_ALL = [0, 1, 2, 3, 4, 5, 6];
  const planKid = (name, min) => ({ id: uid(), name, min });
  const planDefault = () => [
    { id: "p-gym", name: "Зал 🏋️", at: "15:00", min: 60, days: [1, 3, 5], pre: [], post: [] },
    { id: "p-lunch-a", name: "Обед 🍽️", at: "15:00", min: 30, days: [0, 2, 4, 6], pre: [planKid("Готовка 🍳", 20)], post: [planKid("Посуда 🧽", 10)] },
    { id: "p-lunch-b", name: "Обед 🍽️", at: "16:15", min: 30, days: [1, 3, 5], pre: [planKid("Готовка 🍳", 20)], post: [planKid("Посуда 🧽", 10)] },
    { id: "p-dinner", name: "Ужин 🍽️", at: "21:30", min: 30, days: PLAN_ALL.slice(), pre: [planKid("Готовка 🍳", 20)], post: [planKid("Посуда 🧽", 10)] },
  ];
  const planInit = () => { if (!Array.isArray(S.plan)) S.plan = planDefault(); };
  function planSync(force) {
    planInit(); const today = dayISO();
    if (S.planGen === today && !force) return false;
    const dow = fromISO(today).getDay();
    for (let i = S.tasks.length - 1; i >= 0; i--) { const t = S.tasks[i]; if (t.tpl && !t.done && t.where !== "done" && (force || (t.tplDay || "") < today) && !(T && !T.work && T.id === t.id)) S.tasks.splice(i, 1); }
    S.plan.forEach((b) => {
      if (!b.days.includes(dow)) return;
      if (S.tasks.some((t) => t.tpl === b.id && t.tplDay === today && !t.link)) return;
      const mk = (name, min, at) => ({ id: uid(), name, min, done: false, spent: 0, note: "", project: "", where: "today", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: "", at: at || "", tpl: b.id, tplDay: today });
      const par = mk(b.name, b.min, b.at);
      S.tasks.push(...b.pre.map((k) => ({ ...mk(k.name, k.min), link: par.id, rel: "pre" })), par, ...b.post.map((k) => ({ ...mk(k.name, k.min), link: par.id, rel: "post" })));
    });
    S.planGen = today; lnSync(); reorderToday(); return true;
  }
  function planEditor(page) {
    planInit();
    const sec = document.createElement("section"); sec.className = "pl";
    sec.innerHTML = `<div class="sce-h"><h1 class="td-t">Распорядок дня</h1><div class="td-s">Блоки сами появляются в «Сегодня» каждый день, готовка и посуда — «до» и «после» блока. Сон 01:00–09:00, утро с 09:00 — по сценариям выше.</div></div><div class="pl-l"></div><div class="pl-f"><button class="act" id="plAdd">＋ Блок</button><button class="act" id="plNow">Пересоздать на сегодня</button></div>`;
    const L = sec.querySelector(".pl-l"), save = () => persist(), redo = () => { persist(); renderScen(); };
    const mins = (v) => Math.max(0, Math.min(240, Math.round(+v || 0)));
    S.plan.forEach((b, bi) => {
      const c = document.createElement("div"); c.className = "pl-b";
      c.innerHTML = `<div class="pl-r"><input class="pl-nm" maxlength="40" value="${esc(b.name)}" aria-label="Название блока"><input class="pl-at" type="time" value="${esc(b.at)}" aria-label="Начало"><input class="pl-mn" type="number" min="0" max="240" value="${b.min}" aria-label="Минуты"><span class="sce-u">мин</span><button class="sce-b sce-x" data-a="del" aria-label="Удалить блок">×</button></div>
        <div class="pl-d">${PLAN_DAYS.map((d) => `<button type="button" class="pl-day" data-d="${d}" aria-pressed="${b.days.includes(d)}">${WD[d]}</button>`).join("")}</div><div class="pl-k"></div>`;
      c.querySelector(".pl-nm").onchange = (e) => { const v = e.target.value.trim(); if (v) { b.name = v; save(); } else e.target.value = b.name; };
      c.querySelector(".pl-at").onchange = (e) => { if (/^\d\d:\d\d$/.test(e.target.value)) { b.at = e.target.value; save(); } else e.target.value = b.at; };
      c.querySelector(".pl-mn").onchange = (e) => { b.min = mins(e.target.value); save(); };
      c.querySelector("[data-a=del]").onclick = () => { S.plan.splice(bi, 1); redo(); };
      c.querySelectorAll(".pl-day").forEach((x) => x.onclick = () => { const d = +x.dataset.d, i = b.days.indexOf(d); if (i < 0) b.days.push(d); else b.days.splice(i, 1); redo(); });
      const K = c.querySelector(".pl-k");
      [["pre", "До"], ["post", "После"]].forEach(([side, label]) => {
        const row = document.createElement("div"); row.className = "pl-ks";
        row.innerHTML = `<span class="pl-kl">${label}</span><div class="pl-kv"></div>`;
        const kv = row.querySelector(".pl-kv");
        b[side].forEach((k, ki) => {
          const e = document.createElement("div"); e.className = "pl-ki";
          e.innerHTML = `<input class="pl-kn" maxlength="40" value="${esc(k.name)}" aria-label="Название"><input class="pl-mn" type="number" min="0" max="240" value="${k.min}" aria-label="Минуты"><span class="sce-u">мин</span><button class="sce-b sce-x" aria-label="Убрать">×</button>`;
          e.querySelector(".pl-kn").onchange = (ev) => { const v = ev.target.value.trim(); if (v) { k.name = v; save(); } else ev.target.value = k.name; };
          e.querySelector(".pl-mn").onchange = (ev) => { k.min = mins(ev.target.value); save(); };
          e.querySelector(".sce-b").onclick = () => { b[side].splice(ki, 1); redo(); };
          kv.appendChild(e);
        });
        const f = document.createElement("form"); f.className = "pl-add"; f.autocomplete = "off"; f.innerHTML = `<input maxlength="60" placeholder="＋ ${label.toLowerCase()} (Название 10м)" aria-label="Добавить">`;
        f.onsubmit = (ev) => { ev.preventDefault(); const raw = f.querySelector("input").value.trim(); if (!raw) return; const q = parseQuick(raw); b[side].push(planKid(q.name, q.min ?? 10)); redo(); };
        kv.appendChild(f); K.appendChild(row);
      });
      L.appendChild(c);
    });
    sec.querySelector("#plAdd").onclick = () => { S.plan.push({ id: "p-" + uid(), name: "Новый блок", at: "12:00", min: 30, days: PLAN_ALL.slice(), pre: [], post: [] }); redo(); };
    sec.querySelector("#plNow").onclick = () => { S.planGen = null; planSync(true); persist(); render(); };
    page.appendChild(sec);
  }

  // ===== "Баг": debug notes → ТЗ =====
  const BUG_LS = "lifeos.bugs.v1", BUG_TYPES = [["bug", "🐞 Баг"], ["fix", "✏️ Правка"], ["note", "💬 Коммент"]];
  let bugList = (() => { try { const a = JSON.parse(localStorage.getItem(BUG_LS)); return Array.isArray(a) ? a : []; } catch { return []; } })(), bugLastId = "", bugType = "fix";
  const bugSave = () => { try { localStorage.setItem(BUG_LS, JSON.stringify(bugList)); } catch {} };
  function bugTag() {
    const v = (VIEWS.find((x) => x[0] === view) || [0, view])[1]; let tag = v;
    if (view === "today") tag += " · " + (todayMode === "cal" ? "День" : "Список");
    const t = bugLastId && (S.tasks.find((x) => x.id === bugLastId) || (S.work && S.work.tasks.find((x) => x.id === bugLastId)));
    if (t && t.name) tag += " · «" + t.name.slice(0, 40) + "»";
    return tag;
  }
  function bugTZ() {
    if (!bugList.length) return "";
    const g = {}; bugList.forEach((b) => { (g[b.tag.split(" · ")[0]] = g[b.tag.split(" · ")[0]] || []).push(b); });
    let n = 0, out = "ТЗ по LifeOS_v1 (" + bugList.length + "). Каждый пункт: сначала тест в Playwright, потом публикация.\n";
    Object.keys(g).forEach((k) => { out += "\n## " + k + "\n"; g[k].forEach((b) => { out += (++n) + ". [" + (BUG_TYPES.find((x) => x[0] === b.type) || BUG_TYPES[1])[1] + "] " + (b.tag.includes(" · ") ? "(" + b.tag.split(" · ").slice(1).join(" · ") + ") " : "") + b.text + "\n"; }); });
    return out;
  }
  function bugClose() { const p = $("bugPop"); if (p) p.remove(); }
  function bugOpen() {
    if ($("bugPop")) { bugClose(); return; }
    const p = document.createElement("div"); p.id = "bugPop";
    p.innerHTML = `<div class="bg-h"><b>Баг / правка</b><span class="bg-c"></span><button type="button" class="bg-x" aria-label="Закрыть">×</button></div>
      <label class="bg-l">Тег страницы<input class="field bg-tag" maxlength="120"></label>
      <div class="bg-ty">${BUG_TYPES.map(([v, l]) => `<button type="button" class="chip" data-t="${v}" aria-pressed="${v === bugType}">${l}</button>`).join("")}</div>
      <textarea class="field bg-ta" rows="3" placeholder="Что не так или что поправить… (Ctrl+Enter — добавить)"></textarea>
      <button type="button" class="act primary bg-add" disabled>Добавить</button>
      <ul class="bg-ls"></ul>
      <div class="bg-f"><button type="button" class="act primary bg-tz">Составить ТЗ</button><button type="button" class="act bg-clr">Очистить</button></div>
      <textarea class="field bg-out" rows="8" readonly hidden></textarea><div class="bg-ok" hidden></div>`;
    document.body.appendChild(p);
    ["keydown", "keyup", "keypress"].forEach((ev) => p.addEventListener(ev, (e) => { e.stopPropagation(); if (ev === "keydown" && e.key === "Escape") bugClose(); }));
    const tag = p.querySelector(".bg-tag"), ta = p.querySelector(".bg-ta"), add = p.querySelector(".bg-add"), ls = p.querySelector(".bg-ls"), out = p.querySelector(".bg-out"), ok = p.querySelector(".bg-ok");
    tag.value = bugTag(); tag.oninput = () => { tag.dataset.ed = tag.value ? "1" : ""; };
    const list = () => {
      p.querySelector(".bg-c").textContent = bugList.length ? bugList.length : ""; ls.innerHTML = "";
      bugList.forEach((b, i) => { const li = document.createElement("li"); li.innerHTML = `<i>${esc(b.tag)}</i><span>${esc((BUG_TYPES.find((x) => x[0] === b.type) || [0, ""])[1].split(" ")[0])} ${esc(b.text)}</span><button type="button" aria-label="Удалить">×</button>`; li.querySelector("button").onclick = () => { bugList.splice(i, 1); bugSave(); out.hidden = ok.hidden = true; list(); }; ls.appendChild(li); });
    };
    const doAdd = () => { const v = ta.value.trim(); if (!v) return; bugList.push({ id: uid(), tag: tag.value.trim() || bugTag(), type: bugType, text: v, at: Date.now() }); bugSave(); ta.value = ""; add.disabled = true; out.hidden = ok.hidden = true; tag.value = bugTag(); tag.dataset.ed = ""; list(); ta.focus(); };
    ta.oninput = () => { add.disabled = !ta.value.trim(); };
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doAdd(); } });
    add.onclick = doAdd;
    p.querySelectorAll(".bg-ty .chip").forEach((c) => c.onclick = () => { bugType = c.dataset.t; p.querySelectorAll(".bg-ty .chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); ta.focus(); });
    p.querySelector(".bg-x").onclick = bugClose;
    p.querySelector(".bg-clr").onclick = () => { if (!bugList.length) return; if (!p.querySelector(".bg-clr").dataset.arm) { p.querySelector(".bg-clr").dataset.arm = 1; p.querySelector(".bg-clr").textContent = "Точно очистить?"; setTimeout(() => { const b = p.querySelector(".bg-clr"); if (b) { delete b.dataset.arm; b.textContent = "Очистить"; } }, 3000); return; } bugList = []; bugSave(); out.hidden = ok.hidden = true; p.querySelector(".bg-clr").textContent = "Очистить"; delete p.querySelector(".bg-clr").dataset.arm; list(); };
    p.querySelector(".bg-tz").onclick = () => {
      if (ta.value.trim()) doAdd();
      const t = bugTZ(); if (!t) { ok.hidden = false; ok.textContent = "Пока пусто"; return; }
      out.value = t; out.hidden = false; ok.hidden = false;
      navigator.clipboard.writeText(t).then(() => { ok.textContent = "ТЗ скопировано ✓"; }, () => { out.select(); ok.textContent = "Выдели и скопируй (Ctrl+C)"; });
    };
    list(); setTimeout(() => ta.focus(), 0);
  }
  function bugInit() {
    if ($("bugBtn")) return;
    const b = document.createElement("button"); b.id = "bugBtn"; b.type = "button"; b.textContent = "Баг"; b.title = "Баг / правка"; b.onclick = bugOpen; document.body.appendChild(b);
    document.addEventListener("click", (e) => { if (e.target.closest("#bugPop, #bugBtn")) return; setTimeout(() => { const tg = document.querySelector("#bugPop .bg-tag"); if (tg && !tg.dataset.ed) tg.value = bugTag(); }, 60); const el = e.target.closest("[data-id]"); if (el && (S.tasks.some((x) => x.id === el.dataset.id) || (S.work && S.work.tasks.some((x) => x.id === el.dataset.id)))) bugLastId = el.dataset.id; }, true);
  }

  // ===== task scenarios (templates): "Уборка" → task with checklist / subtasks =====
  const tplInit = () => { if (!Array.isArray(S.tpls)) S.tpls = [{ id: "t-clean", name: "Уборка 🧹", mode: "sub", items: [{ id: uid(), name: "Кухня", min: 5 }, { id: uid(), name: "Комната", min: 10 }, { id: uid(), name: "Одежда", min: 5 }] }]; };
  const tplKey = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();
  const tplFind = (q) => { tplInit(); const k = tplKey(q); return k.length < 2 ? [] : S.tpls.filter((x) => tplKey(x.name).startsWith(k) || k.startsWith(tplKey(x.name))); };
  function tplTake(tp, where) {
    const mk = (name, min) => ({ id: uid(), name, min, done: false, spent: 0, note: "", project: "", where: where || "today", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: "", at: "" });
    const sum = tp.items.reduce((a, x) => a + (x.min || 0), 0);
    if (tp.mode === "check") { const t = mk(tp.name, sum); t.check = tp.items.map((x) => ({ id: uid(), text: x.name + (x.min ? " · " + x.min + " мин" : ""), done: false })); S.tasks.push(t); }
    else { const t = mk(tp.name, 0); t.lnOpen = true; S.tasks.push(t, ...tp.items.map((x) => ({ ...mk(x.name, x.min), link: t.id, rel: "post" }))); }
    persist(); render();
  }
  function tdCheckBox(box, t) {
    const w = document.createElement("div"); w.className = "tdck"; w.onclick = (e) => e.stopPropagation();
    const ls = Array.isArray(t.check) ? t.check : [];
    w.innerHTML = ls.map((c, i) => `<div class="tdck-i${c.done ? " on" : ""}"><button type="button" class="tdck-b" data-i="${i}" aria-pressed="${c.done}" aria-label="Пункт">${c.done ? "✓" : ""}</button><span>${esc(c.text)}</span><button type="button" class="tdck-x" data-x="${i}" aria-label="Удалить">×</button></div>`).join("") + `<input class="tdck-add" maxlength="120" placeholder="+ пункт, Enter" aria-label="Новый пункт">`;
    w.querySelectorAll(".tdck-b").forEach((b) => b.onclick = () => { const c = t.check[+b.dataset.i]; c.done = !c.done; persist(); render(); });
    w.querySelectorAll(".tdck-x").forEach((b) => b.onclick = () => { t.check.splice(+b.dataset.x, 1); if (!t.check.length) delete t.check; persist(); render(); });
    const a = w.querySelector(".tdck-add"); a.onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); const v = a.value.trim(); if (!v) return; (t.check = t.check || []).push({ id: uid(), text: v, done: false }); persist(); render(); setTimeout(() => { const n = document.querySelector(".tdck-add"); if (n) n.focus(); }, 0); };
    box.insertBefore(w, box.querySelector(".tin-c"));
  }
  function tplEditor(page) {
    tplInit();
    const sec = document.createElement("section"); sec.className = "pl";
    sec.innerHTML = `<div class="sce-h"><h1 class="td-t">Сценарии задач</h1><div class="td-s">Пишешь название в «Сегодня» — появляется «Взять сценарий», и задача добавляется с пунктами отсюда.</div></div><div class="pl-l"></div><div class="pl-f"><button class="act" id="tpAdd">＋ Сценарий</button></div>`;
    const L = sec.querySelector(".pl-l"), redo = () => { persist(); renderScen(); };
    S.tpls.forEach((tp, ti) => {
      const c = document.createElement("div"); c.className = "pl-b tp-b";
      const sum = tp.items.reduce((a, x) => a + (x.min || 0), 0);
      c.innerHTML = `<div class="pl-r"><input class="pl-nm" maxlength="40" value="${esc(tp.name)}" aria-label="Название"><span class="sce-sum">${tp.items.length} · ${tdMin(sum) || "0 мин"}</span><button class="sce-b sce-x" data-a="del" aria-label="Удалить">×</button></div>
        <div class="pl-d"><button type="button" class="pl-day" data-m="sub" aria-pressed="${tp.mode !== "check"}">Подзадачи</button><button type="button" class="pl-day" data-m="check" aria-pressed="${tp.mode === "check"}">Чеклист</button></div><ul class="sce-l"></ul><form class="sce-add" autocomplete="off"><input maxlength="80" placeholder="+ пункт (Кухня 5м)" aria-label="Добавить пункт"></form>`;
      c.querySelector(".pl-nm").onchange = (e) => { const v = e.target.value.trim(); if (v) { tp.name = v; persist(); } else e.target.value = tp.name; };
      c.querySelector("[data-a=del]").onclick = () => { S.tpls.splice(ti, 1); redo(); };
      c.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { tp.mode = b.dataset.m; redo(); });
      const ul = c.querySelector(".sce-l");
      tp.items.forEach((it, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="sce-n">${i + 1}</span><input class="sce-in" value="${esc(it.name)}" maxlength="80" aria-label="Пункт"><input class="sce-mn" type="number" min="0" max="240" value="${it.min || 0}" aria-label="Минуты"><span class="sce-u">мин</span><button class="sce-b" data-a="up"${i ? "" : " disabled"} aria-label="Выше">↑</button><button class="sce-b sce-x" data-a="x" aria-label="Удалить">×</button>`;
        li.querySelector(".sce-in").onchange = (e) => { const v = e.target.value.trim(); if (v) { it.name = v; persist(); } else e.target.value = it.name; };
        li.querySelector(".sce-mn").onchange = (e) => { it.min = Math.max(0, Math.min(240, Math.round(+e.target.value || 0))); redo(); };
        li.querySelector("[data-a=up]").onclick = () => { [tp.items[i - 1], tp.items[i]] = [tp.items[i], tp.items[i - 1]]; redo(); };
        li.querySelector("[data-a=x]").onclick = () => { tp.items.splice(i, 1); redo(); };
        ul.appendChild(li);
      });
      ul._arr = tp.items; ul._done = redo;
      c.querySelector(".sce-add").onsubmit = (e) => { e.preventDefault(); const raw = e.target.querySelector("input").value.trim(); if (!raw) return; const q = parseQuick(raw); tp.items.push({ id: uid(), name: q.name, min: q.min ?? 5 }); redo(); const n = document.querySelectorAll("#vScen .tp-b .sce-add input")[ti]; if (n) n.focus(); };
      L.appendChild(c);
    });
    sec.querySelector("#tpAdd").onclick = () => { S.tpls.push({ id: "t-" + uid(), name: "Новый сценарий", mode: "sub", items: [] }); redo(); };
    page.appendChild(sec);
  }

  // drag & drop reorder for scenario lists: ul._arr = items array, ul._done = callback
  function sceDnd(root) {
    root.querySelectorAll("ul.sce-l").forEach((ul) => {
      if (!ul._arr) return;
      ul.querySelectorAll(":scope > li").forEach((li, i) => { li.dataset.i = i; const n = li.querySelector(".sce-n"); if (n) n.title = "Потяни, чтобы переставить"; });
      ul.onpointerdown = (e) => {
        const li = e.target.closest("li"); if (!li || e.button !== 0 || e.target.closest("input, button")) return;
        e.preventDefault(); const from = +li.dataset.i, r0 = li.getBoundingClientRect(), dy0 = e.clientY - r0.top;
        let moved = false;
        const mv = (ev) => {
          if (!moved && Math.abs(ev.clientY - e.clientY) < 4) return;
          if (!moved) { moved = true; li.classList.add("sce-drag"); document.body.style.userSelect = "none"; }
          li.style.transform = `translateY(${ev.clientY - dy0 - li.getBoundingClientRect().top + (parseFloat(li.style.transform.slice(11)) || 0)}px)`;
          const sib = [...ul.children].filter((x) => x !== li && x.tagName === "LI");
          const before = sib.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
          const t0 = li.getBoundingClientRect().top;
          if (before) { if (li.nextElementSibling !== before) ul.insertBefore(li, before); } else if (sib.length && ul.lastElementChild !== li) ul.appendChild(li);
          const t1 = li.getBoundingClientRect().top; if (t1 !== t0) li.style.transform = `translateY(${(parseFloat(li.style.transform.slice(11)) || 0) - (t1 - t0)}px)`;
        };
        const up = () => {
          document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.body.style.userSelect = "";
          if (!moved) return; li.classList.remove("sce-drag"); li.style.transform = "";
          const to = [...ul.querySelectorAll(":scope > li")].indexOf(li);
          if (to !== from && to >= 0) { const [it] = ul._arr.splice(from, 1); ul._arr.splice(to, 0, it); }
          ul._done();
        };
        document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
      };
    });
  }

  // ===== evening banner: from 21:00 countdown to midnight =====
  const EVE_LS = "lifeos.eve.v1", EVE_FROM = 21;
  function eveTick() {
    const now = new Date(), h = now.getHours(), on = h >= EVE_FROM && !S.day.closedAt;
    let el = $("eveBan");
    if (!on) { if (el) el.remove(); return; }
    const day = dayISO(), st = (() => { try { return JSON.parse(localStorage.getItem(EVE_LS)) || {}; } catch { return {}; } })(), min = st.day === day && st.min;
    const left = Math.max(0, Math.ceil((new Date(now).setHours(24, 0, 0, 0) - now) / 60000)), hm = Math.floor(left / 60) + ":" + pad(left % 60);
    const n = S.tasks.filter((t) => t.where === "today" && !t.done && !t.tpl).length;
    if (!el) { el = document.createElement("div"); el.id = "eveBan"; document.body.appendChild(el);
      el.onclick = (e) => { const b = e.target.closest("[data-e]"); if (!b && !el.classList.contains("min")) return; const m = b ? b.dataset.e === "min" : false; try { localStorage.setItem(EVE_LS, JSON.stringify({ day: dayISO(), min: m })); } catch {} eveTick(); }; }
    el.classList.toggle("min", !!min);
    el.classList.toggle("late", left <= 60);
    el.innerHTML = min ? `<span class="eb-mt">🌙 ${hm}</span>` : `<button class="eb-x" data-e="min" aria-label="Свернуть">–</button><div class="eb-l">До полуночи осталось</div><div class="eb-t">${hm}</div><div class="eb-s">${n ? "Успей закончить дела: ещё " + n + " " + (n % 10 === 1 && n % 100 !== 11 ? "задача" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "задачи" : "задач") : "Дела закрыты — можно на вечернюю рутину"}</div>`;
  }

  // drag & drop reorder of tasks inside a Today list (ul in .td-g)
  document.addEventListener("pointerdown", (e) => {
    const li = e.target.closest(".td-list > li.task"); if (!li || e.button > 0 || li.classList.contains("tdopen") || li.classList.contains("trun") || e.target.closest("input, textarea, select, .check, .tdx-pi, .xbtn")) return;
    const ul = li.parentElement; if (!S.tasks.some((x) => x.id === li.dataset.id)) return;
    const touch = e.pointerType === "touch", y0 = e.clientY, x0 = e.clientX; let on = false, timer = 0, dy0 = 0, off = 0;
    const start = () => { on = true; li.classList.add("tdd"); document.body.style.userSelect = "none"; };
    if (touch) timer = setTimeout(() => { start(); if (navigator.vibrate) navigator.vibrate(8); }, 320);
    const mv = (ev) => {
      if (!on) {
        const d = Math.hypot(ev.clientX - x0, ev.clientY - y0);
        if (touch) { if (d > 8) cleanup(); return; }
        if (d < 6) return; start();
      }
      ev.preventDefault();
      const sib = [...ul.children].filter((x) => x !== li && x.matches("li.task"));
      const before = sib.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
      const t0 = li.getBoundingClientRect().top;
      if (before) { if (li.nextElementSibling !== before) ul.insertBefore(li, before); } else if (sib.length) { const last = sib[sib.length - 1]; if (last.nextElementSibling !== li) last.after(li); }
      const t1 = li.getBoundingClientRect().top; off -= t1 - t0;
      li.style.transform = `translateY(${ev.clientY - y0 + off}px)`;
    };
    const cleanup = () => { clearTimeout(timer); document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); document.body.style.userSelect = ""; };
    const up = () => {
      const was = on; cleanup(); if (!was) return;
      li.classList.remove("tdd"); li.style.transform = "";
      const ids = [...ul.children].filter((x) => x.matches("li.task")).map((x) => x.dataset.id), ts = ids.map((id) => S.tasks.find((x) => x.id === id)).filter(Boolean);
      if (ts.length === ids.length) { const slots = ts.map((t) => S.tasks.indexOf(t)).sort((a, b) => a - b); ts.forEach((t, i) => { S.tasks[slots[i]] = t; }); persist(); }
      const stop = (c) => { c.stopPropagation(); c.preventDefault(); document.removeEventListener("click", stop, true); }; document.addEventListener("click", stop, true); setTimeout(() => document.removeEventListener("click", stop, true), 50);
      render();
    };
    document.addEventListener("pointermove", mv, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
  });

  // Ctrl/Cmd+Z: undo last "done"; finishing a task also stops its running timer
  const undoSt = [], undoAll = () => S.tasks.concat(S.routines ? [].concat(...Object.values(S.routines)) : []);
  let undoPrev = null;
  setInterval(() => {
    const cur = new Map(undoAll().map((t) => [t.id, !!t.done]));
    if (undoPrev) cur.forEach((d, id) => {
      if (d && undoPrev.get(id) === false) {
        undoSt.push(id); if (undoSt.length > 30) undoSt.shift();
        if (tdOpen === id) tdOpen = null;
        if (T && !T.work && T.id === id) { try { closeTimer(true); } catch (e) {} render(); }
      }
    });
    undoPrev = cur;
  }, 250);
  document.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || (e.key !== "z" && e.key !== "я" && e.code !== "KeyZ")) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable=true]")) return;
    if (document.body.classList.contains("wmodal")) return;
    while (undoSt.length) {
      const id = undoSt.pop(), t = undoAll().find((x) => x.id === id);
      if (!t || !t.done) continue;
      e.preventDefault(); t.done = false; t.spent = 0; if ("doneAt" in t) t.doneAt = 0; if (t.where === "done") t.where = "today";
      undoPrev.set(id, false); persist(); render(); toast("Готово отменено: " + (t.name || ""));
      return;
    }
  });

  // export all cloud docs (os + map) to a JSON file — for moving to another host
  async function exportAll() {
    try {
      const [db, user] = await Promise.all([window.claude?.use("db"), window.claude?.use("user")]);
      const docs = await new Promise((res, rej) => { if (!db || !user) return res([{ id: "os", data: S }]); user.id().then((id) => { let done = false; const un = db.collection("data/users/" + id).onSnapshot((snap) => { if (done) return; done = true; res((snap.docs || []).map((d) => ({ id: d.id, data: d.data() }))); try { un && un(); } catch {} }, rej); }); });
      if (!docs.some((d) => d.id === "os")) docs.push({ id: "os", data: S });
      const text = JSON.stringify({ app: "lifeos", v: 1, at: Date.now(), docs }), name = "LifeOS_data_" + dayISO() + ".json";
      try { const dl = await window.claude?.use("downloads"); if (dl) { await dl.save({ filename: name, data: text }); toast("Экспорт: " + docs.length + " док."); return; } } catch (e) { if (e && e.code === "declined") return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { toast("Не получилось выгрузить"); }
  }

  // touch: long-press = context menu (task menus need it on phones)
  (() => {
    let lt = null, sx = 0, sy = 0;
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return; const t = e.touches[0], el = e.target.closest("li.task, .dblk, .wcard, .wtask, .mins"); if (!el) return;
      sx = t.clientX; sy = t.clientY; clearTimeout(lt);
      lt = setTimeout(() => { lt = null; try { navigator.vibrate && navigator.vibrate(10); } catch {} el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: sx, clientY: sy })); suppressLP = true; setTimeout(() => { suppressLP = false; }, 500); }, 520);
    }, { passive: true });
    const cancel = (e) => { if (!lt) return; if (e.type === "touchmove") { const t = e.touches[0]; if (Math.abs(t.clientX - sx) < 10 && Math.abs(t.clientY - sy) < 10) return; } clearTimeout(lt); lt = null; };
    ["touchmove", "touchend", "touchcancel"].forEach((n) => document.addEventListener(n, cancel, { passive: true }));
    let suppressLP = false; document.addEventListener("click", (e) => { if (suppressLP) { e.stopPropagation(); e.preventDefault(); suppressLP = false; } }, true);
  })();

  function navPlusSync() {
    const nv = document.getElementById("views"); if (!nv || document.getElementById("navPlus")) return;
    const b = document.createElement("button"); b.id = "navPlus"; b.type = "button"; b.setAttribute("aria-label", "Добавить");
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
    b.onclick = (e) => { e.stopPropagation(); if (view === "work") { const r = b.getBoundingClientRect(); wFabMenu(r.left + r.width / 2 + 100, r.top - 8); return; } qaOpen(view === "tasks" ? "backlog" : "today", { where: true, def: view === "tasks" ? "backlog" : "today" }); };
    nv.appendChild(b);
  }

  function tdTriSeg(cur) {
    const s = document.createElement("div"); s.className = "seg sm td-tri"; s.setAttribute("role", "group"); s.setAttribute("aria-label", "Экран");
    s.innerHTML = [["list", "Сегодня"], ["cal", "День"], ["focus", "◎ Фокус"]].map(([k, l]) => `<button data-tri="${k}" aria-pressed="${k === cur}">${l}</button>`).join("");
    s.querySelectorAll("[data-tri]").forEach((b) => b.onclick = () => { const k = b.dataset.tri; if (k === "focus") { if (!fMode) fSetMode(true); return; } if (fMode) { fMode = false; try { localStorage.setItem("lifeos.focus.v1", "plan"); } catch {} } if (view !== "today") { todayMode = k; saveUI(); setView("today"); return; } if (k === todayMode && !arguments.length) return; if (k === "list") reorderToday(); todayMode = k; saveUI(); render(); });
    return s;
  }
  const setView = (id) => { view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); };

