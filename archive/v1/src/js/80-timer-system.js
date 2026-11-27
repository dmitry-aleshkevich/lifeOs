  // ---------- drag: long-press on touch, grab-and-move with a mouse ----------
  let drag = null, suppressClick = false;
  document.addEventListener("click", (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  function enableDrag(ul) {
    ul.addEventListener("contextmenu", (e) => { if (e.target.closest("li.task.live")) e.preventDefault(); });
    ul.addEventListener("touchmove", (e) => { if (drag && drag.active) e.preventDefault(); }, { passive: false });
    ul.addEventListener("pointerdown", (e) => {
      if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
      const li = e.target.closest("li.task"); if (!li || !li.dataset.id) return;
      const handle = e.target.closest(".handle");
      if (!handle && (editing || e.target.closest("input, select"))) return;
      drag = { ul, li, pid: e.pointerId, sx: e.clientX, sy: e.clientY, px: e.clientX, py: e.clientY, y0: e.clientY + window.scrollY, active: false, timer: null, raf: 0, mouse: e.pointerType === "mouse" };
      if (handle) { e.preventDefault(); beginDrag(); }
      else if (drag.mouse) e.preventDefault();
      else drag.timer = setTimeout(beginDrag, 380);
    });
  }
  function beginDrag() {
    if (!drag) return;
    const sy = window.scrollY, key = drag.ul._key;
    const cands = isRoutine(key) ? [drag.ul] : [...document.querySelectorAll("ul.tl")].filter((u) => u._key === "today" || u._key === "tomorrow");
    drag.zones = cands.filter((u) => u.getBoundingClientRect().width > 0).map((u) => {
      const items = [...u.querySelectorAll(":scope > li.task")], ur = u.getBoundingClientRect();
      return { ul: u, key: u._key, items, left: ur.left, right: ur.right, top: ur.top + sy, bottom: ur.bottom + sy, rects: items.map((el) => { const r = el.getBoundingClientRect(); return { top: r.top + sy, h: r.height }; }) };
    });
    drag.src = drag.zones.find((z) => z.ul === drag.ul);
    if (!drag.src) { drag = null; return; }
    drag.from = drag.to = drag.src.items.indexOf(drag.li);
    drag.target = drag.src; drag.multi = drag.zones.length > 1; drag.active = true;
    suppressClick = true;
    drag.li.classList.add("dragging");
    document.body.style.userSelect = "none"; document.body.style.cursor = "grabbing";
    try { navigator.vibrate && navigator.vibrate(12); } catch {}
    const loop = () => {
      if (!drag || !drag.active) return;
      const edge = 70, H = window.innerHeight;
      if (drag.py < edge) window.scrollBy(0, -Math.ceil((edge - drag.py) / 6));
      else if (drag.py > H - edge) window.scrollBy(0, Math.ceil((drag.py - (H - edge)) / 6));
      layoutDrag(); drag.raf = requestAnimationFrame(loop);
    };
    layoutDrag(); drag.raf = requestAnimationFrame(loop);
  }
  function layoutDrag() {
    const d = drag, src = d.src, r = src.rects[d.from], sy = window.scrollY;
    const dy = d.py + sy - d.y0, dx = d.multi ? d.px - d.sx : 0;
    d.li.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`;
    const center = r.top + r.h / 2 + dy, shift = r.h + 8, ppy = d.py + sy;
    let tgt = src;
    if (d.multi) for (const z of d.zones) if (z !== src && d.px >= z.left - 16 && d.px <= z.right + 16 && ppy >= z.top - 40 && ppy <= z.bottom + 40) tgt = z;
    let to;
    if (tgt === src) {
      to = d.from;
      src.rects.forEach((rr, i) => {
        if (i === d.from) return;
        const mid = rr.top + rr.h / 2; let t = 0;
        if (i > d.from && center > mid) { t = -shift; to = Math.max(to, i); }
        if (i < d.from && center < mid) { t = shift; to = Math.min(to, i); }
        src.items[i].style.transform = t ? `translateY(${t}px)` : "";
      });
    } else {
      src.items.forEach((el, i) => { if (i !== d.from) el.style.transform = i > d.from ? `translateY(${-shift}px)` : ""; });
      to = tgt.rects.filter((rr) => rr.top + rr.h / 2 < ppy).length;
    }
    for (const z of d.zones) {
      if (z !== src) z.items.forEach((el, i) => { el.style.transform = z === tgt && i >= to ? `translateY(${shift}px)` : ""; });
      z.ul.classList.toggle("drop-target", z !== src && z === tgt);
    }
    d.target = tgt; d.to = to;
  }
  function endDrag() {
    if (!drag) return;
    const d = drag; drag = null;
    clearTimeout(d.timer); cancelAnimationFrame(d.raf);
    document.body.style.userSelect = ""; document.body.style.cursor = "";
    if (!d.active) return;
    const key = d.src.key;
    const item = isRoutine(key) ? itemsOf(key)[d.from] : findItem(d.li.dataset.id)?.t;
    if (item) {
      if (isRoutine(key)) { if (d.to !== d.from) { const arr = S.routines[key]; arr.splice(d.from, 1); arr.splice(d.to, 0, item); persist(); } }
      else if (!(d.target === d.src && d.to === d.from)) {
        const tk = d.target.key;
        const vis = (d.target.ul._ids || []).filter((x) => x !== item.id);
        const full = itemsOf(tk).filter((x) => x !== item);
        const before = d.to < vis.length ? full.indexOf(S.tasks.find((x) => x.id === vis[d.to])) : -1;
        if (d.target !== d.src) { item.done = false; item.spent = 0; }
        moveTask(item, tk, before >= 0 ? before : null);
        persist();
      }
    }
    render();
    setTimeout(() => { suppressClick = false; }, 60);
  }
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.active) {
      const dist = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      if (drag.mouse) { if (dist > 5) { drag.px = e.clientX; drag.py = e.clientY; beginDrag(); } }
      else if (dist > 8) endDrag();
      return;
    }
    drag.px = e.clientX; drag.py = e.clientY; e.preventDefault();
  }, { passive: false });
  window.addEventListener("pointerup", (e) => { if (drag && e.pointerId === drag.pid) endDrag(); });
  window.addEventListener("pointercancel", (e) => { if (drag && e.pointerId === drag.pid) endDrag(); });

  // ---------- sound: GM-style door chime ----------
  const chime = new Audio(makeChime()); chime.preload = "auto";
  let unlocked = false, ringTimer = null, rings = 0;
  function makeChime() {
    const sr = 22050, gap = 0.55, count = 6, n = Math.floor(sr * gap * count), data = new Float32Array(n), f = 830;
    for (let k = 0; k < count; k++) {
      const s0 = Math.floor(k * gap * sr);
      for (let i = s0; i < n; i++) {
        const t = (i - s0) / sr; if (t > 0.6) break;
        const env = Math.min(1, t / 0.003) * Math.exp(-t / 0.15);
        data[i] += env * (0.7 * Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t / 0.06) + 0.07 * Math.sin(2 * Math.PI * f * 3 * t) * Math.exp(-t / 0.04));
      }
    }
    const buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i] * 0.8)) * 32767, true);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  function unlockSound() {
    if (unlocked) return;
    chime.muted = true;
    const p = chime.play();
    if (p && p.then) p.then(() => { chime.pause(); chime.currentTime = 0; chime.muted = false; unlocked = true; }).catch(() => { chime.muted = false; });
  }
  function ring() {
    stopRing(); rings = 0;
    const once = () => { try { chime.muted = false; chime.currentTime = 0; const p = chime.play(); if (p && p.catch) p.catch(() => {}); } catch {} if (++rings >= 6) stopRing(); };
    once(); ringTimer = setInterval(once, 3300);
  }
  function stopRing() { clearInterval(ringTimer); ringTimer = null; try { chime.pause(); } catch {} }

  // ---------- wake lock ----------
  let lock = null;
  async function syncWake() {
    const need = !!T || !$("night").hidden;
    try {
      if (need && !lock && "wakeLock" in navigator && document.visibilityState === "visible") { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); }
      else if (!need && lock) { lock.release(); lock = null; }
    } catch {}
  }

  // ---------- timer ----------
  let T = lsGet(LS_TIMER), tick = null, lastMode = "";
  function startTimer(id) {
    const f = findItem(id); if (!f || !f.t.min) return;
    unlockSound(); bankTimer();
    T = { id, total: f.t.min * 60000, endsAt: Date.now() + f.t.min * 60000, remaining: null, finished: false, finishedAt: null, elapsedBefore: 0, mini: false };
    lsSet(LS_TIMER, T); openTimer(); render(); update(true);
  }
  function showTimerView() {
    if (!T.work) { const inl = document.querySelector(`.tin[data-id="${T.id}"]`); $("timer").hidden = true; $("mini").hidden = !!inl; document.body.classList.toggle("has-mini", !inl); document.body.style.overflow = $("night").hidden ? "" : "hidden"; return; }
    const mini = !!T.mini;
    $("timer").hidden = mini; $("mini").hidden = !mini;
    document.body.classList.toggle("has-mini", mini);
    document.body.style.overflow = mini ? "" : "hidden";
  }
  function openTimer() { showTimerView(); syncWake(); clearInterval(tick); tick = setInterval(update, 250); update(true); }
  function closeTimer(silent) {
    stopRing(); clearInterval(tick); tick = null; T = null; lsSet(LS_TIMER, null);
    $("timer").hidden = true; $("timer").classList.remove("ringing"); $("mini").hidden = true; document.body.classList.remove("has-mini");
    document.body.style.overflow = $("night").hidden ? "" : "hidden";
    syncWake(); if (!silent) render();
  }
  const remaining = () => !T ? 0 : T.endsAt == null ? T.remaining : Math.max(0, T.endsAt - Date.now());
  const fmt = (ms) => { const s = Math.ceil(ms / 1000); return pad(Math.floor(s / 60)) + ":" + pad(s % 60); };
  const fmtUp = (ms) => { const s = Math.floor(ms / 1000); return pad(Math.floor(s / 60)) + ":" + pad(s % 60); };
  function spentMs() {
    if (!T) return 0;
    const base = T.elapsedBefore || 0;
    if (T.finished) return base + T.total + Math.max(0, Date.now() - (T.finishedAt || Date.now()));
    return base + T.total - remaining();
  }
  function update(force) {
    if (!T) return;
    const f = findItem(T.id), rem = remaining();
    if (!T.finished && rem <= 0) {
      T.finishedAt = T.endsAt || Date.now(); T.finished = true; T.endsAt = null; T.remaining = 0;
      if (T.mini && T.work) { T.mini = false; showTimerView(); }
      lsSet(LS_TIMER, T); ring();
    }
    const name = f ? f.t.name : "Задача";
    if (T.work) wLive();
    const overMs = T.finished ? Math.max(0, Date.now() - (T.finishedAt || Date.now())) : 0;
    const txt = T.finished ? "+" + fmtUp(overMs) : fmt(rem);
    const mode = T.finished ? "done" : (T.endsAt == null ? "paused" : "run");
    if (!T.work && tinUpdate(f, txt, rem, mode)) return;
    if (T.mini) { $("miniName").textContent = name; $("miniTime").textContent = txt; $("miniTime").classList.toggle("paused", mode === "paused"); miniCtl(mode); return; }
    $("tName").textContent = name;
    const tn = f ? f.t.note : ""; $("tNote").textContent = tn || ""; $("tNote").hidden = !tn;
    $("tCount").innerHTML = [...txt].map((ch) => `<span${ch === ":" ? ' class="colon"' : ch === "+" ? ' class="plus"' : ""}>${ch}</span>`).join("");
    $("tPrg").setAttribute("stroke-dashoffset", (C * (1 - rem / T.total)).toFixed(2));
    $("timer").classList.toggle("ringing", T.finished);
    $("tMin").style.visibility = T.finished ? "hidden" : "";
    const p = f && !isRoutine(f.key) ? (f.work ? wproj(f.t.project) : proj(f.t.project)) : null;
    $("tLabel").textContent = T.finished ? "Время вышло" : (p ? p.name + " · " : "") + Math.round(T.total / 60000) + " мин";
    $("tStatus").textContent = mode === "paused" ? "На паузе" : (mode === "done" ? "Идёт овертайм. Жми «Готово», когда закончишь" : "");
    if (mode !== lastMode || force) { lastMode = mode; renderControls(mode, f && !isRoutine(f.key)); }
  }
  function btn(label, cls, fn) { const b = document.createElement("button"); b.className = cls; b.textContent = label; b.onclick = fn; return b; }
  function renderControls(mode, isTask) {
    const box = $("tControls"); box.innerHTML = "";
    const nx = T && routineNext(findItem(T.id));
    if (mode === "done" && nx) box.append(btn("+5 мин", "btn", () => addTime(5)), btn("Готово ✓", "btn", () => finish(true)), btn("Далее: " + nx.name + " ▶", "btn primary", () => { finish(true); startTimer(nx.id); }));
    else if (mode === "done") box.append(btn("+5 мин", "btn", () => addTime(5)), btn("Готово ✓", "btn primary", () => finish(true)));
    else box.append(mode === "paused" ? btn("Продолжить", "btn", resume) : btn("Пауза", "btn", pause), btn("+1 мин", "btn", () => addTime(1)), btn("Готово ✓", "btn primary", () => finish(true)));
    if (isTask) box.append(btn("Продолжу позже: сохранить время как сессию", "later", () => finish(false)));
  }
  function pause() { T.remaining = remaining(); T.endsAt = null; lsSet(LS_TIMER, T); update(); }
  function resume() { unlockSound(); T.endsAt = Date.now() + T.remaining; T.remaining = null; lsSet(LS_TIMER, T); update(); }
  function addTime(min) {
    stopRing(); const add = min * 60000;
    if (T.finished) { T.elapsedBefore = spentMs(); T.finished = false; T.finishedAt = null; T.total = add; T.endsAt = Date.now() + add; T.remaining = null; }
    else if (T.endsAt == null) { T.remaining += add; T.total += add; }
    else { T.endsAt += add; T.total += add; }
    lsSet(LS_TIMER, T); update(true);
  }
  function finish(done) {
    const f = findItem(T.id), ms = Math.round(spentMs());
    if (f && f.work) { const t = f.t; if (done) { t.spent = (t.acc || 0) + ms; wSetStatus(t, "done"); } else { t.acc = (t.acc || 0) + ms; t.sessions = (t.sessions || 0) + 1; persist(); } }
    else if (f) {
      const routine = isRoutine(f.key), t = f.t;
      S.log.push({ d: dayISO(), p: routine ? "_routine" : (t.project || ""), ms, n: t.name, f: done });
      if (S.log.length > 800) S.log = S.log.slice(-800);
      if (done) { t.done = true; t.spent = (t.acc || 0) + ms; if (!routine) t.doneAt = Date.now(); }
      else { t.acc = (t.acc || 0) + ms; t.sessions = (t.sessions || 0) + 1; }
      persist();
    }
    closeTimer();
    if (f && done) maybeCloseDay(f.key);
  }
  $("tClose").onclick = () => { bankTimer(); closeTimer(); };
  $("tMin").onclick = () => { T.mini = true; lsSet(LS_TIMER, T); showTimerView(); update(true); };
  function miniCtl(mode) { const w = !!T.work; $("miniPause").hidden = !w; $("miniDone").hidden = !w; if (w) $("miniPause").textContent = mode === "paused" ? "▶" : "⏸"; }
  $("miniPause").onclick = (e) => { e.stopPropagation(); if (T) T.endsAt == null ? resume() : pause(); };
  $("miniDone").onclick = (e) => { e.stopPropagation(); if (T) finish(true); };
  $("mini").onclick = () => { T.mini = false; lsSet(LS_TIMER, T); showTimerView(); update(true); };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") { syncWake(); if (T) update(); if (S.day.closedAt) checkDay(); render(); }
  });

  render();
  if (T && findItem(T.id)) openTimer(); else { T = null; lsSet(LS_TIMER, null); }
  checkDay();
  bugInit();
  eveTick(); setInterval(eveTick, 20000);
})();
