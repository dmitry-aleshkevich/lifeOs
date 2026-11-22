  function tdTriSeg(cur) {
    const s = document.createElement("div"); s.className = "seg sm td-tri"; s.setAttribute("role", "group"); s.setAttribute("aria-label", "Экран");
    s.innerHTML = [["list", "Сегодня"], ["cal", "День"], ["plan", "План"]].map(([k, l]) => `<button data-tri="${k}" aria-pressed="${k === cur}">${l}</button>`).join("") + (cur === "plan" ? "" : `<button class="td-foc" title="Фокус: только 3 ближайшие задачи">◎ Фокус</button>`);
    s.querySelectorAll("[data-tri]").forEach((b) => b.onclick = () => { const k = b.dataset.tri; if (k === "plan") { if (view !== "tasks") setView("tasks"); return; } if (view !== "today") { todayMode = k; saveUI(); setView("today"); return; } if (k === todayMode) return; if (k === "list") reorderToday(); todayMode = k; saveUI(); render(); });
    const f = s.querySelector(".td-foc"); if (f) f.onclick = () => fSetMode(true);
    return s;
  }
  const setView = (id) => { view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); };
