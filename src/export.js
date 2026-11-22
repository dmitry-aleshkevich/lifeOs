  // export all cloud docs (os + map) to a JSON file — for moving to another host
  async function exportAll() {
    try {
      const [db, user] = await Promise.all([window.claude?.use("db"), window.claude?.use("user")]);
      const docs = await new Promise((res, rej) => { if (!db || !user) return res([{ id: "os", data: S }]); user.id().then((id) => { let done = false; const un = db.collection("data/users/" + id).onSnapshot((snap) => { if (done) return; done = true; res((snap.docs || []).map((d) => ({ id: d.id, data: d.data() }))); try { un && un(); } catch {} }, rej); }); });
      if (!docs.some((d) => d.id === "os")) docs.push({ id: "os", data: S });
      const text = JSON.stringify({ app: "lifeos", v: 1, at: Date.now(), docs }), name = "LifeOS_data_" + dayISO() + ".json";
      try { const dl = await window.claude?.use("downloads"); if (dl) { await dl.save({ filename: name, data: text }); toast("Экспорт: " + docs.length + " док."); return; } } catch (e) { if (e && e.code === "declined") return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) { toast("Не получилось выгрузить"); }
  }
