  // ===== Plan page: kanban (Сегодня / Завтра / На неделе + shelves) =====
  let pkOpen = "", pkSel = new Set();
  function renderPlanKB() {
    const el = $("vTasks"); el.innerHTML = "";
    const today = dayISO(), wk = addDays(today, 7), live = S.tasks.filter((t) => !t.done && t.where !== "done" && !t.tpl);
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
      else if (k.startsWith("p:")) { t.project = k.slice(2); if (t.where === "today" || t.where === "tomorrow") {} else t.where = "backlog"; }
      pkOpen = ""; persist(); render();
    };
    const sum = (ls) => { const m = ls.reduce((a, t) => a + (t.min || 0), 0); return ls.length + (m ? " · " + tdMin(m) : ""); };
    const card = (t) => {
      const li = taskCard(t, t.where === "today" ? "today" : t.where === "tomorrow" ? "tomorrow" : "backlog");
      li.draggable = true; li.classList.add("pk-li"); li.classList.toggle("pk-sel", pkSel.has(t.id));
      li.addEventListener("dragstart", (e) => { if (!pkSel.has(t.id) || pkSel.size < 2) { pkSel.clear(); document.querySelectorAll(".pk-sel").forEach((x) => x.classList.remove("pk-sel")); } e.dataTransfer.setData("text/plain", pkSel.size > 1 ? [...pkSel].join(",") : t.id); li.classList.add("drag"); if (pkSel.size > 1) document.querySelectorAll(".pk-sel").forEach((x) => x.classList.add("drag")); });
      li.addEventListener("dragend", () => document.querySelectorAll(".pk-li.drag").forEach((x) => x.classList.remove("drag")));
      return li;
    };
    const ul = (box, ls) => { const u = document.createElement("ul"); u.className = "list pk-ul"; taskItems(ls).forEach((t) => u.appendChild(card(t))); box.appendChild(u); };
    const dropZone = (z, k) => {
      z.ondragover = (e) => { e.preventDefault(); z.classList.add("over"); }; z.ondragleave = () => z.classList.remove("over");
      z.ondrop = (e) => { e.preventDefault(); z.classList.remove("over"); const ids = e.dataTransfer.getData("text/plain").split(","); const ts = ids.map((id) => S.tasks.find((x) => x.id === id)).filter(Boolean); if (ts.length) { pkSel.clear(); ts.forEach((t) => move(t, k)); } };
    };
    const page = document.createElement("div"); page.className = "pk";
    page.innerHTML = `<div class="pk-h"><h1 class="td-t">План</h1><div class="td-s">Перетаскивай задачи между днями и департаментами. На телефоне — долгое нажатие на задачу.</div></div>`;
    const row = document.createElement("div"); row.className = "pk-cols";
    cols.forEach(([k, l, ls]) => {
      const col = document.createElement("div"); col.className = "pk-col"; col.dataset.k = k; dropZone(col, k);
      col.innerHTML = `<div class="pk-ch"><b>${l}</b><em>${sum(ls)}</em></div>`;
      ul(col, ls);
      const a = document.createElement("button"); a.className = "pk-add"; a.textContent = "+ задача"; a.onclick = () => qaStart(k, { zone: "plan:" + k }); col.appendChild(a);
      row.appendChild(col);
    });
    page.appendChild(row);
    const lb = document.createElement("div"); lb.className = "pk-lbl"; lb.textContent = "Без даты · по департаментам"; page.appendChild(lb);
    const sh = document.createElement("div"); sh.className = "pk-sh";
    const nod = live.filter((t) => (t.where === "backlog" || t.where === "wait") && !(t.due && t.due <= wk));
    const wsum = S.work.tasks.filter((t) => t.status === "todo" || t.status === "doing").reduce((x, t) => x + (t.est || 0), 0);
    const wk2 = document.createElement("div"); wk2.className = "pk-s pk-ro"; wk2.innerHTML = `<div class="pk-ch"><b>💼 Работа</b><em>${wsum ? tdMin(wsum) : "—"}</em></div><div class="pk-m">To do и In progress</div>`; wk2.onclick = () => setView("work"); sh.appendChild(wk2);
    const deps = S.projects.filter((p) => p.kind !== "work" && !p.archived);
    [...deps, { id: "", name: "Без департамента" }].forEach((p) => {
      const ls = nod.filter((t) => (p.id ? t.project === p.id : !proj(t.project) || proj(t.project).kind === "work" || proj(t.project).archived) && (p.id || kindOf(t) !== "work"));
      if (!p.id && !ls.length) return;
      const s2 = document.createElement("div"); s2.className = "pk-s"; dropZone(s2, "p:" + p.id);
      s2.innerHTML = `<div class="pk-ch"><b>${esc(p.name)}</b><em>${ls.length}${p.id ? ` <button class="pk-dm" aria-label="Меню департамента">⋯</button>` : ""}</em></div>`;
      if (p.id) s2.querySelector(".pk-dm").onclick = (e) => { e.stopPropagation(); const r = e.target.getBoundingClientRect(); pkDepMenu(p, r.left, r.bottom); };
      ul(s2, ls); sh.appendChild(s2);
    });
    { const ad = document.createElement("button"); ad.className = "pk-s pk-new"; ad.textContent = "+ Департамент"; ad.onclick = () => { const v = (prompt("Название департамента") || "").trim(); if (!v) return; S.projects.push({ id: uid(), name: v, color: COLORS[S.projects.length % COLORS.length], kind: "home" }); persist(); render(); }; sh.appendChild(ad); }
    const arch = S.projects.filter((p) => p.kind !== "work" && p.archived);
    if (arch.length) { const ab = document.createElement("div"); ab.className = "pk-arch"; ab.innerHTML = "Архив: " + arch.map((p) => `<button data-id="${p.id}">${esc(p.name)} ↩</button>`).join(" "); ab.querySelectorAll("button").forEach((b) => b.onclick = () => { proj(b.dataset.id).archived = false; persist(); render(); }); page.appendChild(sh); page.appendChild(ab); }
    planInit();
    const core = document.createElement("div"); core.className = "pk-s pk-ro";
    core.innerHTML = `<div class="pk-ch"><b>⚙️ LifeCore</b><em>авто</em></div>` + S.plan.map((b) => `<span class="pk-p">${esc(b.name)} ${esc(b.at)}</span>`).join("");
    sh.appendChild(core);
    const rt = document.createElement("div"); rt.className = "pk-s pk-ro";
    rt.innerHTML = `<div class="pk-ch"><b>☀️ Рутины</b><em>авто</em></div><span class="pk-p">Утро · ${S.routines.morning.length}</span><span class="pk-p">Вечер · ${S.routines.evening.length}</span>`;
    rt.onclick = () => setView("scen"); sh.appendChild(rt);
    if (!page.contains(sh)) page.appendChild(sh); el.appendChild(page);
  }
  function pkDepMenu(p, x, y) {
    document.querySelectorAll(".pk-menu").forEach((m) => m.remove());
    const m = document.createElement("div"); m.className = "pk-menu"; m.style.left = Math.min(x, innerWidth - 200) + "px"; m.style.top = y + 4 + "px";
    m.innerHTML = `<button data-a="ren">Переименовать</button><button data-a="arc">В архив</button><button data-a="del" class="dz">Удалить</button>`;
    m.onclick = (e) => { const a = e.target.dataset.a; if (!a) return; m.remove();
      if (a === "ren") { const v = (prompt("Название", p.name) || "").trim(); if (v) p.name = v; }
      if (a === "arc") p.archived = true;
      if (a === "del") { if (!confirm(`Удалить «${p.name}»? Задачи останутся без департамента.`)) return; S.tasks.forEach((t) => { if (t.project === p.id) t.project = ""; }); S.projects.splice(S.projects.indexOf(p), 1); }
      persist(); render(); };
    document.body.appendChild(m); setTimeout(() => document.addEventListener("click", function h() { m.remove(); document.removeEventListener("click", h); }), 0);
  }


  // ===== Plan: rubber-band multi-select (mouse), drag the group between columns =====
  (function pkMarquee() {
    const root = $("vTasks"); let mq = null;
    const cards = () => [...root.querySelectorAll("li.pk-li")];
    const paint = () => cards().forEach((li) => li.classList.toggle("pk-sel", pkSel.has(li.dataset.id)));
    root.addEventListener("selectstart", (e) => { if (mq && mq.on) e.preventDefault(); });
    root.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || !matchMedia("(pointer: fine)").matches) return;
      if (e.target.closest("button, input, select, textarea, a, .pk-menu, .qinl")) return;
      const li = e.target.closest("li.pk-li");
      if (li) { if (e.metaKey || e.ctrlKey || e.shiftKey) { e.preventDefault(); pkSel.has(li.dataset.id) ? pkSel.delete(li.dataset.id) : pkSel.add(li.dataset.id); paint(); } return; }
      mq = { x0: e.clientX, y0: e.clientY, on: false, add: e.metaKey || e.ctrlKey || e.shiftKey, base: new Set(pkSel), el: null };
    });
    window.addEventListener("pointermove", (e) => {
      if (!mq) return;
      if (!mq.on) { if (Math.hypot(e.clientX - mq.x0, e.clientY - mq.y0) < 6) return; mq.on = true; mq.el = document.createElement("div"); mq.el.className = "pk-band"; document.body.appendChild(mq.el); }
      const x = Math.min(e.clientX, mq.x0), y = Math.min(e.clientY, mq.y0), w = Math.abs(e.clientX - mq.x0), h = Math.abs(e.clientY - mq.y0);
      Object.assign(mq.el.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      pkSel = mq.add ? new Set(mq.base) : new Set();
      cards().forEach((li) => { const r = li.getBoundingClientRect(); if (r.right > x && r.left < x + w && r.bottom > y && r.top < y + h) pkSel.add(li.dataset.id); });
      paint();
    });
    const end = () => { if (!mq) return; const was = mq.on; if (mq.el) mq.el.remove(); if (!was && !mq.add && pkSel.size) { pkSel.clear(); paint(); } mq = null; };
    window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && pkSel.size && view === "tasks" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName)) { pkSel.clear(); paint(); } });
  })();
