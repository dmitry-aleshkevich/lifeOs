/* ---------- Карта желаний: тот же IndexedDB «lifeos-map», что и в v1 (картинки не копируются); облако в Beta 2.0 не трогаем ---------- */
const MP_W = 3200, MP_ZH = 1600, MP_GAP = 200;
const MP_ZONES = [
  { ttl: "МЕЧТА", lvl: "3", sub: "Роскошь, которую хочется хотеть", hint: "Вилла · дорогие машины · мотоциклы · красивые женщины", c: "#f3c969" },
  { ttl: "БАНГКОК", lvl: "2", sub: "Точка Б · Новый год 2027", hint: "Пентхаус с видом · Харлей на парковке · вечерний город · семья на отдыхе в Турции", c: "#ff7a1a" },
  { ttl: "ДАЛАТ", lvl: "1", sub: "Ближайшее · закрывается в начале роста", hint: "Кроссовый мотоцикл · бытовые ништяки", c: "#d4ff3a" },
];
const MP_B = { w: MP_W, h: MP_ZONES.length * MP_ZH + (MP_ZONES.length - 1) * MP_GAP };
const mpItems = new Map();
let mpRoot = null, mpVp = null, mpWorld = null, mpToastEl = null, mpDelBtn = null, mpView = { x: 0, y: 0, s: 0.2 }, mpSel = null, mpMax = 1, mpDrag = null, mpEditing = null;
let mpLastDown = { t: 0, id: null }, mpPtrs = new Map(), mpPinch = null, mpLastP = null, mpIdb = null, mpCloud = null, mpBuilt = false, mpHasView = false;
const mpPending = new Set(), mpSaveT = {};
const mpUid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const mpStrip = (it) => { const { el, ...r } = it; return r; };
function mpToast(t) { if (!mpToastEl) return; mpToastEl.textContent = t; mpToastEl.classList.add("on"); clearTimeout(mpToast._t); mpToast._t = setTimeout(() => mpToastEl.classList.remove("on"), 2200); }

// storage: local IndexedDB cache + cloud (db) when available
function mpIdbOpen() {
  if (mpIdb) return mpIdb;
  mpIdb = new Promise((res, rej) => { try { const r = indexedDB.open("lifeos-map", 1); r.onupgradeneeded = () => r.result.createObjectStore("items", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  mpIdb.catch(() => {});
  return mpIdb;
}
const mpStore = (mode) => mpIdbOpen().then((db) => db.transaction("items", mode).objectStore("items"));
function mpSave(it) {
  const rec = mpStrip(it);
  mpStore("readwrite").then((s) => s.put(rec)).catch(() => {});
  if (mpCloud) { mpPending.add(it.id); Promise.resolve().then(() => mpCloud.col.doc("map-" + it.id).set(rec)).catch(() => mpToast("Не удалось сохранить в облако")).finally(() => setTimeout(() => mpPending.delete(it.id), 1500)); }
}
function mpSaveSoon(it) { clearTimeout(mpSaveT[it.id]); mpSaveT[it.id] = setTimeout(() => mpSave(it), 400); }
function mpDelRec(id) {
  mpStore("readwrite").then((s) => s.delete(id)).catch(() => {});
  if (mpCloud) Promise.resolve().then(() => mpCloud.col.doc("map-" + id).delete()).catch(() => {});
}

// view
function mpApply() { mpWorld.style.transform = `translate(${mpView.x}px,${mpView.y}px) scale(${mpView.s})`; mpVp.style.setProperty("--s", mpView.s); }
const mpXY = (e) => { const r = mpVp.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
const mpToWorld = (x, y) => ({ x: (x - mpView.x) / mpView.s, y: (y - mpView.y) / mpView.s });
function mpFit() {
  const W = mpVp.clientWidth, H = mpVp.clientHeight; if (!W || !H) return;
  const m = 20, top = 58, s = Math.min((W - 2 * m) / MP_B.w, (H - top - m) / MP_B.h);
  mpView = { s, x: (W - MP_B.w * s) / 2, y: top + (H - top - m - MP_B.h * s) / 2 }; mpApply(); mpSaveView();
}
function mpZoomAt(x, y, k) { const ns = Math.min(4, Math.max(0.03, mpView.s * k)), w = mpToWorld(x, y); mpView.s = ns; mpView.x = x - w.x * ns; mpView.y = y - w.y * ns; mpApply(); mpSaveViewSoon(); }
function mpSaveView() { try { localStorage.setItem("lifeos.map.view.v1", JSON.stringify(mpView)); } catch {} }
let mpSvT; function mpSaveViewSoon() { clearTimeout(mpSvT); mpSvT = setTimeout(mpSaveView, 300); }

// items
function mpMount(it) {
  const el = document.createElement("div"); el.className = "item" + (it.type === "text" ? " text" : ""); el.dataset.id = it.id;
  if (it.type === "img") { const img = document.createElement("img"); img.draggable = false; img.src = it.src || it.url || ""; el.appendChild(img); }
  else { const t = document.createElement("div"); t.className = "t"; t.textContent = it.text || ""; el.appendChild(t); }
  const h = document.createElement("div"); h.className = "handle"; el.appendChild(h);
  it.el = el; mpWorld.appendChild(el); mpItems.set(it.id, it); mpMax = Math.max(mpMax, it.z || 1); mpPlace(it);
}
function mpPlace(it) {
  const s = it.el.style; s.left = it.x + "px"; s.top = it.y + "px"; s.zIndex = 10 + (it.z || 1);
  if (it.type === "img") { s.width = it.w + "px"; s.height = it.h + "px"; }
  else { const t = it.el.querySelector(".t"); t.style.fontSize = it.fs + "px"; t.style.color = it.color || "#f2f2f2"; }
}
function mpSelect(it) { if (mpSel && mpSel.el) mpSel.el.classList.remove("sel"); mpSel = it; if (it) it.el.classList.add("sel"); if (mpDelBtn) mpDelBtn.hidden = !it; }
function mpFront(it) { if ((it.z || 0) < mpMax) { it.z = ++mpMax; mpPlace(it); } }
function mpRemove(it) { clearTimeout(mpSaveT[it.id]); it.el.remove(); mpItems.delete(it.id); mpDelRec(it.id); if (mpSel === it) mpSelect(null); }
function mpPrep(blob) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(blob), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(u);
      const nw = img.naturalWidth, nh = img.naturalHeight, alpha = /png|webp|gif|svg|avif/.test(blob.type), c = document.createElement("canvas"), g = c.getContext("2d");
      let max = 1400, d = "", w = nw, h = nh;
      for (let i = 0; i < 6; i++) {
        const k = Math.min(1, max / Math.max(nw, nh)); w = Math.max(1, Math.round(nw * k)); h = Math.max(1, Math.round(nh * k));
        c.width = w; c.height = h; g.clearRect(0, 0, w, h);
        if (!alpha) { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }
        g.drawImage(img, 0, 0, w, h);
        d = alpha ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", i < 2 ? 0.86 : 0.7);
        if (d.length <= 850000) break; max = Math.round(max * 0.75);
      }
      res({ src: d, w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(); };
    img.src = u;
  });
}
async function mpAddBlob(blob, p) {
  try {
    const r = await mpPrep(blob), w = Math.min(800, Math.max(300, 380 / mpView.s)), h = w * r.h / r.w;
    const it = { id: mpUid(), type: "img", x: p.x - w / 2, y: p.y - h / 2, w, h, z: ++mpMax, src: r.src };
    mpMount(it); mpSelect(it); mpSave(it);
  } catch { mpToast("Не получилось загрузить картинку"); }
}
async function mpFromUrl(url, p) {
  try { const r = await fetch(url); const b = await r.blob(); if (!b.type.startsWith("image/")) throw 0; await mpAddBlob(b, p); }
  catch { mpToast("Не вышло — сохрани картинку и добавь через «+ Фото»"); }
}
function mpAddText(p, text, edit = true) {
  const it = { id: mpUid(), type: "text", x: p.x, y: p.y, fs: Math.min(160, Math.max(60, 48 / mpView.s)), text: text || "Новая цель", z: ++mpMax };
  mpMount(it); mpSelect(it); mpSave(it); if (edit) mpStartEdit(it);
}
function mpStartEdit(it) {
  const t = it.el.querySelector(".t"); mpEditing = it; t.contentEditable = "true"; t.focus();
  const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  t.onblur = () => { t.contentEditable = "false"; mpEditing = null; it.text = t.innerText.replace(/\n$/, ""); if (!it.text.trim()) mpRemove(it); else mpSave(it); };
  t.onkeydown = (e) => { if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); t.blur(); } };
}

// file backup (compatible with the standalone wish map JSON)
const mpB2D = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
async function mpExport() {
  const out = [...mpItems.values()].map((it) => { const r = mpStrip(it); if (r.src && r.src.startsWith("data:")) { r.data = r.src; delete r.src; } return r; });
  const text = JSON.stringify({ app: "wishmap", v: 2, items: out }), name = "Карта желаний " + new Date().toISOString().slice(0, 10) + ".json";
  try {
    const dl = await window.claude?.use("downloads");
    if (dl) { await dl.save({ filename: name, data: text }); mpToast("Сохранено: " + out.length); return; }
  } catch (e) { if (e && e.code === "declined") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); mpToast("Сохранено: " + out.length);
}
async function mpImport(file) {
  try {
    const d = JSON.parse(await file.text()); if (d.app !== "wishmap" || !Array.isArray(d.items)) throw 0;
    if (mpItems.size && !confirm("Заменить текущую карту (" + mpItems.size + ") данными из файла (" + d.items.length + ")?")) return;
    for (const it of [...mpItems.values()]) mpRemove(it);
    for (const rec of d.items) {
      if (rec.data) { rec.src = rec.data; delete rec.data; }
      else if (rec.blob) { rec.src = await mpB2D(rec.blob); }
      delete rec.blob; delete rec.objUrl; if (!rec.id) rec.id = mpUid();
      mpMount(rec); mpSave(rec);
    }
    mpToast("Загружено: " + d.items.length);
  } catch { mpToast("Файл не подходит"); }
}

// cloud
async function mpCloudInit() {
  try {
    const [db, user] = await Promise.all([window.claude?.use("db"), window.claude?.use("user")]); if (!db || !user) return;
    const id = await user.id(); if (!id) return;
    const col = db.collection("data/users/" + id); mpCloud = { col }; let first = true;
    col.onSnapshot((snap) => {
      const docs = (snap.docs || []).filter((d) => d.id && d.id.startsWith("map-")); let any = false;
      docs.forEach((d) => {
        any = true; const r = d.data(); if (!r || !r.id) return;
        if (mpPending.has(r.id) || (mpDrag && mpDrag.it && mpDrag.it.id === r.id) || (mpEditing && mpEditing.id === r.id)) return;
        const cur = mpItems.get(r.id);
        if (!cur) { mpMount({ ...r }); mpSaveLocal(r); return; }
        if (JSON.stringify(mpStrip(cur)) === JSON.stringify(r)) return;
        const keep = cur.el; Object.keys(cur).forEach((k) => { if (k !== "el") delete cur[k]; }); Object.assign(cur, r); cur.el = keep;
        if (cur.type === "text") cur.el.querySelector(".t").textContent = cur.text || ""; else { const im = cur.el.querySelector("img"); if (im && im.getAttribute("src") !== cur.src) im.src = cur.src || ""; }
        mpPlace(cur); mpMax = Math.max(mpMax, cur.z || 1); mpSaveLocal(r);
      });
      const ch = typeof snap.docChanges === "function" ? snap.docChanges() : [];
      ch.forEach((c) => { if (c.type === "removed" && c.doc && c.doc.id.startsWith("map-")) { const it = mpItems.get(c.doc.id.slice(4)); if (it && !mpPending.has(it.id)) { it.el.remove(); mpItems.delete(it.id); if (mpSel === it) mpSelect(null); mpStore("readwrite").then((s) => s.delete(it.id)).catch(() => {}); } } });
      if (first && !(snap.metadata && snap.metadata.fromCache)) { first = false; if (!any && mpItems.size) [...mpItems.values()].forEach(mpSave); }
    }, () => {});
  } catch {}
}
function mpSaveLocal(rec) { mpStore("readwrite").then((s) => s.put(rec)).catch(() => {}); }

function mpBuild() {
  mpBuilt = true; mpCloudInit();
  const root = mpRoot = document.createElement("div"); root.className = "mp";
  root.innerHTML = `<div class="mpvp"><div class="mpworld"></div></div>
    <div class="mpbar"><button data-a="fit">Вписать</button><button data-a="text">+ Текст</button><button data-a="photo">+ Фото</button><button data-a="del" hidden class="d">Удалить</button><button data-a="save" title="Копия карты в файл">В файл</button><button data-a="load">Из файла</button></div>
    <div class="mphelp">Тяни фон — двигать · колёсико / щипок — зум · вставь картинку (⌘V) или перетащи · двойной тап по фону — текст</div>
    <div class="mptoast"></div><input type="file" accept="image/*" multiple hidden data-f="img"><input type="file" accept=".json,application/json" hidden data-f="json">`;
  mpVp = root.querySelector(".mpvp"); mpWorld = root.querySelector(".mpworld"); mpToastEl = root.querySelector(".mptoast"); mpDelBtn = root.querySelector('[data-a="del"]');
  MP_ZONES.forEach((z, i) => {
    const y = i * (MP_ZH + MP_GAP), d = document.createElement("div"); d.className = "zone"; d.style.cssText = `--c:${z.c};left:0;top:${y}px;width:${MP_W}px;height:${MP_ZH}px`;
    d.innerHTML = `<div class="lbl"><div class="ttl">${z.ttl}</div><div class="sub">${z.sub}</div><div class="hint">${z.hint}</div></div><div class="lvl">0${z.lvl}</div>`; mpWorld.appendChild(d);
    if (i < MP_ZONES.length - 1) { const a = document.createElement("div"); a.className = "arrow"; a.textContent = "↑"; a.style.left = MP_W / 2 + "px"; a.style.top = y + MP_ZH + 10 + "px"; mpWorld.appendChild(a); }
  });
  try { const v = JSON.parse(localStorage.getItem("lifeos.map.view.v1") || "null"); if (v && v.s) { mpView = v; mpHasView = true; } } catch {}
  const ctr = () => ({ x: mpVp.clientWidth / 2, y: mpVp.clientHeight / 2 });
  root.querySelector(".mpbar").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return; const a = b.dataset.a;
    if (a === "fit") mpFit();
    else if (a === "text") { const c = ctr(); setTimeout(() => mpAddText(mpToWorld(c.x, c.y))); }
    else if (a === "photo") root.querySelector('[data-f="img"]').click();
    else if (a === "del") { if (mpSel) mpRemove(mpSel); }
    else if (a === "save") mpExport();
    else if (a === "load") root.querySelector('[data-f="json"]').click();
  });
  root.querySelector('[data-f="img"]').onchange = (e) => { const c = ctr(), p = mpToWorld(c.x, c.y); [...e.target.files].forEach((f, i) => mpAddBlob(f, { x: p.x + i * 60, y: p.y + i * 60 })); e.target.value = ""; };
  root.querySelector('[data-f="json"]').onchange = (e) => { const f = e.target.files[0]; e.target.value = ""; if (f) mpImport(f); };
  // pointer
  mpVp.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 1 && e.pointerType === "mouse") return;
    const q = mpXY(e); mpPtrs.set(e.pointerId, q); mpVp.setPointerCapture(e.pointerId);
    if (mpPtrs.size === 2) { const [a, b] = [...mpPtrs.values()]; mpPinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: mpView.s, w: mpToWorld((a.x + b.x) / 2, (a.y + b.y) / 2) }; if (mpDrag && mpDrag.m === "move") mpSave(mpDrag.it); mpDrag = null; return; }
    if (mpPtrs.size > 2) return;
    const itEl = e.target.closest(".item"), now = performance.now();
    if (mpEditing && itEl && itEl.dataset.id === mpEditing.id) return;
    if (mpEditing) mpEditing.el.querySelector(".t").blur();
    if (e.target.classList.contains("handle")) { const it = mpItems.get(itEl.dataset.id); mpSelect(it); mpDrag = { m: "resize", sx: q.x, sy: q.y, it, ow: it.w, oh: it.h, ofs: it.fs }; }
    else if (itEl) {
      const it = mpItems.get(itEl.dataset.id);
      if (it.type === "text" && mpLastDown.id === it.id && now - mpLastDown.t < 380) { e.preventDefault(); mpLastDown = { t: 0, id: null }; mpPtrs.clear(); setTimeout(() => mpStartEdit(it)); return; }
      mpLastDown = { t: now, id: it.id }; mpSelect(it); mpFront(it); mpDrag = { m: "move", sx: q.x, sy: q.y, it, ox: it.x, oy: it.y };
    } else {
      if (mpLastDown.id === "bg" && now - mpLastDown.t < 380) { e.preventDefault(); mpLastDown = { t: 0, id: null }; mpPtrs.clear(); const p = mpToWorld(q.x, q.y); setTimeout(() => mpAddText(p)); return; }
      mpLastDown = { t: now, id: "bg" }; mpSelect(null); mpDrag = { m: "pan", sx: q.x, sy: q.y, ox: mpView.x, oy: mpView.y }; mpVp.classList.add("panning");
    }
  });
  mpVp.addEventListener("pointermove", (e) => {
    const q = mpXY(e); mpLastP = mpToWorld(q.x, q.y); if (!mpPtrs.has(e.pointerId)) return; mpPtrs.set(e.pointerId, q);
    if (mpPinch && mpPtrs.size >= 2) {
      const [a, b] = [...mpPtrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ns = Math.min(4, Math.max(0.03, mpPinch.s0 * d / mpPinch.d0)), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      mpView.s = ns; mpView.x = mx - mpPinch.w.x * ns; mpView.y = my - mpPinch.w.y * ns; mpApply(); return;
    }
    if (!mpDrag) return; const dx = q.x - mpDrag.sx, dy = q.y - mpDrag.sy, it = mpDrag.it;
    if (mpDrag.m === "pan") { mpView.x = mpDrag.ox + dx; mpView.y = mpDrag.oy + dy; mpApply(); }
    else if (mpDrag.m === "move") { it.x = mpDrag.ox + dx / mpView.s; it.y = mpDrag.oy + dy / mpView.s; mpPlace(it); }
    else if (it.type === "img") { const k = Math.max(0.05, (mpDrag.ow + dx / mpView.s) / mpDrag.ow); it.w = mpDrag.ow * k; it.h = mpDrag.oh * k; mpPlace(it); }
    else { const base = it.el.offsetWidth * mpDrag.ofs / it.fs, k = Math.max(0.1, (base + dx / mpView.s) / base); it.fs = mpDrag.ofs * k; mpPlace(it); }
  });
  const end = (e) => {
    mpPtrs.delete(e.pointerId); if (mpPtrs.size < 2) mpPinch = null;
    if (!mpDrag) return; if (mpDrag.m === "pan") { mpVp.classList.remove("panning"); mpSaveView(); } else mpSave(mpDrag.it); mpDrag = null;
  };
  mpVp.addEventListener("pointerup", end); mpVp.addEventListener("pointercancel", end);
  mpVp.addEventListener("wheel", (e) => {
    e.preventDefault(); const q = mpXY(e);
    if (!e.ctrlKey && e.deltaMode === 0 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5) { mpView.x -= e.deltaX; mpView.y -= e.deltaY; mpApply(); mpSaveViewSoon(); return; }
    mpZoomAt(q.x, q.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  }, { passive: false });
  // drop
  mpVp.addEventListener("dragover", (e) => { e.preventDefault(); root.classList.add("dropover"); });
  mpVp.addEventListener("dragleave", () => root.classList.remove("dropover"));
  mpVp.addEventListener("drop", (e) => {
    e.preventDefault(); root.classList.remove("dropover"); const q = mpXY(e), p = mpToWorld(q.x, q.y), dt = e.dataTransfer;
    const files = [...dt.files].filter((f) => f.type.startsWith("image/"));
    if (files.length) { files.forEach((f, i) => mpAddBlob(f, { x: p.x + i * 60, y: p.y + i * 60 })); return; }
    let url = ""; const html = dt.getData("text/html");
    if (html) { const m = html.match(/<img[^>]+src=["']([^"']+)["']/i); if (m) url = m[1].replace(/&amp;/g, "&"); }
    if (!url) url = (dt.getData("text/uri-list") || dt.getData("text/plain") || "").split("\n")[0].trim();
    if (/^(https?:|data:image\/)/.test(url)) mpFromUrl(url, p); else mpToast("Не вышло — вставь картинку через ⌘V");
  });
  // paste + keys (only on this tab, not while typing in fields)
  const typing = (e) => { const t = e.target; return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)); };
  document.addEventListener("paste", (e) => {
    if (UI.view !== "map" || mpEditing || typing(e)) return;
    const p = mpLastP || (() => { const c = ctr(); return mpToWorld(c.x, c.y); })(), f = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (f) { e.preventDefault(); mpAddBlob(f.getAsFile(), p); return; }
    const t = (e.clipboardData.getData("text/plain") || "").trim();
    if (/^https?:\/\/\S+$/.test(t)) { e.preventDefault(); mpFromUrl(t, p); } else if (t) { e.preventDefault(); mpAddText(p, t, false); }
  });
  document.addEventListener("keydown", (e) => {
    if (UI.view !== "map" || mpEditing || typing(e) || e.metaKey || e.ctrlKey) return;
    const c = ctr();
    if ((e.key === "Delete" || e.key === "Backspace") && mpSel) { e.preventDefault(); mpRemove(mpSel); }
    else if (e.key === "Escape") mpSelect(null);
    else if (e.key === "0") mpFit();
    else if (e.key === "=" || e.key === "+") mpZoomAt(c.x, c.y, 1.25);
    else if (e.key === "-") mpZoomAt(c.x, c.y, 0.8);
    else if (e.key === "Enter" && mpSel && mpSel.type === "text") { e.preventDefault(); mpStartEdit(mpSel); }
  });
  // load local cache, then cloud
  mpStore("readonly").then((s) => new Promise((r) => { const q = s.getAll(); q.onsuccess = () => r(q.result); q.onerror = () => r([]); })).then((all) => { all.forEach((r) => { if (!mpItems.has(r.id)) mpMount(r); }); }).catch(() => {}).finally(()=>{});
}
function renderMap(v){
  if(!mpBuilt)mpBuild();
  const host=el("div","mpwrap");v.appendChild(host);host.appendChild(mpRoot);
  mpApply();if(!mpHasView){mpHasView=true;requestAnimationFrame(mpFit)}}
