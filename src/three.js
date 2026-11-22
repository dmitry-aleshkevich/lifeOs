  function tdTriSeg(cur) {
    const s = document.createElement("div"); s.className = "seg sm td-tri"; s.setAttribute("role", "group"); s.setAttribute("aria-label", "Экран");
    s.innerHTML = [["list", "Сегодня"], ["cal", "День"], ["focus", "◎ Фокус"]].map(([k, l]) => `<button data-tri="${k}" aria-pressed="${k === cur}">${l}</button>`).join("");
    s.querySelectorAll("[data-tri]").forEach((b) => b.onclick = () => { const k = b.dataset.tri; if (k === "focus") { if (!fMode) fSetMode(true); return; } if (fMode) { fMode = false; try { localStorage.setItem("lifeos.focus.v1", "plan"); } catch {} } if (view !== "today") { todayMode = k; saveUI(); setView("today"); return; } if (k === todayMode && !arguments.length) return; if (k === "list") reorderToday(); todayMode = k; saveUI(); render(); });
    return s;
  }
  const setView = (id) => { view = id; lsSet(LS_VIEW, view); saveUI(); render(); window.scrollTo({ top: 0 }); };
