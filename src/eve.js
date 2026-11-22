  // ===== evening banner: from 21:00 countdown to midnight =====
  const EVE_LS = "lifeos.eve.v1", EVE_FROM = 21;
  function eveTick() {
    const now = new Date(), h = now.getHours(), on = h >= EVE_FROM && !S.day.closedAt;
    let el = $("eveBan");
    if (!on) { if (el) el.remove(); return; }
    const day = dayISO(), st = (() => { try { return JSON.parse(localStorage.getItem(EVE_LS)) || {}; } catch { return {}; } })(), min = st.day === day && st.min;
    const left = Math.max(0, Math.ceil((new Date(now).setHours(24, 0, 0, 0) - now) / 60000)), hm = Math.floor(left / 60) + ":" + pad(left % 60);
    const n = S.tasks.filter((t) => t.where === "today" && !t.done && !t.tpl).length;
    if (!el) { el = document.createElement("div"); el.id = "eveBan"; document.body.appendChild(el);
      el.onclick = (e) => { const b = e.target.closest("[data-e]"); if (!b && !el.classList.contains("min")) return; const m = b ? b.dataset.e === "min" : false; try { localStorage.setItem(EVE_LS, JSON.stringify({ day: dayISO(), min: m })); } catch {} eveTick(); }; }
    el.classList.toggle("min", !!min);
    el.classList.toggle("late", left <= 60);
    el.innerHTML = min ? `<span class="eb-mt">🌙 ${hm}</span>` : `<button class="eb-x" data-e="min" aria-label="Свернуть">–</button><div class="eb-l">До полуночи осталось</div><div class="eb-t">${hm}</div><div class="eb-s">${n ? "Успей закончить дела: ещё " + n + " " + (n % 10 === 1 && n % 100 !== 11 ? "задача" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "задачи" : "задач") : "Дела закрыты — можно на вечернюю рутину"}</div>`;
  }
