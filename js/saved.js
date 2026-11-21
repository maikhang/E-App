/* 💾 Bài đã lưu — tối đa 10 bài cho mỗi mục (Luyện viết, Bài giảng).
 * Trên claude.ai: lưu vào kho dữ liệu riêng của tài khoản (db, thư mục data/users/<id> — chỉ người đó đọc được),
 *   nên mở trên máy khác vẫn thấy. Mỗi tài liệu tối đa 256 KiB → bài và ảnh được chia thành nhiều phần.
 * Mở ngoài claude.ai, hoặc tài khoản không ghi được vào kho đó: lưu trong trình duyệt này (IndexedDB). */
window.SAVED = (function () {
  const MAX = 10;
  const STATE_PART = 60000;    // ký tự / phần (chữ tiếng Việt tới 3 byte + thoát ký tự JSON — vẫn dưới 256 KiB)
  const IMAGE_PART = 200000;   // ảnh base64 chỉ có ký tự ASCII
  const DENIED = ['not_granted', 'invalid_argument', 'capability_disabled', 'capability_removed', 'revoked', 'not_declared'];

  const newId = () => 's-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const parts = (str, n) => { const out = []; for (let i = 0; i < str.length; i += n) out.push(str.slice(i, i + n)); return out.length ? out : ['']; };
  const imageKey = img => (img && img.dataUrl ? img.dataUrl.length + ':' + img.dataUrl.slice(-48) : '');
  const imageOf = (dataUrl, mediaType) => (dataUrl ? { dataUrl, mediaType: mediaType || (dataUrl.match(/data:([^;]+)/) || [])[1] || 'image/png', base64: dataUrl.split(',')[1] } : null);
  const byNewest = (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt));
  const metaOf = (id, m) => ({ id, kind: m.kind, title: m.title, sub: m.sub, savedAt: m.savedAt, updatedAt: m.updatedAt });
  function err(code, message) { const e = new Error(message); e.code = code; return e; }

  /* ---------- Kho của tài khoản Claude ---------- */
  function remote(db, uid) {
    const col = db.collection('data/users/' + uid);
    async function list(kind) {
      const snap = await col.where('kind', '==', kind).get();
      return snap.docs.map(d => metaOf(d.id, d.data())).sort(byNewest);
    }
    async function writeParts(id, tag, chunks, oldCount) {
      for (let i = 0; i < chunks.length; i++) await col.doc(`${id}.${tag}${i}`).set({ d: chunks[i] });
      for (let i = chunks.length; i < (oldCount || 0); i++) await col.doc(`${id}.${tag}${i}`).delete();
    }
    const readParts = async (id, tag, n) => (await Promise.all(Array.from({ length: n || 0 }, (_, i) => col.doc(`${id}.${tag}${i}`).get())))
      .map(s => (s.exists ? String(s.data().d || '') : '')).join('');
    async function put(id, kind, rec) {
      const old = (await col.doc(id).get());
      const prev = old.exists ? old.data() : null;
      const stateChunks = parts(JSON.stringify(rec.state), STATE_PART);
      await writeParts(id, 's', stateChunks, prev && prev.sParts);
      const iKey = imageKey(rec.image);
      let iParts = prev ? prev.iParts || 0 : 0;
      if (!prev || prev.iKey !== iKey) {
        const chunks = rec.image ? parts(rec.image.dataUrl, IMAGE_PART) : [];
        await writeParts(id, 'i', chunks, iParts);
        iParts = chunks.length;
      }
      const now = new Date().toISOString();
      await col.doc(id).set({ kind, title: rec.title, sub: rec.sub, savedAt: prev ? prev.savedAt : now, updatedAt: now,
        sParts: stateChunks.length, iParts, iKey, mediaType: rec.image ? rec.image.mediaType : '' });
    }
    async function load(id) {
      const s = await col.doc(id).get();
      if (!s.exists) throw err('missing', 'Không tìm thấy bài này (có thể đã bị xoá).');
      const m = s.data();
      const [state, dataUrl] = await Promise.all([readParts(id, 's', m.sParts), readParts(id, 'i', m.iParts)]);
      return { meta: metaOf(id, m), state: JSON.parse(state), image: imageOf(dataUrl, m.mediaType) };
    }
    async function remove(id) {
      const s = await col.doc(id).get();
      const m = s.exists ? s.data() : {};
      await writeParts(id, 's', [], m.sParts);
      await writeParts(id, 'i', [], m.iParts);
      await col.doc(id).delete();
    }
    async function exists(id) { return (await col.doc(id).get()).exists; }
    return { where: 'account', list, put, load, remove, exists };
  }

  /* ---------- Trình duyệt này (IndexedDB) ---------- */
  function local() {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open('e-app-saved', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('items', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbp = null; reject(err('no_storage', 'Trình duyệt này không cho lưu bài (bộ nhớ IndexedDB bị chặn).')); };
    }));
    const run = (mode, fn) => open().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction('items', mode), st = tx.objectStore('items');
      const req = fn(st);
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(err(tx.error && tx.error.name === 'QuotaExceededError' ? 'quota_exceeded' : 'no_storage', 'Không lưu được vào trình duyệt này.'));
    }));
    async function list(kind) { return ((await run('readonly', st => st.getAll())) || []).filter(r => r.kind === kind).map(r => metaOf(r.id, r)).sort(byNewest); }
    async function put(id, kind, rec) {
      const prev = await run('readonly', st => st.get(id));
      const now = new Date().toISOString();
      await run('readwrite', st => st.put({ id, kind, title: rec.title, sub: rec.sub, savedAt: prev ? prev.savedAt : now, updatedAt: now, state: rec.state, image: rec.image || null }));
    }
    async function load(id) {
      const r = await run('readonly', st => st.get(id));
      if (!r) throw err('missing', 'Không tìm thấy bài này (có thể đã bị xoá).');
      return { meta: metaOf(r.id, r), state: r.state, image: r.image };
    }
    const remove = id => run('readwrite', st => st.delete(id));
    async function exists(id) { return !!(await run('readonly', st => st.get(id))); }
    return { where: 'browser', list, put, load, remove, exists };
  }

  /* ---------- Chọn nơi lưu ----------
   * Có kho tài khoản thì lưu bài mới vào đó; bài từng lưu trong trình duyệt (khi kho tài khoản từ chối) vẫn hiện
   * trong danh sách và được cập nhật / mở / xoá ngay tại trình duyệt. */
  let LOCAL = null;
  const localStore = () => LOCAL || (LOCAL = local());
  let main = null;
  function backend() {
    return main || (main = (async () => {
      try {
        if (window.claude && typeof window.claude.use === 'function') {
          const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
          const uid = db && user ? await user.id() : null;
          if (uid) return remote(db, uid);
        }
      } catch (e) { /* dùng trình duyệt */ }
      return localStore();
    })());
  }
  // Kho tài khoản từ chối (chưa cho phép, chỉ có quyền xem…) → từ giờ lưu trong trình duyệt
  async function guard(store, fn) {
    try { return await fn(store); }
    catch (e) {
      if (store.where === 'account' && DENIED.includes(e && e.code)) { main = Promise.resolve(localStore()); return fn(localStore()); }
      if (store.where === 'account' && e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 800 + Math.random() * 800)); return fn(store); }
      if (e && e.code === 'quota_exceeded') throw err('quota_exceeded', 'Kho lưu đã đầy. Xoá bớt bài đã lưu rồi thử lại.');
      throw e;
    }
  }
  async function list(kind) {
    const m = await backend();
    const items = (await guard(m, b => b.list(kind))).map(x => Object.assign(x, { where: m.where }));
    const m2 = await backend();
    if (m2.where === 'account') {
      try { items.push(...(await localStore().list(kind)).map(x => Object.assign(x, { where: 'browser' }))); } catch (e) { /* trình duyệt chặn bộ nhớ */ }
    }
    return items.sort(byNewest);
  }
  // Bài nằm ở kho nào (null: không còn)
  async function storeOf(id) {
    const m = await backend();
    if (await guard(m, b => b.exists(id))) return (await backend());
    if (m.where === 'account') { try { if (await localStore().exists(id)) return localStore(); } catch (e) { /* bỏ qua */ } }
    return null;
  }
  async function located(id) {
    const st = await storeOf(id);
    if (!st) throw err('missing', 'Không tìm thấy bài này (có thể đã bị xoá).');
    return st;
  }

  return {
    MAX,
    where: async () => { try { return (await backend()).where; } catch (e) { return 'browser'; } },
    list,
    load: async id => { const st = await located(id); return guard(st, b => b.load(id)); },
    remove: async id => { const st = await storeOf(id); if (st) await guard(st, b => b.remove(id)); },
    /* Lưu bài: id rỗng → bài mới (báo lỗi “full” nếu đã đủ 10 bài); có id → cập nhật bài đó. Trả về id. */
    save: async (kind, id, rec) => {
      let st = id ? await storeOf(id) : null;
      if (!st) {
        if ((await list(kind)).length >= MAX) throw err('full', `Đã lưu đủ ${MAX} bài. Xoá bớt một bài để lưu bài mới.`);
        st = await backend(); id = id || newId();
      }
      await guard(st, b => b.put(id, kind, rec));
      return id;
    },
  };
})();
