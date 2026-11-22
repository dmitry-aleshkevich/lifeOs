window.__db = JSON.parse(localStorage.getItem("__fakedb") || "{}");
window.__save = () => localStorage.setItem("__fakedb", JSON.stringify(window.__db));
window.supabase = { createClient: () => {
  let session = JSON.parse(localStorage.getItem("__fakesess") || "null");
  const q = (table) => { const st = { f: {} };
    const run = () => { let rows = Object.entries(window.__db).map(([id, data]) => ({ id, data })); if (st.f.id) rows = rows.filter((r) => r.id === st.f.id); return rows; };
    const o = {
      select() { return o; }, eq(k, v) { st.f[k] = v; if (st.del) { delete window.__db[v]; window.__save(); return Promise.resolve({ error: null }); } return o; },
      maybeSingle() { return Promise.resolve({ data: run()[0] || null, error: null }); },
      then(r, j) { return Promise.resolve({ data: run(), error: null }).then(r, j); },
      upsert(rows) { (Array.isArray(rows) ? rows : [rows]).forEach((r) => { window.__db[r.id] = r.data; }); window.__save(); return Promise.resolve({ error: null }); },
      delete() { st.del = true; return o; } };
    return o; };
  return {
    auth: { getSession: async () => ({ data: { session } }),
      signInWithPassword: async ({ email }) => { session = { user: { id: "u-" + email } }; localStorage.setItem("__fakesess", JSON.stringify(session)); return { data: { session }, error: null }; },
      signUp: async (a) => ({ data: { session: null }, error: null }), signOut: async () => { localStorage.removeItem("__fakesess"); } },
    from: q, channel: () => ({ on() { return this; }, subscribe() { return this; } }) };
} };
