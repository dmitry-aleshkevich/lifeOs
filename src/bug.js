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
