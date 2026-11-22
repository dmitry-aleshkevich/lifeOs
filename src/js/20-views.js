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
  function renderTodayOld() {
    const el = $("vToday"); el.innerHTML = "";
    if (fMode) { renderFocus(el); return; }
    const today = dayISO();
    const wrap = document.createElement("div"); wrap.className = "col"; wrap.appendChild(focusSeg());

    // week focus
    const wk = S.weeks.find((w) => w.start === mondayOf(today));
    if (wk) {
      const f = document.createElement("div"); f.className = "focus" + (focusOpen ? "" : " slim");
      f.innerHTML = `<div class="card-h"><span class="small-label">Фокус недели · <span style="color:var(--ink)">${esc(wk.focus)}</span></span><div class="hdr-right"></div></div><div class="focus-items"${focusOpen ? "" : " hidden"}></div>`;
      f.querySelector(".hdr-right").appendChild(foldBtn(focusOpen, "фокус недели", () => { focusOpen = !focusOpen; saveUI(); render(); }));
      const box = f.querySelector(".focus-items");
      (wk.items || []).forEach((it) => {
        const b = document.createElement("button");
        b.className = "fi" + (it.d ? " done" : "");
        b.innerHTML = (it.d ? I.check.replace('stroke-width="3.2"', 'stroke-width="3.2" width="12" height="12"') : "") + `<span>${esc(it.t)}</span>`;
        b.onclick = () => { it.d = !it.d; persist(); render(); };
        box.appendChild(b);
      });
      wrap.appendChild(f);
    }

    wrap.appendChild(kindBar());
    const cols = document.createElement("div"); cols.className = "cols";
    const left = document.createElement("div"); left.className = "col";
    const right = document.createElement("div"); right.className = "col";

    // routine block
    const evening = S.day.evening === today;
    const mItems = S.routines.morning;
    const morningDone = mItems.length && mItems.every((t) => t.done);
    if (evening) left.appendChild(routineCard("evening"));
    else if (!morningDone) left.appendChild(routineCard("morning"));
    else {
      const total = mItems.reduce((s, t) => s + (t.spent || 0), 0);
      const d = document.createElement("div"); d.className = "r-done";
      d.innerHTML = `${I.check}<span>Утро пройдено${total ? " · " + dur(total) + " по таймерам" : ""}</span>`;
      left.appendChild(d);
    }

    // habits
    const hc = document.createElement("div"); hc.className = "card" + (habitsOpen ? "" : " slim");
    const hs = S.habits.filter((h) => habitApplies(h, today));
    const hdone = hs.filter((h) => habitDone(h.id, today)).length;
    hc.innerHTML = `<div class="card-h"><h2 class="card-t">${I.repeat}Привычки</h2><div class="hdr-right"><span class="sum">${hdone} из ${hs.length}</span></div></div><div class="hchips"${habitsOpen ? "" : " hidden"}></div>`;
    hc.querySelector(".hdr-right").appendChild(foldBtn(habitsOpen, "привычки", () => { habitsOpen = !habitsOpen; saveUI(); render(); }));
    const hbox = hc.querySelector(".hchips");
    hs.forEach((h) => {
      const on = habitDone(h.id, today);
      const b = document.createElement("button");
      b.className = "hc" + (on ? " on" : "");
      b.innerHTML = (on ? I.check : "") + `<span>${esc(h.name)}</span>` + (h.auto && !on ? `<span class="auto">авто</span>` : "");
      b.title = h.auto === "wake" ? "Отмечается само, если начать утро до 9:15" : h.auto === "sleep" ? "Отмечается само, если закрыть день до 01:15" : "";
      b.onclick = () => { setHabit(h.id, today, !on); persist(); render(); };
      hbox.appendChild(b);
    });
    left.appendChild(hc);

    // today tasks
    const tc = document.createElement("div"); tc.className = "card";
    const tItems = itemsOf("today").filter(kmatch);
    tc.innerHTML = `<div class="card-h"><h2 class="card-t">${I.home}Сегодня</h2><span class="sum">${sumLine(tItems)}</span><div class="seg sm" role="group" aria-label="Вид"><button data-tm="list" aria-pressed="${todayMode === "list"}">Список</button><button data-tm="cal" aria-pressed="${todayMode === "cal"}">День</button></div><button class="act primary" id="startNow">Начать сейчас</button></div>`;
    tc.querySelectorAll("[data-tm]").forEach((b) => b.onclick = () => { const m = b.dataset.tm; if (m === todayMode) return; if (m === "list") reorderToday(); todayMode = m; saveUI(); render(); });
    tc.querySelector("#startNow").onclick = startNow;
    if (todayMode === "cal") { calSel = dayISO(); const box = document.createElement("div"); box.className = "sub"; renderDay(box, { embedded: true }); tc.appendChild(box); }
    else tc.appendChild(renderList("today", "Перетащи сюда задачи из «Завтра» или возьми из «Дел»."));
    { const hh = hiddenHint("today"); if (hh) tc.appendChild(hh); }
    { const n = doneCount(); if (n) { const cb = document.createElement("button"); cb.className = "link"; cb.style.alignSelf = "flex-start"; cb.id = "clearDone"; cb.textContent = "Очистить завершённые (" + n + ")"; cb.onclick = clearDone; tc.appendChild(cb); } }
    tc.appendChild(addForm("today", { placeholder: "Что сделать сегодня?" }));
    const back = S.tasks.filter((t) => t.where === "backlog").length;
    if (back) {
      const pk = document.createElement("button"); pk.className = "link accent"; pk.style.alignSelf = "flex-start";
      pk.textContent = `Взять из дел (${back}) →`;
      pk.onclick = () => { view = "tasks"; lsSet(LS_VIEW, view); render(); window.scrollTo({ top: 0 }); };
      tc.appendChild(pk);
    }
    left.appendChild(tc);

    if (!evening) {
      const ed = document.createElement("button"); ed.className = "end-day";
      ed.innerHTML = `${I.moon}<span>Пора завершать этот день</span>`;
      ed.onclick = () => { S.day.evening = today; persist(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      left.appendChild(ed);
    }

    // tomorrow
    const tm = document.createElement("div"); tm.className = "card";
    const mItemsT = itemsOf("tomorrow").filter(kmatch);
    tm.innerHTML = `<div class="card-h"><h2 class="card-t">${I.sun}Завтра</h2><span class="sum">${sumLine(mItemsT)}</span></div>`;
    tm.appendChild(renderList("tomorrow", "Накидай сюда дела на завтра."));
    { const hh = hiddenHint("tomorrow"); if (hh) tm.appendChild(hh); }
    tm.appendChild(addForm("tomorrow", { placeholder: "Что сделать завтра?" }));
    if (mItemsT.length) {
      const all = document.createElement("button"); all.className = "link"; all.style.alignSelf = "flex-start";
      all.textContent = "Перенести всё в «Сегодня»";
      all.onclick = () => { mItemsT.forEach((t) => moveTask(t, "today")); persist(); render(); };
      tm.appendChild(all);
    }
    right.appendChild(tm);

    // free-form notes for Claude
    const nc = document.createElement("div"); nc.className = "card";
    nc.innerHTML = `<div class="card-h"><h2 class="card-t">Заметки</h2><div class="hdr-right"><span class="sum" id="notesState">${S.notes ? "сохранено" : ""}</span><button class="act" id="notesClear">Очистить</button><button class="act primary" id="notesCopy">Скопировать</button></div></div>
      <textarea id="notesArea" class="notes" placeholder="Мысли и комментарии для Claude. Сохраняется само, с телефона и с компа."></textarea>`;
    const ta = nc.querySelector("textarea");
    ta.value = S.notes || "";
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.max(140, ta.scrollHeight + 2) + "px"; };
    const saveNotes = () => { clearTimeout(notesTimer); notesTimer = null; notesDirty = false; persist(); const st = $("notesState"); if (st) st.textContent = S.notes ? "сохранено" : ""; };
    ta.oninput = () => { S.notes = ta.value; notesDirty = true; $("notesState").textContent = "сохраняю…"; clearTimeout(notesTimer); notesTimer = setTimeout(saveNotes, 700); grow(); };
    ta.onblur = () => { if (notesDirty) saveNotes(); };
    nc.querySelector("#notesCopy").onclick = (e) => {
      const b = e.currentTarget, ok = () => { b.textContent = "Скопировано"; setTimeout(() => { b.textContent = "Скопировать"; }, 1500); };
      try { navigator.clipboard.writeText(ta.value).then(ok, () => { ta.focus(); ta.select(); }); } catch { ta.focus(); ta.select(); }
    };
    nc.querySelector("#notesClear").onclick = (e) => {
      const b = e.currentTarget;
      if (!S.notes) return;
      if (b.dataset.armed !== "1") { b.dataset.armed = "1"; b.textContent = "Точно очистить?"; b.style.color = "var(--danger)"; return; }
      S.notes = ""; notesDirty = false; persist(); render();
    };
    right.appendChild(nc);
    requestAnimationFrame(grow);

    cols.append(left, right);
    wrap.appendChild(cols);
    el.appendChild(wrap);
  }
  function routineCard(key) {
    const items = S.routines[key];
    const c = document.createElement("div"); c.className = "card routine " + key;
    const done = items.filter((t) => t.done).length;
    const left = items.filter((t) => !t.done).reduce((s, t) => s + t.min, 0);
    const open = key === "evening" || editing || morningOpen;
    if (!open) c.classList.add("slim");
    c.innerHTML = `<div class="card-h"><h2 class="card-t"><span class="r-ic ${key === "morning" ? "pc-orange" : "pc-violet"}">${key === "morning" ? I.sun : I.moon}</span>${key === "morning" ? "Утро" : "Вечер"}</h2>
      <span class="sum">${done} из ${items.length}${left ? " · осталось " + left + " мин" : ""}</span></div>
      <div class="bar" aria-hidden="true"><i style="width:${items.length ? done / items.length * 100 : 0}%"></i></div>`;
    if (key === "morning" && !editing) {
      const h = c.querySelector(".card-h"), wrapR = document.createElement("div");
      wrapR.className = "hdr-right"; wrapR.appendChild(h.querySelector(".sum"));
      wrapR.appendChild(foldBtn(open, "утро", () => { morningOpen = !open; saveUI(); render(); }));
      h.appendChild(wrapR);
    }
    if (open) {
      c.appendChild(renderList(key, "Добавь первый пункт рутины."));
      if (editing) c.appendChild(addForm(key, { placeholder: key === "morning" ? "Новый пункт утра" : "Новый пункт вечера" }));
    }
    const foot = document.createElement("div"); foot.className = "card-h";
    if (key === "evening") {
      const cancel = document.createElement("button"); cancel.className = "link"; cancel.textContent = "Ещё не вечер";
      cancel.onclick = () => { S.day.evening = null; persist(); render(); };
      const close = document.createElement("button"); close.className = "link accent"; close.textContent = "Закрыть день сейчас";
      close.onclick = closeDay;
      foot.append(cancel, close);
    }
    if (foot.children.length) c.appendChild(foot);
    return c;
  }

  function renderTasks() {
    if (true) { renderPlanKB(); return; }
    const el = $("vTasks"); el.innerHTML = "";
    const col = document.createElement("div"); col.className = "col"; col.style.maxWidth = "760px";

    const seg = document.createElement("div"); seg.className = "seg"; seg.setAttribute("role", "group");
    [["list", "Склад"], ["cal", "Месяц"], ["day", "День"]].forEach(([id, l]) => {
      const b = document.createElement("button"); b.textContent = l; b.setAttribute("aria-pressed", tasksMode === id);
      b.onclick = () => { if (id === "cal" && calSel) calMonth = calSel.slice(0, 7) + "-01"; tasksMode = id; saveUI(); render(); };
      seg.appendChild(b);
    });
    col.appendChild(seg);
    col.appendChild(kindBar());

    // project filter
    const fl = document.createElement("div"); fl.className = "filters";
    const mkF = (id, label, color) => {
      const b = document.createElement("button"); b.className = "chip"; b.setAttribute("aria-pressed", filterProject === id);
      const pr = proj(id), kn = pr ? (KINDS.find((k) => k[0] === pr.kind) || KINDS[0])[1] : "";
      b.innerHTML = (color ? `<span class="pchip pc-${color}" style="padding:0 6px">&nbsp;</span>` : "") + `<span>${esc(label)}</span>` + (editing && color ? `<span class="k" data-k="1" title="Тип проекта">${kn}</span><span class="x" data-x="1" aria-label="Удалить проект">×</span>` : "");
      b.onclick = (e) => {
        if (e.target.dataset.k) { const i = KIND_IDS.indexOf(pr.kind); pr.kind = KIND_IDS[(i + 1) % KIND_IDS.length]; persist(); render(); return; }
        if (e.target.dataset.x) {
          if (armedDel !== id) { armedDel = id; b.querySelector(".x").textContent = "удалить?"; return; }
          S.projects = S.projects.filter((p) => p.id !== id); S.tasks.forEach((t) => { if (t.project === id) t.project = ""; });
          armedDel = null; if (filterProject === id) filterProject = "all"; persist(); render(); return;
        }
        filterProject = id; render();
      };
      fl.appendChild(b);
    };
    mkF("all", "Все");
    S.projects.filter((p) => !hidden.has(p.kind)).forEach((p) => mkF(p.id, p.name, p.color));
    if (!hidden.has("other")) mkF("", "Без проекта");
    col.appendChild(fl);
    if (editing) {
      const pf = document.createElement("form"); pf.className = "add-row"; pf.autocomplete = "off";
      pf.innerHTML = `<input type="text" class="field" id="newProj" maxlength="30" placeholder="Новый проект" style="flex:1 1 200px"><select aria-label="Тип">${KINDS.map(([k, l]) => `<option value="${k}"${k === (onlyKind() || "work") ? " selected" : ""}>${l}</option>`).join("")}</select><button type="submit" class="pill-btn" style="margin-left:0">Добавить проект</button>`;
      pf.onsubmit = (e) => { e.preventDefault(); const v = pf.querySelector("input").value.trim(); if (!v) return;
        S.projects.push({ id: uid(), name: v, color: COLORS[S.projects.length % COLORS.length], kind: pf.querySelector("select").value }); persist(); render(); };
      col.appendChild(pf);
    }
    const match = tmatch;
    if (tasksMode === "cal" || tasksMode === "day") { (tasksMode === "cal" ? renderCalendar : renderDay)(col); el.appendChild(col); return; }

    // tomorrow (moved here from Today)
    const ac = document.createElement("div"); ac.className = "card";
    const tmI = itemsOf("tomorrow").filter(kmatch);
    ac.innerHTML = `<div class="card-h"><h2 class="card-t">${I.sun}Завтра</h2><span class="sum">${sumLine(tmI)}</span></div>`;
    ac.appendChild(renderList("tomorrow", "Дела на завтра. Добавь через «+» внизу."));
    if (tmI.length) { const all = document.createElement("button"); all.className = "link"; all.style.alignSelf = "flex-start"; all.textContent = "Перенести всё в «Сегодня»"; all.onclick = () => { tmI.forEach((t) => moveTask(t, "today")); persist(); render(); }; ac.appendChild(all); }
    col.appendChild(ac);

    // waiting
    const waits = S.tasks.filter((t) => t.where === "wait" && match(t));
    if (waits.length) {
      const wc = document.createElement("div"); wc.className = "card";
      wc.innerHTML = `<div class="card-h"><h2 class="card-t">Жду</h2><span class="sum">${waits.length}</span></div>`;
      const ul = document.createElement("ul"); ul.className = "tl";
      const today = dayISO();
      waits.forEach((t) => {
        const li = document.createElement("li"); li.className = "task";
        const late = t.waitUntil && t.waitUntil <= today;
        if (!editing) {
          li.innerHTML = `<div class="txt"><span class="name">${esc(t.name)}</span><span class="meta">${pchip(t.project)}${t.waitUntil ? `<span class="pchip ${late ? "pc-red" : "pc-gray"}">${late ? "пора напомнить" : "до " + fromISO(t.waitUntil).getDate() + "." + pad(fromISO(t.waitUntil).getMonth() + 1)}</span>` : ""}${t.note ? `<span class="note">${esc(t.note)}</span>` : ""}</span></div>
            <button class="act primary" data-a="today">Сегодня</button>`;
          li.querySelector('[data-a="today"]').onclick = () => { t.waitUntil = ""; moveTask(t, "today"); persist(); render(); };
          const wn = li.querySelector(".name"); wn.classList.add("ed"); wn.onclick = () => inlineEdit(li, t, wn);
        } else {
          li.innerHTML = `<div class="edit-row"><input type="text" class="nm" maxlength="90" value="${esc(t.name)}" aria-label="Название">
            <input type="date" value="${esc(t.waitUntil)}" aria-label="Напомнить"><button type="button" class="act" data-a="back">В дела</button>
            <button type="button" class="icon-btn del" data-a="del" aria-label="Удалить">${I.del}</button>
            <input type="text" class="nt" maxlength="160" placeholder="Чего жду и от кого" value="${esc(t.note)}" aria-label="Комментарий"></div>`;
          const nm = li.querySelector(".nm"), nt = li.querySelector(".nt"), dt = li.querySelector("input[type=date]");
          nm.onchange = () => { const v = nm.value.trim(); if (v) { t.name = v; persist(); } };
          nt.onchange = () => { t.note = nt.value.trim(); persist(); };
          dt.onchange = () => { t.waitUntil = dt.value; persist(); render(); };
          li.querySelector('[data-a="back"]').onclick = () => { t.waitUntil = ""; moveTask(t, "backlog"); persist(); render(); };
          li.querySelector('[data-a="del"]').onclick = () => { S.tasks.splice(S.tasks.indexOf(t), 1); persist(); render(); };
        }
        ul.appendChild(li);
      });
      wc.appendChild(ul); col.appendChild(wc);
    }

    // backlog grouped by project
    const groups = [...S.projects.filter((p) => !hidden.has(p.kind)).map((p) => ({ id: p.id, name: p.name, color: p.color })), ...(!hidden.has("other") ? [{ id: "", name: "Без проекта", color: "" }] : [])];
    let any = false;
    groups.forEach((g) => {
      if (filterProject !== "all" && filterProject !== g.id) return;
      const items = S.tasks.filter((t) => t.where === "backlog" && t.project === g.id);
      if (!items.length) return;
      any = true;
      const gc = document.createElement("div"); gc.className = "card";
      gc.innerHTML = `<div class="group-h">${g.color ? `<span class="pchip pc-${g.color}" style="font-size:13px;padding:4px 10px">${esc(g.name)}</span>` : `<span class="small-label">${esc(g.name)}</span>`}<span class="sum">${items.length} · ${items.reduce((s, t) => s + t.min, 0)} мин</span></div>`;
      const ul = document.createElement("ul"); ul.className = "tl";
      items.forEach((t) => {
        if (editing) { ul.appendChild(renderRow(t, "backlog")); return; }
        const li = document.createElement("li"); li.className = "task";
        li.innerHTML = `<div class="txt"><span class="name">${esc(t.name)}</span>${t.note || t.sessions || t.due ? `<span class="meta">${t.due ? `<span class="dchip">${shortDate(t.due)}</span>` : ""}${t.note ? `<span class="note">${esc(t.note)}</span>` : ""}${t.sessions ? `<span class="sess">${t.sessions} сес. · ${durShort(t.acc)}</span>` : ""}</span>` : ""}</div>
          ${t.min ? `<span class="sess">${t.min} мин</span>` : ""}
          <button class="act" data-a="tomorrow">Завтра</button><button class="act primary" data-a="today">Сегодня</button>`;
        const nmEl = li.querySelector(".name"); nmEl.classList.add("ed"); nmEl.title = "Нажми, чтобы изменить"; nmEl.onclick = () => inlineEdit(li, t, nmEl);
        li.querySelector('[data-a="today"]').onclick = () => { moveTask(t, "today"); persist(); render(); };
        li.querySelector('[data-a="tomorrow"]').onclick = () => { moveTask(t, "tomorrow"); persist(); render(); };
        ul.appendChild(li);
      });
      gc.appendChild(ul); col.appendChild(gc);
    });
    if (!any && !waits.length) {
      const e = document.createElement("div"); e.className = "empty";
      e.textContent = filterProject === "all" ? "Склад пуст. Добавь дело выше: сюда падает всё, что не на сегодня." : "В этом проекте пока нет дел.";
      col.appendChild(e);
    }
    el.appendChild(col);
  }

  function renderCalendar(col) {
    const today = dayISO(), tom = addDays(today, 1);
    if (!calMonth) calMonth = today.slice(0, 7) + "-01";
    if (!calSel) calSel = today;
    const tasksOn = tasksOnDay;
    const first = fromISO(calMonth);
    const card = document.createElement("div"); card.className = "card";
    const head = document.createElement("div"); head.className = "cal-h";
    const shift = (n) => { const d = fromISO(calMonth); d.setMonth(d.getMonth() + n); calMonth = isoOf(d); render(); };
    head.innerHTML = `<button class="act" data-n="-1" aria-label="Назад">‹</button><span class="t">${MONN[first.getMonth()]} ${first.getFullYear()}</span><button class="act" data-n="1" aria-label="Вперёд">›</button>`;
    head.querySelectorAll("[data-n]").forEach((b) => b.onclick = () => shift(+b.dataset.n));
    card.appendChild(head);
    const g = document.createElement("div"); g.className = "cal-g";
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((w) => { const d = document.createElement("div"); d.className = "wd"; d.textContent = w; g.appendChild(d); });
    let iso = mondayOf(isoOf(first));
    for (let i = 0; i < 42; i++) {
      const d = fromISO(iso), list = tasksOn(iso), b = document.createElement("button");
      b.className = "cal-d" + (d.getMonth() !== first.getMonth() ? " out" : "") + (iso === today ? " today" : "");
      b.setAttribute("aria-pressed", iso === calSel);
      const dots = list.length > 3 ? `<b>${list.length}</b>` : list.map((t) => `<i class="${t.done || t.where === "done" ? "dn" : ""}"></i>`).join("");
      b.innerHTML = `<span>${d.getDate()}</span><span class="cal-dots">${dots}</span>`;
      const at = iso; b.onclick = () => { calSel = at; render(); };
      g.appendChild(b);
      iso = addDays(iso, 1);
    }
    card.appendChild(g);
    const lnk = document.createElement("button"); lnk.className = "link"; lnk.style.alignSelf = "flex-start"; lnk.textContent = "К сегодняшнему дню";
    lnk.onclick = () => { calMonth = today.slice(0, 7) + "-01"; calSel = today; render(); };
    card.appendChild(lnk);
    col.appendChild(card);

    // day panel
    const day = fromISO(calSel), list = tasksOn(calSel);
    const dc = document.createElement("div"); dc.className = "card";
    dc.innerHTML = `<div class="card-h"><h2 class="card-t">${WDF[day.getDay()]}, ${day.getDate()} ${MON[day.getMonth()]}</h2><span class="sum">${list.length ? list.length + " · " + list.reduce((s, t) => s + t.min, 0) + " мин" : ""}</span><button class="act" id="openDay">Расписание</button></div>`;
    dc.querySelector("#openDay").onclick = () => { tasksMode = "day"; saveUI(); render(); };
    const ul = document.createElement("ul"); ul.className = "tl";
    if (!list.length) ul.innerHTML = `<li class="empty">На этот день пусто.</li>`;
    list.forEach((t) => {
      const li = document.createElement("li"); li.className = "task" + (t.done || t.where === "done" ? " done" : ""); li.dataset.id = t.id;
      li.innerHTML = `<div class="txt"><span class="name ed">${esc(t.name)}</span><span class="meta">${pchip(t.project)}${t.note ? `<span class="note">${esc(t.note)}</span>` : ""}${t.where === "wait" ? `<span class="pchip pc-gray">жду</span>` : ""}</span></div>${t.min ? `<span class="sess">${t.min} мин</span>` : ""}`;
      const nm = li.querySelector(".name"); nm.onclick = () => inlineEdit(li, t, nm);
      if (t.due === calSel && t.where === "backlog") {
        const x = document.createElement("button"); x.className = "act"; x.textContent = "Убрать дату";
        x.onclick = () => { t.due = ""; persist(); render(); }; li.appendChild(x);
      }
      ul.appendChild(li);
    });
    dc.appendChild(ul);
    if (calSel >= today) {
      const f = document.createElement("form"); f.className = "add"; f.autocomplete = "off";
      f.innerHTML = `<input type="text" id="cal-in" maxlength="90" placeholder="Что сделать в этот день?">
        <div class="add-row"><select aria-label="Минуты" id="cal-min">${[5, 10, 15, 25, 30, 45, 60, 90].map((m) => `<option value="${m}"${m === 25 ? " selected" : ""}>${m} мин</option>`).join("")}</select>
        <select aria-label="Проект" id="cal-pj">${projectOptions(S.projects.find((p) => onlyKind() && p.kind === onlyKind())?.id || "")}</select>
        <button type="submit" class="pill-btn">Добавить</button></div>`;
      const inp = f.querySelector("#cal-in"), btn = f.querySelector(".pill-btn");
      inp.value = drafts.cal || ""; btn.disabled = !inp.value.trim();
      inp.oninput = () => { drafts.cal = inp.value; btn.disabled = !inp.value.trim(); };
      f.onsubmit = (e) => {
        e.preventDefault(); const v = inp.value.trim(); if (!v) return;
        S.tasks.push({ id: uid(), name: v, min: +f.querySelector("#cal-min").value, done: false, spent: 0, note: "", project: f.querySelector("#cal-pj").value, where: "backlog", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: calSel });
        drafts.cal = ""; pullDue(); persist(); render();
      };
      dc.appendChild(f);
      const pool = S.tasks.filter((t) => t.where === "backlog" && !t.due && tmatch(t));
      if (pool.length) {
        const sel = document.createElement("select"); sel.setAttribute("aria-label", "Из склада"); sel.className = "field";
        sel.innerHTML = `<option value="">Взять из склада (${pool.length})…</option>` + pool.map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("");
        sel.onchange = () => { const t = S.tasks.find((x) => x.id === sel.value); if (t) { t.due = calSel; pullDue(); persist(); render(); } };
        dc.appendChild(sel);
      }
    }
    col.appendChild(dc);
  }

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

