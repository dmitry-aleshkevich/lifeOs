  // ===== Plan page: kanban (Сегодня / Завтра / На неделе + shelves) =====
  let pkOpen = "";
  function renderPlanKB() {
    const el = $("vTasks"); el.innerHTML = "";
    const today = dayISO(), wk = addDays(today, 7), live = S.tasks.filter((t) => !t.done && t.where !== "done" && !t.tpl && !t.link);
    const cols = [
      ["today", "Сегодня", live.filter((t) => t.where === "today")],
      ["tomorrow", "Завтра", live.filter((t) => t.where === "tomorrow")],
      ["week", "На неделе", live.filter((t) => (t.where === "backlog" || t.where === "wait") && t.due && t.due <= wk)],
    ];
    const move = (t, k) => {
      if (k === "today" || k === "tomorrow") { t.where = k; }
      else if (k === "week") { t.where = "backlog"; if (!t.due || t.due > wk) t.due = addDays(today, 6); }
      else if (k === "none") { t.where = "backlog"; t.due = ""; }
      else if (k === "done") { t.done = true; t.doneAt = Date.now(); }
      pkOpen = ""; persist(); render();
    };
    const sum = (ls) => { const m = ls.reduce((a, t) => a + (t.min || 0), 0); return ls.length + (m ? " · " + tdMin(m) : ""); };
    const card = (t) => {
      const c = document.createElement("div"); c.className = "pk-c" + (pkOpen === t.id ? " open" : ""); c.draggable = true; c.dataset.id = t.id;
      const meta = [t.at, t.due && t.where !== "today" ? shortDate(t.due) : "", t.min ? tdMin(t.min) : "", t.check && t.check.length ? t.check.filter((x) => x.done).length + "/" + t.check.length + " ✓" : ""].filter(Boolean).join(" · ");
      c.innerHTML = `<div class="pk-n">${esc(t.name)}</div>${meta ? `<div class="pk-m">${esc(meta)}</div>` : ""}${pkOpen === t.id ? `<div class="pk-a">${[["today", "Сегодня"], ["tomorrow", "Завтра"], ["week", "Неделя"], ["none", "Без даты"], ["done", "✓"]].map(([k, l]) => `<button data-k="${k}">${l}</button>`).join("")}</div>` : ""}`;
      c.onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) { move(t, b.dataset.k); return; } pkOpen = pkOpen === t.id ? "" : t.id; render(); };
      c.ondragstart = (e) => { e.dataTransfer.setData("text/plain", t.id); c.classList.add("drag"); };
      c.ondragend = () => c.classList.remove("drag");
      return c;
    };
    const dropZone = (z, k) => {
      z.ondragover = (e) => { e.preventDefault(); z.classList.add("over"); }; z.ondragleave = () => z.classList.remove("over");
      z.ondrop = (e) => { e.preventDefault(); z.classList.remove("over"); const t = S.tasks.find((x) => x.id === e.dataTransfer.getData("text/plain")); if (t) move(t, k); };
    };
    const page = document.createElement("div"); page.className = "pk";
    page.innerHTML = `<div class="pk-h"><h1 class="td-t">План</h1><div class="td-s">Тапни карточку, чтобы перенести. На компьютере можно перетаскивать.</div></div>`;
    const row = document.createElement("div"); row.className = "pk-cols";
    cols.forEach(([k, l, ls]) => {
      const col = document.createElement("div"); col.className = "pk-col"; dropZone(col, k);
      col.innerHTML = `<div class="pk-ch"><b>${l}</b><em>${sum(ls)}</em></div>`;
      ls.forEach((t) => col.appendChild(card(t)));
      const a = document.createElement("button"); a.className = "pk-add"; a.textContent = "+ задача"; a.onclick = () => qaOpen(k === "week" ? "backlog" : k, { where: true, def: k === "week" ? "backlog" : k }); col.appendChild(a);
      row.appendChild(col);
    });
    page.appendChild(row);
    const lb = document.createElement("div"); lb.className = "pk-lbl"; lb.textContent = "Без даты · по департаментам"; page.appendChild(lb);
    const sh = document.createElement("div"); sh.className = "pk-sh";
    const nod = live.filter((t) => (t.where === "backlog" || t.where === "wait") && !(t.due && t.due <= wk));
    [["home", "🏠 Дом"], ["growth", "🌱 Рост"], ["work", "💼 Работа"], ["", "📥 Прочее"]].forEach(([k, l]) => {
      const ls = nod.filter((t) => (kindOf(t) || "") === k); if (!ls.length && k === "work") return;
      const s = document.createElement("div"); s.className = "pk-s"; dropZone(s, "none");
      s.innerHTML = `<div class="pk-ch"><b>${l}</b><em>${ls.length}</em></div>`; ls.forEach((t) => s.appendChild(card(t))); sh.appendChild(s);
    });
    planInit();
    const core = document.createElement("div"); core.className = "pk-s pk-ro";
    core.innerHTML = `<div class="pk-ch"><b>⚙️ LifeCore</b><em>авто</em></div>` + S.plan.map((b) => `<span class="pk-p">${esc(b.name)} ${esc(b.at)}</span>`).join("");
    sh.appendChild(core);
    const rt = document.createElement("div"); rt.className = "pk-s pk-ro";
    rt.innerHTML = `<div class="pk-ch"><b>☀️ Рутины</b><em>авто</em></div><span class="pk-p">Утро · ${S.routines.morning.length}</span><span class="pk-p">Вечер · ${S.routines.evening.length}</span>`;
    rt.onclick = () => setView("scen"); sh.appendChild(rt);
    page.appendChild(sh); el.appendChild(page);
  }
