  // ===== task scenarios (templates): "Уборка" → task with checklist / subtasks =====
  const tplInit = () => { if (!Array.isArray(S.tpls)) S.tpls = [{ id: "t-clean", name: "Уборка 🧹", mode: "sub", items: [{ id: uid(), name: "Кухня", min: 5 }, { id: uid(), name: "Комната", min: 10 }, { id: uid(), name: "Одежда", min: 5 }] }]; };
  const tplKey = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").trim();
  const tplFind = (q) => { tplInit(); const k = tplKey(q); return k.length < 2 ? [] : S.tpls.filter((x) => tplKey(x.name).startsWith(k) || k.startsWith(tplKey(x.name))); };
  function tplTake(tp, where) {
    const mk = (name, min) => ({ id: uid(), name, min, done: false, spent: 0, note: "", project: "", where: where || "today", sessions: 0, acc: 0, waitUntil: "", doneAt: 0, due: "", at: "" });
    const sum = tp.items.reduce((a, x) => a + (x.min || 0), 0);
    if (tp.mode === "check") { const t = mk(tp.name, sum); t.check = tp.items.map((x) => ({ id: uid(), text: x.name + (x.min ? " · " + x.min + " мин" : ""), done: false })); S.tasks.push(t); }
    else { const t = mk(tp.name, 0); t.lnOpen = true; S.tasks.push(t, ...tp.items.map((x) => ({ ...mk(x.name, x.min), link: t.id, rel: "post" }))); }
    persist(); render();
  }
  function tdCheckBox(box, t) {
    const w = document.createElement("div"); w.className = "tdck"; w.onclick = (e) => e.stopPropagation();
    const ls = Array.isArray(t.check) ? t.check : [];
    w.innerHTML = ls.map((c, i) => `<div class="tdck-i${c.done ? " on" : ""}"><button type="button" class="tdck-b" data-i="${i}" aria-pressed="${c.done}" aria-label="Пункт">${c.done ? "✓" : ""}</button><span>${esc(c.text)}</span><button type="button" class="tdck-x" data-x="${i}" aria-label="Удалить">×</button></div>`).join("") + `<input class="tdck-add" maxlength="120" placeholder="+ пункт, Enter" aria-label="Новый пункт">`;
    w.querySelectorAll(".tdck-b").forEach((b) => b.onclick = () => { const c = t.check[+b.dataset.i]; c.done = !c.done; persist(); render(); });
    w.querySelectorAll(".tdck-x").forEach((b) => b.onclick = () => { t.check.splice(+b.dataset.x, 1); if (!t.check.length) delete t.check; persist(); render(); });
    const a = w.querySelector(".tdck-add"); a.onkeydown = (e) => { if (e.key !== "Enter") return; e.preventDefault(); const v = a.value.trim(); if (!v) return; (t.check = t.check || []).push({ id: uid(), text: v, done: false }); persist(); render(); setTimeout(() => { const n = document.querySelector(".tdck-add"); if (n) n.focus(); }, 0); };
    box.insertBefore(w, box.querySelector(".tin-c"));
  }
  function tplEditor(page) {
    tplInit();
    const sec = document.createElement("section"); sec.className = "pl";
    sec.innerHTML = `<div class="sce-h"><h1 class="td-t">Сценарии задач</h1><div class="td-s">Пишешь название в «Сегодня» — появляется «Взять сценарий», и задача добавляется с пунктами отсюда.</div></div><div class="pl-l"></div><div class="pl-f"><button class="act" id="tpAdd">＋ Сценарий</button></div>`;
    const L = sec.querySelector(".pl-l"), redo = () => { persist(); renderScen(); };
    S.tpls.forEach((tp, ti) => {
      const c = document.createElement("div"); c.className = "pl-b tp-b";
      const sum = tp.items.reduce((a, x) => a + (x.min || 0), 0);
      c.innerHTML = `<div class="pl-r"><input class="pl-nm" maxlength="40" value="${esc(tp.name)}" aria-label="Название"><span class="sce-sum">${tp.items.length} · ${tdMin(sum) || "0 мин"}</span><button class="sce-b sce-x" data-a="del" aria-label="Удалить">×</button></div>
        <div class="pl-d"><button type="button" class="pl-day" data-m="sub" aria-pressed="${tp.mode !== "check"}">Подзадачи</button><button type="button" class="pl-day" data-m="check" aria-pressed="${tp.mode === "check"}">Чеклист</button></div><ul class="sce-l"></ul><form class="sce-add" autocomplete="off"><input maxlength="80" placeholder="+ пункт (Кухня 5м)" aria-label="Добавить пункт"></form>`;
      c.querySelector(".pl-nm").onchange = (e) => { const v = e.target.value.trim(); if (v) { tp.name = v; persist(); } else e.target.value = tp.name; };
      c.querySelector("[data-a=del]").onclick = () => { S.tpls.splice(ti, 1); redo(); };
      c.querySelectorAll("[data-m]").forEach((b) => b.onclick = () => { tp.mode = b.dataset.m; redo(); });
      const ul = c.querySelector(".sce-l");
      tp.items.forEach((it, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="sce-n">${i + 1}</span><input class="sce-in" value="${esc(it.name)}" maxlength="80" aria-label="Пункт"><input class="sce-mn" type="number" min="0" max="240" value="${it.min || 0}" aria-label="Минуты"><span class="sce-u">мин</span><button class="sce-b" data-a="up"${i ? "" : " disabled"} aria-label="Выше">↑</button><button class="sce-b sce-x" data-a="x" aria-label="Удалить">×</button>`;
        li.querySelector(".sce-in").onchange = (e) => { const v = e.target.value.trim(); if (v) { it.name = v; persist(); } else e.target.value = it.name; };
        li.querySelector(".sce-mn").onchange = (e) => { it.min = Math.max(0, Math.min(240, Math.round(+e.target.value || 0))); redo(); };
        li.querySelector("[data-a=up]").onclick = () => { [tp.items[i - 1], tp.items[i]] = [tp.items[i], tp.items[i - 1]]; redo(); };
        li.querySelector("[data-a=x]").onclick = () => { tp.items.splice(i, 1); redo(); };
        ul.appendChild(li);
      });
      c.querySelector(".sce-add").onsubmit = (e) => { e.preventDefault(); const raw = e.target.querySelector("input").value.trim(); if (!raw) return; const q = parseQuick(raw); tp.items.push({ id: uid(), name: q.name, min: q.min ?? 5 }); redo(); const n = document.querySelectorAll("#vScen .tp-b .sce-add input")[ti]; if (n) n.focus(); };
      L.appendChild(c);
    });
    sec.querySelector("#tpAdd").onclick = () => { S.tpls.push({ id: "t-" + uid(), name: "Новый сценарий", mode: "sub", items: [] }); redo(); };
    page.appendChild(sec);
  }
