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
    if (e.code === "KeyN") { e.preventDefault(); if (view === "work") wOpenNewTask({}); else qaStart(view === "tasks" ? "today" : "today", view === "tasks" ? { zone: "plan:today" } : {}); return; }
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

  // ===== inline timer: the running task stays in its list as an open card; the time pill shows the countdown =====
  function tinAttach(li, t, key) {
    li.classList.add("trun");
    li.insertAdjacentHTML("beforeend", `<div class="tin" data-id="${esc(t.id)}" data-key="${esc(key)}"></div>`);
    setTimeout(() => { if (T) update(true); }, 0);
  }
  // timer tick: if the running task is visible in a list, hide the fullscreen timer and the mini bar
  function tinUpdate(f, txt, rem, mode) {
    const el = document.querySelector(`.tin[data-id="${T.id}"]`);
    $("timer").hidden = true; $("mini").hidden = !!el; document.body.classList.toggle("has-mini", !el);
    if (!el) { $("miniName").textContent = f ? f.t.name : "Задача"; $("miniTime").textContent = txt; $("miniTime").classList.toggle("paused", mode === "paused"); }
    return true;
  }

  // ===== "+" quick add window for Сегодня / Завтра / Дела =====
  let tdQaMin = 25;
  function qaInsert(t, lnP, opts) {
    if (lnP) { t.link = lnP.id; t.rel = opts.rel; t.where = lnP.where; t.project = t.project || lnP.project; lnP.lnOpen = true; const ks = S.tasks.filter((x) => x.link === lnP.id), pres = ks.filter((x) => x.rel === "pre"), posts = ks.filter((x) => x.rel !== "pre"); let at, after;
        const an = opts.anchor && opts.anchor !== lnP.id ? S.tasks.find((x) => x.id === opts.anchor) : null;
        if (an) { at = an; after = opts.side === "post"; }
        else if (opts.rel === "pre") { at = pres.length ? pres[pres.length - 1] : lnP; after = !!pres.length; }
        else { at = posts.length ? posts[0] : lnP; after = !posts.length; }
        S.tasks.splice(S.tasks.indexOf(at) + (after ? 1 : 0), 0, t); }
    else S.tasks.push(t);
  }

  // ===== ONE task-entry field: input + minutes pill (default 25, "10м" in the text wins) + parseQuick + qaInsert.
  // Hosts (top row, ghost card, day-mode popup) only decide where the field is shown.
  //   o: { cls, id, field, ph, min, text, onMin(v), onInput(v), onCommit(raw, min), onCancel(), onEmpty(), onBlur(), key(e) -> true if consumed }
  function qaField(o) {
    const w = document.createElement("div"); w.className = "qf " + (o.cls || "");
    w.innerHTML = `<input class="qf-in${o.field ? " field" : ""}" type="text" maxlength="140" autocomplete="off" aria-label="Новая задача"><button type="button" class="qf-m" aria-label="Время на задачу">▶ <b></b> мин</button>`;
    const inp = w.querySelector("input"), mb = w.querySelector(".qf-m"); let min = o.min || 25;
    if (o.id) inp.id = o.id; if (o.ph) inp.placeholder = o.ph; inp.value = o.text || "";
    const paint = () => { mb.querySelector("b").textContent = min; };
    paint();
    const focus = () => { inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch {} };
    mb.onpointerdown = (e) => e.preventDefault();
    mb.onclick = () => {
      const n = document.createElement("input"); n.type = "number"; n.min = 1; n.max = 240; n.value = min; n.className = "qf-n"; n.setAttribute("aria-label", "Минуты");
      mb.replaceWith(n); n.focus(); n.select(); let fin = false;
      const back = () => { if (fin) return; fin = true; min = Math.max(1, Math.min(240, Math.round(+n.value) || min)); if (o.onMin) o.onMin(min); paint(); if (n.isConnected) n.replaceWith(mb); inp.focus(); };
      n.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); back(); } };
      n.onblur = () => { if (n.isConnected) back(); };
    };
    inp.oninput = () => { if (o.onInput) o.onInput(inp.value); };
    inp.onkeydown = (e) => {
      e.stopPropagation();
      if (o.key && o.key(e)) return;
      if (e.key === "Escape") { if (o.onCancel) { e.preventDefault(); o.onCancel(); } }
      else if (e.key === "Enter") { e.preventDefault(); const raw = inp.value.trim(); if (!raw) { if (o.onEmpty) o.onEmpty(); return; } o.onCommit(raw, min); }
    };
    if (o.onBlur) inp.onblur = () => o.onBlur(inp, w);
    return { el: w, input: inp, focus, reset() { min = 25; paint(); inp.value = ""; } };
  }
  // build + insert a task from the typed text. ctx: { zone, key, opts }; zone = "top" | "pop" | "today" | "link" | "plan:<col>"
  function qaMake(raw, min, ctx) {
    const { zone, key, opts } = ctx, q = parseQuick(raw), lnP = opts.link ? S.tasks.find((x) => x.id === opts.link) : null;
    const where0 = zone === "link" ? (lnP ? lnP.where : "today") : zone === "plan:tomorrow" ? "tomorrow" : zone === "plan:week" ? "backlog" : zone === "pop" ? key : "today";
    const t = { id: uid(), name: q.name, min: q.min ?? min ?? 25, done: false, spent: 0, note: "", project: q.project ?? (lnP ? lnP.project : filterProject !== "all" ? filterProject : ""), where: q.where || where0, sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: zone === "plan:week" && !q.where ? addDays(dayISO(), 6) : "", at: q.at || "" };
    qaInsert(t, lnP, opts); pullDue(); persist(); return t;
  }

  // ===== where the field lives: a ghost card in the list (Enter adds and opens the next one, Esc/empty Enter finishes) =====
  let qaInl = null;   // { zone, key, opts, text, min }
  function qaStart(key, opts = {}) {
    const zone = opts.link ? "link" : opts.zone || (view === "today" && document.querySelector("#vToday ul.td-list") ? "today" : null);
    if (!zone) return qaPop(key, opts);
    qaInl = { zone, key, opts: { ...opts }, text: "", min: 25 }; render();
  }
  function qaInlMount() {
    if (!qaInl) return;
    const { zone, opts } = qaInl; let host = null, ref = null, before = false;
    if (zone === "link") {
      const aid = opts.anchor || opts.link; ref = document.querySelector(`li.task[data-id="${aid}"]`); before = opts.side === "pre" || (!opts.anchor && opts.rel === "pre");
      if (!ref) { qaInl = null; return; }
    } else if (zone === "today") host = [...document.querySelectorAll("#vToday ul.td-list")].pop();
    else host = document.querySelector(`.pk-col[data-k="${zone.slice(5)}"] ul.pk-ul`);
    if (!host && !ref) { qaInl = null; return; }
    const li = document.createElement("li"); li.className = "qinl" + (zone === "link" ? " qinl-lnc" : "");
    li.innerHTML = `<span class="qinl-c" aria-hidden="true"></span>`;
    const done = () => { qaInl = null; li.remove(); };
    const f = qaField({ cls: "qf-ghost", id: "qinlIn", min: qaInl.min, text: qaInl.text,
      onMin: (v) => { qaInl.min = v; }, onInput: (v) => { qaInl.text = v; },
      onCancel: done, onEmpty: done,
      onCommit: (raw, min) => {
        const t = qaMake(raw, min, qaInl);
        if (zone === "link" && opts.side !== "pre" && opts.rel !== "pre") opts.anchor = t.id;   // next "after" goes below the one just added
        qaInl.text = ""; qaInl.min = 25; render();
      },
      onBlur: (inp) => setTimeout(() => { if (qaInl && !inp.value.trim() && !li.contains(document.activeElement) && li.isConnected) done(); }, 150) });
    li.appendChild(f.el);
    if (ref) ref.insertAdjacentElement(before ? "beforebegin" : "afterend", li); else host.appendChild(li);
    setTimeout(() => { if (li.isConnected) { f.focus(); li.scrollIntoView({ block: "nearest" }); } }, 0);
  }

  // ===== ...or a small window with the same field (Day mode, where there is no list to put a ghost card in) =====
  function qaPop(key, opts = {}) {
    if ($("qa")) return;
    const lnP = opts.link ? S.tasks.find((x) => x.id === opts.link) : null;
    const title = lnP ? (opts.rel === "pre" ? "перед «" : "после «") + lnP.name + "»" : ({ today: "Сегодня", tomorrow: "Завтра", backlog: "Дела" }[key] || "");
    const bg = document.createElement("div"); bg.id = "qa";
    bg.innerHTML = `<div class="qa" role="dialog" aria-label="Новая задача"><div class="qa-h"><b>Новая задача</b><span>${esc(title)}</span><button type="button" class="qa-x" aria-label="Закрыть">×</button></div><div class="qa-hint">Можно писать прямо в названии: «18:10 10м #дом»</div></div>`;
    const esc0 = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
    const close = () => { bg.remove(); document.removeEventListener("keydown", esc0, true); };
    const f = qaField({ cls: "qf-pop", id: "qaIn", field: true, onCancel: close, onCommit: (raw, min) => { qaMake(raw, min, { zone: "pop", key, opts }); close(); render(); } });
    bg.querySelector(".qa").insertBefore(f.el, bg.querySelector(".qa-hint"));
    bg.querySelector(".qa-x").onclick = close; bg.onpointerdown = (e) => { if (e.target === bg) close(); };
    document.addEventListener("keydown", esc0, true);
    document.body.appendChild(bg); setTimeout(() => f.focus(), 0);
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
    if (back) mk(`Взять из дел (${back}) →`, () => { tdPop = false; view = "tasks"; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); });
    mk("Заметки для Claude", () => { tdPop = false; render(); notesOpen(); });
    mk("Экспорт всех данных", () => { tdPop = false; render(); exportAll(); }, "expAll");
    mk("Баг / правка", () => { tdPop = false; render(); bugOpen(); });
    mk("Бета V2 →", () => { location.href = "v2/index.html"; }, "betaV2");
    if (window.lifeosLogout) mk("Выйти из аккаунта", () => window.lifeosLogout());
    p.appendChild(acts);
    return p;
  }
  function renderToday2() {
    const el = $("vToday"); el.innerHTML = "";
    const today = dayISO();
    const page = document.createElement("div"); page.className = "tday";
    workTaskSync(); if (planSync()) persist();
    const items = itemsOf("today").filter(kmatch), dn = items.filter((t) => t.done).length, left = items.filter((t) => !t.done).reduce((s, t) => s + (t.min || 0), 0);
    const head = document.createElement("div"); head.className = "td-h";
    head.innerHTML = `<div><h1 class="td-t">Сегодня</h1><div class="td-s">${items.length ? dn + " из " + items.length : "Пока пусто"}${left ? " · осталось " + tdMin(left) : ""}</div></div>
      <div class="td-ctl">${fMode ? "" : `<button class="td-core" aria-pressed="${coreShow}" title="Утро, еда, зал и вечер: показать или скрыть">LifeCore</button>${doneCount() ? `<button class="td-core td-clr" id="clearDone" title="Убрать завершённые из списка">✓ Убрать (${doneCount()})</button>` : ""}<div class="seg sm td-seg" role="group" aria-label="Вид"><button data-tm="list" aria-pressed="${todayMode === "list"}">Список</button><button data-tm="cal" aria-pressed="${todayMode === "cal"}">День</button></div>`}<button class="td-gear" aria-label="Вид и фильтры" aria-expanded="${tdPop}">${GEAR}</button></div>`;
    head.querySelectorAll("[data-tm]").forEach((b) => b.onclick = () => { const m = b.dataset.tm; if (m === todayMode) return; if (m === "list") reorderToday(); todayMode = m; saveUI(); render(); });
    { const cb = head.querySelector(".td-core:not(.td-clr)"); if (cb) cb.onclick = () => { coreShow = !coreShow; saveUI(); render(); }; const cc = head.querySelector("#clearDone"); if (cc) cc.onclick = () => clearDone(); }
    head.querySelector(".td-gear").onclick = (e) => { e.stopPropagation(); tdPop = !tdPop; render(); };
    page.appendChild(head);
    if (!fMode) page.appendChild(tdTriSeg(todayMode));
    let qfEl = null;
    if (!fMode) {
      const qf = document.createElement("div"); qf.className = "td-qa";
      let sug = null, sel = 0, hits = [];
      const shut = () => { if (sug) sug.remove(); sug = null; hits = []; };
      const refocus = () => setTimeout(() => { const n = $("tdQa"); if (n) n.focus(); }, 0);
      const fld = qaField({ cls: "qf-top", id: "tdQa", field: true, ph: "Добавить задачу…", min: tdQaMin, onMin: (v) => { tdQaMin = v; },
        key: (e) => { if (!sug) return false; if (e.key === "Escape") { shut(); return true; } if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length; [...sug.children].forEach((x, i) => x.classList.toggle("on", i === sel)); return true; } if (e.key === "Tab" || (e.key === "Enter" && tplKey(fld.input.value) === tplKey(hits[sel].name))) { e.preventDefault(); take(hits[sel]); return true; } return false; },
        onCommit: (raw, min) => { qaMake(raw, min, { zone: "top", key: "today", opts: {} }); tdQaMin = 25; render(); refocus(); } });
      const take = (tp) => { shut(); fld.input.value = ""; tplTake(tp, "today"); refocus(); };
      fld.input.addEventListener("input", () => { shut(); hits = tplFind(fld.input.value); if (!hits.length) return; sel = 0;
        sug = document.createElement("div"); sug.className = "tp-sug";
        hits.forEach((tp, i) => { const b = document.createElement("button"); b.type = "button"; b.className = i === sel ? "on" : ""; b.innerHTML = `Взять сценарий «${esc(tp.name)}»<em>${tp.items.length} · ${tp.mode === "check" ? "чеклист" : "подзадачи"}</em>`; b.onpointerdown = (e) => { e.preventDefault(); take(tp); }; sug.appendChild(b); });
        qf.appendChild(sug); });
      fld.input.addEventListener("blur", () => setTimeout(shut, 150));
      qf.appendChild(fld.el);
      qfEl = qf;
    }
    if (tdPop) { const p = tdPopEl(); head.appendChild(p); setTimeout(() => document.addEventListener("pointerdown", function cl(ev) { if (!ev.target.closest(".td-pop, .td-gear")) { tdPop = false; document.removeEventListener("pointerdown", cl); const pp = document.querySelector(".td-pop"); if (pp) pp.remove(); const gb = document.querySelector(".td-gear"); if (gb) gb.setAttribute("aria-expanded", "false"); } else if (!document.querySelector(".td-pop")) document.removeEventListener("pointerdown", cl); }), 0); }
    if (fMode) { const fb = document.createElement("div"); renderFocus(fb); page.appendChild(fb); el.appendChild(page); return; }
    const coreRun = (k) => coreShow || !!(T && !T.work && S.routines[k].some((x) => x.id === T.id));
    if (S.routines.morning.length && coreRun("morning") && S.day.evening !== today && !S.routines.morning.every((t) => t.done)) page.appendChild(tdGroup("morning", today));
    if (todayMode === "cal") { calSel = dayISO(); const box = document.createElement("div"); box.className = "sub"; renderDay(box, { embedded: true }); page.appendChild(box); }
    else { const ul = renderList("today", "Пусто. Нажми «+», чтобы добавить задачу."); ul.classList.add("td-list"); page.appendChild(ul); }
    if (qfEl) page.appendChild(qfEl);
    { const hh = hiddenHint("today"); if (hh) page.appendChild(hh); }
    if (S.routines.evening.length && coreRun("evening")) page.appendChild(tdGroup("evening", today));
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
    if (!f) { f = document.createElement("button"); f.id = "fab"; f.setAttribute("aria-label", "Добавить задачу"); f.title = "Добавить задачу (N)"; f.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'; f.onclick = () => qaStart(view === "tasks" ? "today" : "today", view === "tasks" ? { zone: "plan:today" } : {}); document.body.appendChild(f); }
    f.hidden = !(view === "today" || view === "tasks");
  }

  // "Поработать": one task in Today whose time = sum of estimates of work tasks in To do / In progress
  function workTaskSync() {
    const sum = S.work.tasks.filter((t) => (t.status === "todo" || t.status === "doing")).reduce((a, t) => a + (t.est || 0), 0);
    let w = S.tasks.find((t) => t.id === "work-auto");
    const n = S.work.tasks.filter((t) => t.status === "todo" || t.status === "doing").length;
    if (S.workAutoOff === dayISO()) { if (w) { S.tasks.splice(S.tasks.indexOf(w), 1); persist(); } return; }
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
      b.onclick = (e) => { e.stopPropagation(); e.preventDefault(); qaStart(t.where, { link: t.link || t.id, rel, anchor: t.id, side }); };
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
  function tdMenuAt(btn, rows) {
    const old = $("wmenu"); if (old) old.remove();
    const m = document.createElement("div"); m.id = "wmenu"; m.className = "wmenu"; m.setAttribute("role", "menu");
    rows.forEach(([l, fn, cls]) => { const b = document.createElement("button"); b.textContent = l; if (cls) b.className = cls; b.setAttribute("role", "menuitem"); b.onclick = (ev) => { ev.stopPropagation(); m.remove(); fn(); }; m.appendChild(b); });
    document.body.appendChild(m); const r = btn.getBoundingClientRect(), mr = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(r.left, innerWidth - mr.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(r.bottom + 6, innerHeight - mr.height - 8)) + "px";
    const close = (ev) => { if (ev.type === "keydown" && ev.key !== "Escape") return; if (ev.type === "pointerdown" && m.contains(ev.target)) return; m.remove(); document.removeEventListener("pointerdown", close, true); document.removeEventListener("keydown", close, true); };
    setTimeout(() => { document.addEventListener("pointerdown", close, true); document.addEventListener("keydown", close, true); }, 0);
  }
  const TDI = { cal: '<path d="M5 6h14v13H5zM5 10h14M9 4v4M15 4v4"/>', clk: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', hg: '<path d="M7 4h10M7 20h10M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8s8 3 8 8"/>', tag: '<path d="M4 4h8l8 8-8 8-8-8z"/><circle cx="8.5" cy="8.5" r="1"/>', del: '<path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>' };
  function tdProps(box, t, key) {
    const row = document.createElement("div"); row.className = "tdx-props";
    const add = (ic, label, fn, cls) => { const b = document.createElement("button"); b.type = "button"; b.className = "tdx-pi" + (cls ? " " + cls : ""); b.title = label; b.setAttribute("aria-label", label); b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TDI[ic]}</svg>`; b.onclick = (e) => { e.stopPropagation(); fn(b); }; row.appendChild(b); };
    const rout = isRoutine(key);
    if (!rout) {
      add("cal", "День", (b) => tdMenuAt(b, [["На сегодня", "today"], ["На завтра", "tomorrow"], ["В дела", "backlog"]].filter(([, k]) => k !== t.where).map(([l, k]) => [l, () => { moveTask(t, k); tdOpen = null; persist(); render(); }])));
      add("clk", "Время начала", (b) => tdMenuAt(b, [...["09:00", "12:00", "15:00", "18:00", "20:00"].map((v) => [v, () => { t.at = v; persist(); render(); }]), ...(t.at ? [["Убрать время", () => { t.at = ""; persist(); render(); }]] : [])]));
    }
    add("hg", "Минуты", (b) => tdMenuAt(b, [5, 10, 15, 20, 30, 45, 60].map((v) => [v + " мин", () => { t.min = v; persist(); render(); }])));
    if (!rout) add("tag", "Департамент", (b) => tdMenuAt(b, [["Без проекта", () => { t.project = ""; persist(); render(); }], ...S.projects.filter((p) => !p.archived && p.kind !== "work").map((p) => [p.name, () => { t.project = p.id; persist(); render(); }])]));
    add("del", "Удалить", () => { tdOpen = null; if (rout) { const a = S.routines[key], i = a.indexOf(t); if (i >= 0) a.splice(i, 1); persist(); render(); } else deleteTask(t); }, "d");
    box.appendChild(row);
  }
  function tdExpand(li, t, key) {
    li.classList.add("tdopen");
    const box = document.createElement("div"); box.className = "tin tdx tdx2";
    if (!isRoutine(key)) tdCheckBox(box, t);
    tdProps(box, t, key);
    li.appendChild(box);
  }
  const tdFmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  setInterval(() => {
    if (!T || T.work) return;
    const li = document.querySelector(`li.task[data-id="${T.id}"]`), m = li && li.querySelector(".go .mins:not(.mins-add)"); if (!m) return;
    const go = m.parentElement, ex = go.querySelector(".mins-add");
    if (T.finished && !ex) { const a = document.createElement("button"); a.type = "button"; a.className = "mins mins-add"; a.textContent = "+5 мин"; a.title = "Добавить время"; go.insertBefore(a, m); }
    else if (!T.finished && ex) ex.remove();
    if (T.finished) { m.classList.add("live"); m.classList.remove("paused"); const h = "Готово ✓"; if (m.dataset.h !== h) { m.dataset.h = h; m.textContent = h; m.title = "Время вышло: нажми, чтобы завершить"; } return; }
    const run = T.endsAt != null; m.classList.add("live"); m.classList.toggle("paused", !run);
    const h = `${run ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>' : (typeof I !== "undefined" ? I.play : "▶")}${tdFmt(remaining())}`;
    if (m.dataset.h !== h) { m.dataset.h = h; m.innerHTML = h; }
  }, 300);
  document.addEventListener("click", (e) => {
    const ad = e.target.closest("li.task .mins-add"); if (ad && T && !T.work) { e.preventDefault(); e.stopPropagation(); addTime(5); return; }
    const m = e.target.closest("li.task .mins.live"); if (!m || !T || T.work) return;
    e.preventDefault(); e.stopPropagation(); if (T.finished) finish(true); else if (T.endsAt != null) pause(); else resume();
  }, true);

  document.addEventListener("click", (e) => {
    if ((view !== "today" && view !== "tasks") || !(tdOpen || (T && !T.work && tdHideRun !== T.id && document.querySelector("li.trun")))) return;
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
    if (!rout && !t.link && !done) { hr(); it("＋ Задача до", () => qaStart(t.where, { link: t.id, rel: "pre" })); it("＋ Задача после", () => qaStart(t.where, { link: t.id, rel: "post" })); if (lnKids(t).length) it(t.lnOpen ? "Скрыть связанные" : "Показать связанные", () => { t.lnOpen = !t.lnOpen; persist(); render(); }); }
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

