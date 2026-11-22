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
