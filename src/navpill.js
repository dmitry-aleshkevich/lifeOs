  function navPlusSync() {
    const nv = document.getElementById("views"); if (!nv || document.getElementById("navPlus")) return;
    const b = document.createElement("button"); b.id = "navPlus"; b.type = "button"; b.setAttribute("aria-label", "Добавить");
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
    b.onclick = (e) => { e.stopPropagation(); if (view === "work") { const r = b.getBoundingClientRect(); wFabMenu(r.left + r.width / 2 + 100, r.top - 8); return; } qaOpen(view === "tasks" ? "backlog" : "today", { where: true, def: view === "tasks" ? "backlog" : "today" }); };
    nv.appendChild(b);
  }
