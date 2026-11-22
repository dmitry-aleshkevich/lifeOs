  // ---------- lists ----------
  const isRoutine = (key) => key === "morning" || key === "evening";
  const itemsOf = (key) => isRoutine(key) ? S.routines[key] : S.tasks.filter((t) => t.where === key);
  function findItem(id) {
    for (const k of ["morning", "evening"]) { const t = S.routines[k].find((x) => x.id === id); if (t) return { t, key: k }; }
    const t = S.tasks.find((x) => x.id === id);
    if (t) return { t, key: t.where };
    const w = S.work.tasks.find((x) => x.id === id);
    return w ? { t: w, key: "work", work: true } : null;
  }
  function moveTask(t, toKey, toIndex) {
    if (!t.link) S.tasks.filter((k) => k.link === t.id && !k.done).forEach((k) => { k.where = toKey; });
    S.tasks.splice(S.tasks.indexOf(t), 1);
    const tgt = S.tasks.filter((x) => x.where === toKey);
    t.where = toKey;
    if (toIndex == null || toIndex >= tgt.length) {
      if (tgt.length) S.tasks.splice(S.tasks.indexOf(tgt[tgt.length - 1]) + 1, 0, t); else S.tasks.push(t);
    } else S.tasks.splice(S.tasks.indexOf(tgt[toIndex]), 0, t);
  }
  function spentPill(t) {
    if (t.sessions > 0) return `<span class="spent neutral" title="Всего ушло">${t.sessions + 1} сес. · ${durShort(t.spent)}</span>`;
    const plan = t.min * 60000, over = t.spent > plan + 30000;
    let label;
    if (t.spent < 60000) label = Math.max(1, Math.round(t.spent / 1000)) + " с";
    else { let m = Math.max(1, Math.round(t.spent / 60000)); if (!over) m = Math.min(m, t.min); label = m + " мин"; }
    return `<span class="spent ${over ? "over" : "good"}" title="Ушло ${label} из ${t.min} мин">${label}</span>`;
  }
  function projectOptions(sel, withNone = true) {
    return (withNone ? `<option value="">Без проекта</option>` : "") + S.projects.map((p) => `<option value="${esc(p.id)}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  }
  function pchip(pid) { const p = proj(pid); return p ? `<span class="pchip pc-${p.color}">${esc(p.name)}</span>` : ""; }

  function renderRow(t, key) {
    const li = document.createElement("li");
    li.className = "task" + (t.done ? " done" : "") + (editing ? "" : " live");
    li.dataset.id = t.id;
    const isTask = !isRoutine(key);
    if (!editing) {
      const meta = [isTask ? pchip(t.project) : "", t.note ? `<span class="note">${esc(t.note)}</span>` : "", isTask && t.sessions && !t.done ? `<span class="sess">${t.sessions} сес. · ${durShort(t.acc)}</span>` : ""].filter(Boolean).join("");
      const atc = isTask && t.at && !t.done ? `<span class="atc">${t.at}</span>` : "";
      const right = atc + (t.done && t.spent && t.min ? spentPill(t) : (t.min ? `<span class="mins">${I.play}${t.min} мин</span>` : ""));
      li.innerHTML = `<button class="check" aria-label="Отметить" aria-pressed="${t.done}">${I.check}</button><button class="go"><span class="txt"><span class="name">${esc(t.name)}</span>${meta ? `<span class="meta">${meta}</span>` : ""}</span>${right}</button>`;
      const toggle = () => { t.done = !t.done; t.spent = 0; if (isTask) t.doneAt = t.done ? Date.now() : 0; persist(); render(); if (t.done) maybeCloseDay(key); };
      li.querySelector(".check").onclick = toggle;
      li.querySelector(".go").onclick = (e) => { const nm = (tdOpen === t.id || (T && !T.work && T.id === t.id && tdHideRun !== t.id && !tdOpen)) ? tdNameHit(e) : null; if (nm) { e.stopPropagation(); return tdRename(nm, t); } if (t.min && e.target.closest(".mins")) { tdOpen = null; tdHideRun = null; return startTimer(t.id); } tdToggle(t); };

      if (isTask) {
        const x = document.createElement("button"); x.className = "xbtn"; x.setAttribute("aria-label", "Удалить"); x.innerHTML = XIC;
        x.onclick = (e) => { e.stopPropagation(); deleteTask(t); };
        li.appendChild(x);
      }
      if (T && !T.work && T.id === t.id && tdHideRun !== t.id && (!tdOpen || tdOpen === t.id)) { tinAttach(li, t, key); tdProps(li.querySelector(".tin"), t, key); }
      else if (tdOpen === t.id && !t.done) tdExpand(li, t, key);
    } else {
      li.innerHTML = `<div class="edit-row">
        <input type="text" class="nm" maxlength="90" aria-label="Название" id="nm-${t.id}" value="${esc(t.name)}">
        <div class="step"><button type="button" data-d="-1" aria-label="Меньше">−</button><span>${t.min ? t.min + " мин" : "чек"}</span><button type="button" data-d="1" aria-label="Больше">+</button></div>
        <button type="button" class="icon-btn handle" aria-label="Перетащить">${I.grip}</button>
        ${isTask ? `<select aria-label="Проект" id="pj-${t.id}">${projectOptions(t.project)}</select>
          <input type="date" class="due" aria-label="Дата" title="Дата: задача сама придёт в «Сегодня»" value="${esc(t.due || "")}">
          <input type="time" class="at" aria-label="Время начала" title="Время начала (для дня-расписания)" value="${esc(t.at || "")}">
          <button type="button" class="act" data-a="backlog">В дела</button><button type="button" class="act" data-a="wait">Жду</button>` : ""}
        <button type="button" class="icon-btn del" data-a="del" aria-label="Удалить">${I.del}</button>
        <input type="text" class="nt" maxlength="160" placeholder="Комментарий (необязательно)" aria-label="Комментарий" id="nt-${t.id}" value="${esc(t.note)}">
      </div>`;
      wireEdit(li, t, key);
    }
    return li;
  }
  function wireEdit(li, t, key) {
    const nm = li.querySelector(".nm"), nt = li.querySelector(".nt");
    nm.onchange = () => { const v = nm.value.trim(); if (v) { t.name = v; persist(); } else nm.value = t.name; };
    nt.onchange = () => { t.note = nt.value.trim(); persist(); };
    li.querySelectorAll(".step button").forEach((b) => b.onclick = () => {
      let m = t.min;
      if (+b.dataset.d > 0) m = m < 10 ? m + 1 : m + 5; else m = m <= 10 ? m - 1 : m - 5;
      t.min = Math.max(0, Math.min(240, m)); persist(); render();
    });
    const at = li.querySelector("input.at"); if (at) at.onchange = () => { t.at = at.value; persist(); render(); };
    const du = li.querySelector("input.due"); if (du) du.onchange = () => { t.due = du.value; pullDue(); persist(); render(); };
    const pj = li.querySelector("select"); if (pj) pj.onchange = () => { t.project = pj.value; persist(); render(); };
    const bl = li.querySelector('[data-a="backlog"]'); if (bl) bl.onclick = () => { t.done = false; moveTask(t, "backlog"); persist(); render(); };
    const wt = li.querySelector('[data-a="wait"]'); if (wt) wt.onclick = () => { t.done = false; t.waitUntil = t.waitUntil || addDays(dayISO(), 2); moveTask(t, "wait"); persist(); render(); };
    li.querySelector('[data-a="del"]').onclick = () => {
      if (isRoutine(key)) S.routines[key].splice(S.routines[key].indexOf(t), 1); else S.tasks.splice(S.tasks.indexOf(t), 1);
      persist(); render();
    };
  }
  // ===== Task card: the one task entity, shared by Today lists and the Plan kanban =====
  // renderRow builds the row (check, name, department, start time, time pill, ✕);
  // open/running states, checklist and property icons are added inside renderRow;
  // here: checklist counter and linked pre/post "+" decorations.
  function taskCard(t, key) {
    const li = renderRow(t, key); if (!isRoutine(key)) li.classList.add("tcard");
    if (t.check && t.check.length) { const nm = li.querySelector(".name"); if (nm) nm.insertAdjacentHTML("beforeend", `<span class="tdckn">${t.check.filter((c) => c.done).length}/${t.check.length} ✓</span>`); }
    if (!isRoutine(key) && !editing) lnDecor(li, t);
    return li;
  }
  // visible order: linked pre-tasks before their parent, post-tasks after; hidden when parent is collapsed
  const taskItems = (list) => lnOrder(list.filter((t) => !lnHidden(t)));
  function renderList(key, emptyText) {
    const ul = document.createElement("ul");
    ul.className = "tl"; ul._key = key;
    const filt = !isRoutine(key) && (hidden.size > 0 || !coreShow);
    const items = taskItems(itemsOf(key).filter((t) => !filt || kmatch(t)));
    if (!items.length) ul.innerHTML = `<li class="empty">${esc(filt && itemsOf(key).length ? "Всё скрыто фильтром." : emptyText)}</li>`;
    ul._ids = items.map((t) => t.id);
    items.forEach((t) => ul.appendChild(taskCard(t, key)));
    enableDrag(ul);
    return ul;
  }
  const sumLine = (items) => {
    const done = items.filter((t) => t.done).length, left = items.filter((t) => !t.done).reduce((s, t) => s + t.min, 0);
    return items.length ? `${done} из ${items.length}` + (left ? ` · осталось ${left} мин` : "") : "";
  };

