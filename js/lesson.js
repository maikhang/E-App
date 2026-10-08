/* 🎓 Bài giảng & bài tập làm quen biểu đồ (theo dàn ý Ms. Gigi).
 * Giáo viên dán ảnh biểu đồ → AI soạn bài giảng (đọc biểu đồ, đặc điểm chính, dàn ý + câu mẫu,
 * từ vựng, paraphrase, lỗi hay gặp) và bài tập nhỏ từ dễ đến khó. Học sinh làm ngay trên app;
 * giáo viên sao chép bài giảng / phiếu bài tập / đáp án để gửi. */
window.LESSON = (function () {
  const G = window.GIGI;
  const STORE = 'e-app.lesson.v1';
  const STEP_NAMES = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
  const TYPE_ORDER = ['mcq', 'tf', 'match', 'gap', 'order', 'write'];
  const TYPE_LABEL = { mcq: 'Trắc nghiệm đọc biểu đồ', tf: 'Đúng / Sai / Không có thông tin', match: 'Nối từ paraphrase', gap: 'Điền từ theo khung', order: 'Sắp xếp câu theo khung', write: 'Viết câu theo khung' };
  const TF_LABEL = { T: 'Đúng (True)', F: 'Sai (False)', NG: 'Không có thông tin (Not given)' };
  const LETTERS = 'ABCDEFGHIJKLMNOP';
  let H = null;           // các hàm dùng chung từ app.js
  let $, esc, toast;

  /* ================= State ================= */
  function blank() {
    return { image: null, prompt: '', type: 'auto', band: '7.0', types: TYPE_ORDER.slice(), count: 4, data: null, tab: 'lesson', isDemo: false };
  }
  let L = load();
  let ans = {};           // trạng thái làm bài (không lưu)
  function load() {
    try { const raw = localStorage.getItem(STORE); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* bỏ qua */ }
    return blank();
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(L)); }
      catch (e) { try { localStorage.setItem(STORE, JSON.stringify(Object.assign({}, L, { image: null }))); } catch (e2) { /* bỏ qua */ } }
    }, 200);
  }

  /* Trộn có hạt giống: cùng một bài thì thứ tự luôn giống nhau (trên màn hình và trên phiếu) */
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }
  function shuffled(arr, key) {
    const rnd = seeded(key), out = arr.map((x, i) => i);
    for (let n = 0; n < 6; n++) {
      for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
      if (out.length < 2 || out.some((v, i) => v !== i)) break;
    }
    return out;  // danh sách chỉ số
  }
  const picked = (st, ii) => st && st.sel && st.sel[ii] != null && st.sel[ii] !== '' ? +st.sel[ii] : null;
  const norm = s => String(s || '').toLowerCase().replace(/[“”"'’.,;:!?()]/g, ' ').replace(/\s+/g, ' ').trim();

  /* ================= Views ================= */
  let busy = false;
  function render() {
    $('#lesson-setup').hidden = busy || !!L.data;
    $('#lesson-loading').hidden = !busy;
    $('#lesson-result').hidden = busy || !L.data;
    if (busy) return;
    if (L.data) renderResult(); else renderSetup();
  }

  function renderSetup() {
    $('#ls-prompt').value = L.prompt;
    $('#ls-band').value = L.band;
    $('#ls-type').value = L.type;
    $('#ls-count').value = String(L.count);
    document.querySelectorAll('[name=ls-ex]').forEach(c => { c.checked = L.types.includes(c.value); });
    renderImage();
  }
  function renderImage() {
    const img = $('#ls-img');
    if (L.image) { img.src = L.image.dataUrl; img.hidden = false; $('#ls-drop-empty').hidden = true; $('#ls-img-clear').hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; $('#ls-drop-empty').hidden = false; $('#ls-img-clear').hidden = true; }
  }
  function takeImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const r = new FileReader();
    r.onload = () => H.downscale(r.result, file.type).then(img => { L.image = img; save(); renderImage(); toast('Đã nhận ảnh biểu đồ — bấm “Tạo bài giảng”.'); });
    r.readAsDataURL(file);
  }
  const setupVisible = () => !$('#view-lesson').hidden && !$('#lesson-setup').hidden;

  /* ================= Tạo bài giảng bằng AI ================= */
  let ctl = null, tick = null;
  async function generate() {
    L.prompt = $('#ls-prompt').value.trim();
    L.band = $('#ls-band').value; L.type = $('#ls-type').value; L.count = +$('#ls-count').value || 4;
    L.types = [...document.querySelectorAll('[name=ls-ex]:checked')].map(c => c.value);
    const note = $('#ls-note'); note.classList.remove('err');
    if (!L.prompt && !L.image) { note.textContent = 'Hãy dán ảnh biểu đồ hoặc đề bài trước khi bấm.'; note.classList.add('err'); return; }
    if (!L.types.length) { note.textContent = 'Chọn ít nhất một dạng bài tập.'; note.classList.add('err'); return; }
    save();
    const avail = await H.available();
    if (avail.via === 'key' && !H.getKey()) { H.openKey(); return; }
    busy = true; render();
    const t0 = Date.now();
    const stage = txt => { $('#ls-stage').textContent = txt; };
    $('#ls-elapsed').textContent = '0 giây';
    tick = setInterval(() => { $('#ls-elapsed').textContent = Math.round((Date.now() - t0) / 1000) + ' giây'; }, 1000);
    ctl = new AbortController();
    try {
      let visual = null, detected = '';
      if (L.image) {
        try {
          stage('Bước 1/2 · AI đang đọc ảnh biểu đồ: tiêu đề, trục, đơn vị, số liệu…');
          const r = await AI.readImage({ image: L.image, signal: ctl.signal });
          visual = r.visual; detected = r.task_type;
          if (!L.prompt && r.prompt_text) L.prompt = r.prompt_text;
        } catch (e) {
          if (e.code === 'cancelled') throw e;
          if (!['images_unavailable', 'image_rejected'].includes(e.code)) throw e;
          stage('Bước 1/2 · Chế độ xem này không gửi được ảnh cho AI — đang đọc chữ trong ảnh (OCR)…');
          try { visual = await AI.ocr(L.image, p => stage(`Bước 1/2 · Đang đọc chữ trong ảnh (OCR) ${Math.round(p * 100)}%…`)); }
          catch (oe) { if (!L.prompt) throw new Error('Không đọc được ảnh (' + oe.message + '). Hãy gõ đề vào ô văn bản rồi thử lại.'); }
        }
      }
      stage('Bước 2/2 · AI đang soạn bài giảng và bài tập theo dàn ý Ms. Gigi…');
      const type = L.type === 'auto' && detected ? ({ maps: 'maps', process: 'process' }[detected] || 'charts') : L.type;
      const types = TYPE_ORDER.filter(t => L.types.includes(t));
      const data = await AI.makeLesson({ text: L.prompt, type, band: L.band, visual, detected, types, count: L.count, signal: ctl.signal });
      if (!L.prompt && data.prompt_text) L.prompt = data.prompt_text;
      L.data = data; L.tab = 'lesson'; L.isDemo = false; ans = {};
      save();
      toast('Đã soạn xong bài giảng & bài tập.', 3000);
    } catch (e) {
      if (e.code !== 'cancelled') { $('#ls-note').textContent = '⚠️ ' + (e.message || 'AI chưa soạn được bài giảng. Thử lại.') + (e.code ? ` (mã: ${e.code})` : ''); $('#ls-note').classList.add('err'); }
    } finally {
      clearInterval(tick); ctl = null; busy = false; render(); window.scrollTo({ top: 0 });
    }
  }

  /* ================= Kết quả ================= */
  const fno = f => (f ? `<span class="fno">K${f}</span>` : '');
  function renderResult() {
    const d = L.data, o = G.OUTLINES[G.outlineFor(d.task_type, d.outline)];
    $('#lr-meta').textContent = `${o.short}${d.topic_vi ? ' · ' + d.topic_vi : ''}${L.isDemo ? ' · bài giảng mẫu (đề minh hoạ)' : ''}`;
    document.querySelectorAll('[data-ltab]').forEach(b => b.classList.toggle('on', b.dataset.ltab === L.tab));
    $('#lr-body').innerHTML = (L.tab === 'lesson' ? lessonView(d, o) : exercisesView(d)) ;
    const sc = L.tab === 'ex' ? scoreText() : '';
    $('#lr-score').textContent = sc; $('#lr-score').hidden = !sc;
  }

  function chartBlock(d) {
    return `<div class="l-chart">${L.image ? `<img src="${L.image.dataUrl}" alt="Biểu đồ của bài">` : ''}
      ${L.prompt || d.prompt_text ? `<p class="l-prompt">${esc(L.prompt || d.prompt_text)}</p>` : ''}</div>`;
  }

  function lessonView(d, o) {
    const x = d.lesson;
    const ul = a => `<ul>${a.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
    const plan = x.plan.map((p, i) => {
      const sec = o[G.STEP_KEYS[i]];
      return `<div class="l-plan">
        <h4>${['①', '②', '③', '④'][i]} ${STEP_NAMES[i]} <span class="muted">— ${esc(sec.rule)}</span></h4>
        ${p.focus_vi ? `<p class="l-focus">🎯 ${esc(p.focus_vi)}</p>` : ''}
        <div class="l-two">
          <div><h5>Khung câu</h5><ul class="frames">${sec.frames.map((f, n) => `<li><span class="fno">K${n + 1}</span> ${esc(f).replace(/\[([^\]]+)\]/g, '<span class="slot">[$1]</span>')}</li>`).join('')}</ul></div>
          <div><h5>Câu mẫu cho biểu đồ này</h5><ul class="frames">${p.model.map(m => `<li>${fno(m.f)} ${esc(m.text)}</li>`).join('') || '<li class="muted">—</li>'}</ul></div>
        </div></div>`;
    }).join('');
    return `${chartBlock(d)}
      ${x.objectives_vi.length ? `<section class="l-sec"><h3>🎯 Mục tiêu bài học</h3>${ul(x.objectives_vi)}</section>` : ''}
      <section class="l-sec"><h3>👀 Bước 1 · Đọc biểu đồ</h3><p class="muted small">Hỏi lớp từng câu trước, rồi bấm để hiện đáp án.</p>
        <ol class="l-read">${x.reading_steps.map(r => `<li><b>${esc(r.q_vi)}</b><details><summary>Hiện đáp án</summary><p>${esc(r.a)}</p></details></li>`).join('')}</ol></section>
      ${x.key_features.length ? `<section class="l-sec"><h3>⭐ Đặc điểm chính cần nhận ra</h3>${ul(x.key_features)}</section>` : ''}
      <section class="l-sec"><h3>📐 Bước 2 · Áp dụng dàn ý Ms. Gigi: ${esc(o.name)}</h3>${plan}</section>
      ${x.vocab.length ? `<section class="l-sec"><h3>📌 Từ vựng cho biểu đồ này</h3><div class="table-wrap"><table><thead><tr><th>Từ / cụm từ</th><th>Nghĩa</th><th>Ví dụ</th></tr></thead><tbody>
        ${x.vocab.map(v => `<tr><td>${esc(v.phrase)}</td><td>${esc(v.meaning_vi || '')}</td><td>${esc(v.example || '')}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
      ${d.paraphrase.length ? `<section class="l-sec"><h3>🔁 Từ paraphrase</h3>${H.paraphraseHtml(d.paraphrase)}</section>` : ''}
      ${x.mistakes_vi.length ? `<section class="l-sec"><h3>⚠️ Lỗi học sinh hay mắc</h3>${ul(x.mistakes_vi)}</section>` : ''}
      <div class="row end"><button type="button" class="btn primary" data-ltab="ex">✏️ Sang phần bài tập →</button></div>`;
  }

  /* ---------- Bài tập (làm trực tiếp) ---------- */
  function exercisesView(d) {
    return `${chartBlock(d)}` + d.exercises.map((e, ei) => {
      const head = `<div class="ex-head"><span class="ex-no">Bài ${ei + 1}</span><div><h3>${esc(e.title_vi || TYPE_LABEL[e.type])}</h3>
        <p class="muted small">${esc(e.instruction_vi || '')}</p></div></div>`;
      let body = '';
      if (e.type === 'mcq') body = e.items.map((it, ii) => {
        const a = (ans[ei] || {})[ii];
        return `<div class="ex-item"><p class="q">${ii + 1}. ${esc(it.q)}</p><div class="choices">${it.options.map((op, k) => {
          const cls = a == null ? '' : k === it.answer ? 'ok' : k === a ? 'bad' : '';
          return `<button type="button" class="choice ${cls}" data-ex="${ei}" data-it="${ii}" data-pick="${k}" ${a != null ? 'disabled' : ''}>${LETTERS[k]}. ${esc(op)}</button>`;
        }).join('')}</div>${a != null ? fb(a === it.answer, it.explain_vi, `Đáp án: ${LETTERS[it.answer]}`) : ''}</div>`;
      }).join('');
      if (e.type === 'tf') body = e.items.map((it, ii) => {
        const a = (ans[ei] || {})[ii];
        return `<div class="ex-item"><p class="q">${ii + 1}. ${esc(it.statement)}</p><div class="choices">${['T', 'F', 'NG'].map(k => {
          const cls = a == null ? '' : k === it.answer ? 'ok' : k === a ? 'bad' : '';
          return `<button type="button" class="choice ${cls}" data-ex="${ei}" data-it="${ii}" data-pick="${k}" ${a != null ? 'disabled' : ''}>${TF_LABEL[k]}</button>`;
        }).join('')}</div>${a != null ? fb(a === it.answer, it.explain_vi, `Đáp án: ${TF_LABEL[it.answer]}`) : ''}</div>`;
      }).join('');
      if (e.type === 'match') {
        const perm = shuffled(e.items, 'm' + ei + e.items.map(x => x.right).join());
        const st = ans[ei] || {};
        body = `<div class="match">${e.items.map((it, ii) => {
          const chk = st.checked ? (picked(st, ii) === ii ? 'ok' : 'bad') : '';
          return `<div class="m-row ${chk}"><span class="m-left">${ii + 1}. <b>${esc(it.left)}</b></span>
            <select data-ex="${ei}" data-it="${ii}" data-match aria-label="Chọn từ nối với ${esc(it.left)}"><option value="">— chọn —</option>${perm.map(p => `<option value="${p}" ${picked(st, ii) === p ? 'selected' : ''}>${LETTERS[perm.indexOf(p)]}. ${esc(e.items[p].right)}</option>`).join('')}</select>
            ${st.checked ? `<span class="m-key">${chk === 'ok' ? '✓' : '✗ ' + esc(it.right)}${it.meaning_vi ? ` <span class="vi">(${esc(it.meaning_vi)})</span>` : ''}</span>` : ''}</div>`;
        }).join('')}</div>`;
      }
      if (e.type === 'gap') {
        const st = ans[ei] || {};
        body = `<div class="bank"><span class="muted small">Ngân hàng từ:</span> ${shuffled(e.bank, 'b' + ei + e.bank.join()).map(k => `<button type="button" class="chip" data-bank="${ei}" data-word="${esc(e.bank[k])}">${esc(e.bank[k])}</button>`).join('')}</div>` +
          e.items.map((it, ii) => {
            let b = 0;
            const html = esc(it.sentence).replace(/_{2,}/g, () => {
              const bi = b++, v = ((st.val || {})[ii] || [])[bi] || '';
              const ok = st.checked ? norm(v) === norm(it.answers[bi]) : null;
              return `<input class="gap-in ${ok === true ? 'ok' : ok === false ? 'bad' : ''}" data-ex="${ei}" data-it="${ii}" data-b="${bi}" value="${esc(v)}" size="${Math.max(8, (it.answers[bi] || '').length)}" aria-label="Chỗ trống ${bi + 1} câu ${ii + 1}">`;
            });
            return `<div class="ex-item"><p class="q">${ii + 1}. ${html}</p>${st.checked ? fb(it.answers.every((a, bi) => norm(((st.val || {})[ii] || [])[bi]) === norm(a)), it.explain_vi, 'Đáp án: ' + it.answers.join(' · ')) : ''}</div>`;
          }).join('');
      }
      if (e.type === 'order') {
        const st = ans[ei] || (ans[ei] = { built: {} });
        body = e.items.map((it, ii) => {
          const perm = shuffled(it.chunks, 'o' + ei + ii + it.chunks.join());
          const built = st.built[ii] || [];
          const ok = st.checked ? built.map(k => it.chunks[k]).join(' ') === it.chunks.join(' ') : null;
          return `<div class="ex-item"><p class="q">${ii + 1}. ${it.frame ? `<span class="fno">${esc(String(it.frame).split(' ')[0])}</span> <span class="muted small">${esc(it.frame)}</span>` : ''}</p>
            <div class="order-built ${ok === true ? 'ok' : ok === false ? 'bad' : ''}" aria-label="Câu đang xếp">${built.map((k, n) => `<button type="button" class="chip on" data-ex="${ei}" data-it="${ii}" data-unpick="${n}">${esc(it.chunks[k])}</button>`).join('') || '<span class="muted small">Bấm các cụm bên dưới theo đúng thứ tự…</span>'}</div>
            <div class="order-pool">${perm.filter(k => !built.includes(k)).map(k => `<button type="button" class="chip" data-ex="${ei}" data-it="${ii}" data-chunk="${k}">${esc(it.chunks[k])}</button>`).join('')}</div>
            ${st.checked ? fb(ok, it.explain_vi, 'Đáp án: ' + it.chunks.join(' ')) : ''}</div>`;
        }).join('');
      }
      if (e.type === 'write') {
        const st = ans[ei] || (ans[ei] = { val: {}, show: {} });
        body = e.items.map((it, ii) => {
          const step = Math.max(0, STEP_NAMES.indexOf(it.para));
          const issues = st.val[ii] ? G.lint(st.val[ii], G.outlineFor(L.data.task_type, L.data.outline), step) : [];
          return `<div class="ex-item"><p class="q">${ii + 1}. <b>${esc(it.para || '')}</b> — ${esc(it.task_vi || '')}</p>
            ${it.frame ? `<p class="w-frame">📐 ${esc(it.frame).replace(/\[([^\]]+)\]/g, '<span class="slot">[$1]</span>')}</p>` : ''}
            ${it.hint_vi ? `<p class="muted small">💡 ${esc(it.hint_vi)}</p>` : ''}
            <textarea class="w-in" rows="3" data-ex="${ei}" data-it="${ii}" placeholder="Viết câu của em…">${esc(st.val[ii] || '')}</textarea>
            <div class="w-issues" data-issues="${ei}-${ii}">${issues.map(m => `<span class="warn-line">⚠️ ${esc(m)}</span>`).join('')}</div>
            <button type="button" class="btn sm" data-ex="${ei}" data-it="${ii}" data-model>${st.show[ii] ? 'Ẩn câu mẫu' : '👀 Xem câu mẫu'}</button>
            ${st.show[ii] ? `<p class="w-model">✅ ${esc(it.model || '')}</p>` : ''}</div>`;
        }).join('');
      }
      const needCheck = ['match', 'gap', 'order'].includes(e.type);
      const foot = needCheck ? `<div class="row ex-foot"><button type="button" class="btn sm primary" data-check="${ei}">Kiểm tra</button><button type="button" class="btn sm ghost" data-reset="${ei}">Làm lại</button><span class="ex-score">${exScore(ei)}</span></div>`
        : `<div class="row ex-foot"><button type="button" class="btn sm ghost" data-reset="${ei}">Làm lại</button><span class="ex-score">${exScore(ei)}</span></div>`;
      return `<section class="l-sec ex" id="ex-${ei}">${head}${body}${foot}</section>`;
    }).join('');
  }
  function fb(ok, explain, key) {
    return `<p class="fb ${ok ? 'ok' : 'bad'}">${ok ? '✓ Chính xác!' : '✗ Chưa đúng. ' + esc(key)}${explain ? ' — ' + esc(explain) : ''}</p>`;
  }
  // Điểm từng bài: [đúng, tổng] (bài viết không chấm điểm)
  function exPoints(ei) {
    const e = L.data.exercises[ei], st = ans[ei] || {};
    if (e.type === 'mcq' || e.type === 'tf') return [e.items.filter((it, ii) => st[ii] === it.answer).length, e.items.length, Object.keys(st).length];
    if (!st.checked) return [0, e.items.length, 0];
    if (e.type === 'match') return [e.items.filter((it, ii) => picked(st, ii) === ii).length, e.items.length, 1];
    if (e.type === 'gap') return [e.items.filter((it, ii) => it.answers.every((a, bi) => norm(((st.val || {})[ii] || [])[bi]) === norm(a))).length, e.items.length, 1];
    if (e.type === 'order') return [e.items.filter((it, ii) => (st.built[ii] || []).map(k => it.chunks[k]).join(' ') === it.chunks.join(' ')).length, e.items.length, 1];
    return null;
  }
  function exScore(ei) {
    const p = exPoints(ei);
    return p && p[2] ? `Đúng ${p[0]}/${p[1]}` : '';
  }
  function scoreText() {
    let ok = 0, all = 0;
    L.data.exercises.forEach((e, ei) => { const p = exPoints(ei); if (p) { ok += p[0]; all += p[1]; } });
    return all ? `Điểm: ${ok}/${all}` : '';
  }
  function rerender(ei) {
    const y = window.scrollY;
    renderResult();
    window.scrollTo(0, y);
  }

  /* ================= Sao chép ================= */
  function lessonCopy() {
    const d = L.data, x = d.lesson, o = G.OUTLINES[G.outlineFor(d.task_type, d.outline)];
    const line = '━━━━━━━━━━━━━━━━━━━━';
    const p = [`🎓 MS. NHI GIGI · BÀI GIẢNG IELTS WRITING TASK 1`, `Dạng: ${o.name}`];
    if (d.topic_vi) p.push(d.topic_vi);
    if (L.prompt || d.prompt_text) p.push('', '📝 ĐỀ BÀI', L.prompt || d.prompt_text);
    if (x.objectives_vi.length) p.push('', '🎯 MỤC TIÊU', ...x.objectives_vi.map(t => '• ' + t));
    p.push('', line, '👀 BƯỚC 1 · ĐỌC BIỂU ĐỒ', line, ...x.reading_steps.map((r, i) => `${i + 1}. ${r.q_vi}\n   → ${r.a}`));
    if (x.key_features.length) p.push('', '⭐ ĐẶC ĐIỂM CHÍNH', ...x.key_features.map(t => '• ' + t));
    p.push('', line, `📐 BƯỚC 2 · DÀN Ý MS. GIGI: ${o.name}`, line);
    x.plan.forEach((pl, i) => {
      const sec = o[G.STEP_KEYS[i]];
      p.push('', `${['①', '②', '③', '④'][i]} ${STEP_NAMES[i].toUpperCase()} — ${sec.rule}`);
      if (pl.focus_vi) p.push('Nội dung: ' + pl.focus_vi);
      p.push('Khung câu:', ...sec.frames.map((f, n) => `  K${n + 1}. ${f}`));
      if (pl.model.length) p.push('Câu mẫu:', ...pl.model.map(m => `  ${m.f ? 'K' + m.f : '•'} → ${m.text}`));
    });
    if (x.vocab.length) p.push('', line, '📌 TỪ VỰNG', line, ...x.vocab.map(v => `• ${v.phrase} (${v.meaning_vi || ''})${v.example ? '\n   VD: ' + v.example : ''}`));
    if (d.paraphrase.length) p.push('', line, '🔁 TỪ PARAPHRASE', line, ...d.paraphrase.map(w => `• ${w.word}${w.meaning_vi ? ' (' + w.meaning_vi + ')' : ''}\n` + w.alternatives.map(a => `   → ${a.phrase}${a.meaning_vi ? ' (' + a.meaning_vi + ')' : ''}${a.note_vi ? ' – ' + a.note_vi : ''}`).join('\n')));
    if (x.mistakes_vi.length) p.push('', '⚠️ LỖI HAY MẮC', ...x.mistakes_vi.map(t => '• ' + t));
    const plain = p.join('\n');
    const html = toHtml(plain);
    return { plain, html };
  }

  // Phiếu bài tập (withKey=false) hoặc đáp án (withKey=true)
  function worksheetCopy(withKey) {
    const d = L.data, line = '━━━━━━━━━━━━━━━━━━━━';
    const p = [withKey ? '🔑 ĐÁP ÁN · BÀI TẬP IELTS WRITING TASK 1' : '✏️ PHIẾU BÀI TẬP · IELTS WRITING TASK 1', 'Ms. Nhi Gigi', ''];
    if (!withKey && (L.prompt || d.prompt_text)) p.push('📝 ' + (L.prompt || d.prompt_text), '');
    d.exercises.forEach((e, ei) => {
      p.push(line, `BÀI ${ei + 1}. ${e.title_vi || TYPE_LABEL[e.type]}`, line);
      if (!withKey && e.instruction_vi) p.push(e.instruction_vi);
      if (e.type === 'mcq') e.items.forEach((it, ii) => p.push(withKey ? `${ii + 1}. ${LETTERS[it.answer]} – ${it.options[it.answer]}${it.explain_vi ? ' (' + it.explain_vi + ')' : ''}` : `${ii + 1}. ${it.q}\n   ` + it.options.map((op, k) => `${LETTERS[k]}. ${op}`).join('   ')));
      if (e.type === 'tf') e.items.forEach((it, ii) => p.push(withKey ? `${ii + 1}. ${it.answer === 'NG' ? 'NOT GIVEN' : it.answer === 'T' ? 'TRUE' : 'FALSE'}${it.explain_vi ? ' (' + it.explain_vi + ')' : ''}` : `${ii + 1}. ${it.statement}   (T / F / NG)`));
      if (e.type === 'match') {
        const perm = shuffled(e.items, 'm' + ei + e.items.map(x => x.right).join());
        if (withKey) e.items.forEach((it, ii) => p.push(`${ii + 1} – ${LETTERS[perm.indexOf(ii)]}. ${it.right}${it.meaning_vi ? ' (' + it.meaning_vi + ')' : ''}`));
        else { e.items.forEach((it, ii) => p.push(`${ii + 1}. ${it.left}   ____`)); p.push(''); perm.forEach((k, n) => p.push(`${LETTERS[n]}. ${e.items[k].right}`)); }
      }
      if (e.type === 'gap') {
        if (!withKey) p.push('Ngân hàng từ: ' + shuffled(e.bank, 'b' + ei + e.bank.join()).map(k => e.bank[k]).join(' / '));
        e.items.forEach((it, ii) => p.push(withKey ? `${ii + 1}. ${it.answers.join(' · ')}${it.explain_vi ? ' (' + it.explain_vi + ')' : ''}` : `${ii + 1}. ${it.sentence.replace(/_{2,}/g, '________')}`));
      }
      if (e.type === 'order') e.items.forEach((it, ii) => {
        if (withKey) p.push(`${ii + 1}. ${it.chunks.join(' ')}`);
        else p.push(`${ii + 1}. ${it.frame ? '[' + it.frame + '] ' : ''}` + shuffled(it.chunks, 'o' + ei + ii + it.chunks.join()).map(k => it.chunks[k]).join('  /  '), '   → ______________________________________________');
      });
      if (e.type === 'write') e.items.forEach((it, ii) => {
        if (withKey) p.push(`${ii + 1}. (${it.para}) ${it.model}`);
        else p.push(`${ii + 1}. ${it.para}: ${it.task_vi || ''}`, `   Khung: ${it.frame || ''}`, ...(it.hint_vi ? [`   Gợi ý: ${it.hint_vi}`] : []), '   ______________________________________________', '   ______________________________________________');
      });
      p.push('');
    });
    const plain = p.join('\n');
    return { plain, html: toHtml(plain, !withKey) };
  }
  // Chuyển bản chữ thường sang HTML gọn (giữ xuống dòng, tô đậm tiêu đề) để dán vào Word/Docs; kèm ảnh biểu đồ ở phiếu bài tập
  function toHtml(plain, withImage) {
    const body = plain.split('\n').map(l => {
      if (/^━+$/.test(l)) return '';
      const e = esc(l);
      if (/^(🎓|✏️|🔑|👀|📐|📌|🔁|⚠️|⭐|🎯|📝|BÀI \d|①|②|③|④)/.test(l)) return `<p style="margin:10px 0 4px;font-weight:bold;color:#2f6f45">${e}</p>`;
      return `<p style="margin:0 0 3px;white-space:pre-wrap">${e || '&nbsp;'}</p>`;
    }).join('');
    const img = withImage && L.image ? `<p><img src="${L.image.dataUrl}" style="max-width:520px" alt="Biểu đồ"></p>` : '';
    return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#1d281b">${img}${body}</div>`;
  }

  /* ================= Bài giảng mẫu ================= */
  // Biểu đồ minh hoạ vẽ bằng SVG (số liệu tự soạn, dựa theo bài mẫu Line graph của Ms. Gigi)
  function demoChart() {
    const years = [2000, 2005, 2010, 2015, 2020, 2025];
    const series = [
      { name: 'Car', color: '#2a78d6', data: [60, 58, 55, 48, 40, 35], mark: 'circle' },
      { name: 'Bus', color: '#eb6834', data: [25, 27, 30, 33, 36, 39], mark: 'square' },
      { name: 'Bicycle', color: '#1baf7a', data: [5, 7, 10, 13, 17, 20], mark: 'tri' },
    ];
    const W = 760, Hh = 440, l = 64, r = 96, t = 78, b = 56;
    const x = i => l + i * (W - l - r) / (years.length - 1), y = v => t + (70 - v) * (Hh - t - b) / 70;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" font-family="Arial, Helvetica, sans-serif">
      <rect width="${W}" height="${Hh}" fill="#ffffff"/>
      <text x="${l - 40}" y="30" font-size="17" font-weight="bold" fill="#1d281b">Percentage of commuters by means of transport, Metro City, 2000–2025</text>`;
    for (let v = 0; v <= 70; v += 10) s += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? '#e6e6e3' : '#9a9a95'}" stroke-width="1"/><text x="${l - 10}" y="${y(v) + 4}" font-size="12" text-anchor="end" fill="#55554f">${v}</text>`;
    years.forEach((yr, i) => { s += `<text x="${x(i)}" y="${Hh - b + 20}" font-size="12" text-anchor="middle" fill="#55554f">${yr}</text>`; });
    s += `<text x="18" y="${(t + Hh - b) / 2}" font-size="12" fill="#55554f" transform="rotate(-90 18 ${(t + Hh - b) / 2})" text-anchor="middle">Percentage of commuters (%)</text>`;
    let lx = l - 40;
    series.forEach(se => {
      s += `<polyline fill="none" stroke="${se.color}" stroke-width="2.5" stroke-linejoin="round" points="${se.data.map((v, i) => x(i) + ',' + y(v)).join(' ')}"/>`;
      se.data.forEach((v, i) => {
        const cx = x(i), cy = y(v);
        s += se.mark === 'circle' ? `<circle cx="${cx}" cy="${cy}" r="5" fill="${se.color}" stroke="#fff" stroke-width="2"/>`
          : se.mark === 'square' ? `<rect x="${cx - 5}" y="${cy - 5}" width="10" height="10" rx="1.5" fill="${se.color}" stroke="#fff" stroke-width="2"/>`
            : `<path d="M${cx} ${cy - 6} L${cx + 6} ${cy + 5} L${cx - 6} ${cy + 5} Z" fill="${se.color}" stroke="#fff" stroke-width="2"/>`;
      });
      const last = se.data[se.data.length - 1];
      s += `<text x="${x(years.length - 1) + 12}" y="${y(last) + (se.name === 'Bus' ? -4 : 4)}" font-size="13" fill="#1d281b">${se.name}</text>`;
      s += `<line x1="${lx}" x2="${lx + 22}" y1="54" y2="54" stroke="${se.color}" stroke-width="2.5"/><text x="${lx + 28}" y="58" font-size="13" fill="#1d281b">${se.name}</text>`;
      lx += 100;
    });
    s += '</svg>';
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    return { dataUrl: url, mediaType: 'image/svg+xml', base64: '' };
  }

  function demoLesson() {
    return {
      task_type: 'line', outline: 'trend',
      subject: 'the percentage of commuters in Metro City travelling by car, bus and bicycle, 2000–2025',
      topic_vi: 'Tỷ lệ người đi làm ở Metro City dùng ô tô, xe buýt và xe đạp (2000–2025).',
      prompt_text: 'The line graph below shows the percentage of commuters in Metro City who travelled to work by car, bus and bicycle between 2000 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      lesson: {
        objectives_vi: ['Đọc hiểu biểu đồ đường: trục, đơn vị, mốc thời gian và 3 đường số liệu.', 'Nhận ra 2 xu hướng ngược nhau và điểm hai đường cắt nhau.', 'Viết từng câu theo khung Line graph của Ms. Gigi.'],
        reading_steps: [
          { q_vi: 'Đây là dạng biểu đồ gì và nói về điều gì?', a: 'Biểu đồ đường (line graph), cho biết tỷ lệ % người đi làm ở Metro City dùng ô tô, xe buýt và xe đạp.' },
          { q_vi: 'Đơn vị là gì? Vậy chủ ngữ nên viết thế nào?', a: 'Phần trăm (%). Viết “the percentage / the proportion of car commuters”, không viết trống “Car increased”.' },
          { q_vi: 'Khoảng thời gian bao lâu? Dùng thì gì?', a: 'Từ 2000 đến 2025, mỗi mốc cách 5 năm → dùng thì quá khứ đơn.' },
          { q_vi: 'Năm 2000, phương tiện nào cao nhất và thấp nhất?', a: 'Ô tô cao nhất (60%), xe đạp thấp nhất (5%); xe buýt 25%.' },
          { q_vi: 'Xu hướng chính của mỗi đường là gì?', a: 'Ô tô giảm liên tục (60% → 35%); xe buýt (25% → 39%) và xe đạp (5% → 20%) đều tăng.' },
          { q_vi: 'Có điểm đặc biệt nào cần nhắc tới?', a: 'Khoảng năm 2023 xe buýt vượt ô tô và trở thành phương tiện phổ biến nhất vào năm 2025.' },
        ],
        key_features: ['Ô tô giảm từ 60% xuống 35%.', 'Xe buýt tăng từ 25% lên 39%, xe đạp tăng gấp 4 lần (5% → 20%).', 'Xe buýt vượt ô tô vào khoảng năm 2023.', 'Cuối giai đoạn, xe buýt là phương tiện phổ biến nhất.'],
        plan: [
          { step: 'intro', focus_vi: 'Paraphrase đề: shows → illustrates, giữ đủ 3 phương tiện và 2 mốc năm.', model: [{ f: 1, text: 'The line graph illustrates the percentage of commuters in Metro City who travelled to work by car, bus and bicycle between 2000 and 2025.' }] },
          { step: 'overview', focus_vi: 'Hai xu hướng ngược nhau (ô tô giảm, xe buýt & xe đạp tăng) + phương tiện phổ biến nhất cuối giai đoạn. Không ghi số.', model: [{ f: 1, text: 'Overall, it is obvious that while the proportion of car commuters experienced a downward trend, the opposite was true for bus and bicycle commuters.' }, { f: 2, text: 'In addition, the bus became the most popular means of transport at the end of the period.' }] },
          { step: 'body1', focus_vi: 'Số liệu năm 2000 của cả 3 đường, rồi 10 năm tiếp theo (đến 2010).', model: [{ f: 1, text: 'In 2000, the percentage of car commuters was 60%, while the proportions for bus and bicycle users were 25% and 5% respectively.' }, { f: 2, text: 'Over the next 10 years, the figure for car usage fell gradually to 55%, whereas the percentages of bus and bicycle commuters rose slightly to 30% and 10%.' }] },
          { step: 'body2', focus_vi: 'Giai đoạn 2010–2025: ô tô tiếp tục giảm, xe buýt & xe đạp tăng đều, điểm giao nhau khoảng 2023.', model: [{ f: 1, text: 'From 2010 to 2025, the proportion of people driving to work continued to decline significantly, falling to 35% at the end of the period.' }, { f: 1, text: 'Meanwhile, the figures for bus and bicycle commuters grew steadily, reaching 39% and 20% respectively.' }, { f: 2, text: 'Notably, the percentage of car commuters was overtaken by that of bus commuters in about 2023.' }] },
        ],
        vocab: [
          { phrase: 'commuters', meaning_vi: 'người đi làm hằng ngày', example: 'The percentage of commuters who travelled by bus rose.' },
          { phrase: 'the proportion of', meaning_vi: 'tỷ lệ của', example: 'The proportion of car commuters fell to 35%.' },
          { phrase: 'experienced a downward trend', meaning_vi: 'có xu hướng giảm', example: 'The proportion of car commuters experienced a downward trend.' },
          { phrase: 'fell gradually to', meaning_vi: 'giảm dần xuống', example: 'The figure for car usage fell gradually to 55%.' },
          { phrase: 'rose slightly to', meaning_vi: 'tăng nhẹ lên', example: 'Bus use rose slightly to 30% in 2010.' },
          { phrase: 'grew steadily', meaning_vi: 'tăng đều', example: 'The figure for bicycles grew steadily.' },
          { phrase: 'was overtaken by', meaning_vi: 'bị vượt qua bởi', example: 'Car use was overtaken by bus use in about 2023.' },
          { phrase: 'respectively', meaning_vi: 'lần lượt', example: 'Bus and bicycle users were 25% and 5% respectively.' },
          { phrase: 'at the end of the period', meaning_vi: 'vào cuối giai đoạn', example: 'The bus was the most popular at the end of the period.' },
        ],
        mistakes_vi: [
          '“Car decreased” (chủ ngữ trọc lốc) → “The percentage of car commuters decreased”.',
          '“The percentage witnessed a fall” → “The percentage experienced a fall” hoặc “The decade witnessed a fall in …”.',
          'Overview có số liệu → Overview chỉ nêu xu hướng, không ghi %.',
          'Liệt kê đủ cả 6 mốc năm → chỉ chọn năm đầu, 2010, điểm giao nhau và năm cuối.',
        ],
      },
      paraphrase: [
        { word: 'shows', meaning_vi: 'cho thấy', alternatives: [{ phrase: 'illustrates', meaning_vi: 'minh hoạ' }, { phrase: 'depicts', meaning_vi: 'mô tả' }] },
        { word: 'commuters', meaning_vi: 'người đi làm hằng ngày', alternatives: [{ phrase: 'people travelling to work', meaning_vi: 'người di chuyển đi làm' }, { phrase: 'workers', meaning_vi: 'người lao động', note_vi: 'chỉ dùng khi rõ là đi làm' }] },
        { word: 'car commuters', meaning_vi: 'người đi làm bằng ô tô', alternatives: [{ phrase: 'car users', meaning_vi: 'người dùng ô tô' }, { phrase: 'people driving to work', meaning_vi: 'người lái xe đi làm' }] },
        { word: 'bus', meaning_vi: 'xe buýt', alternatives: [{ phrase: 'bus users', meaning_vi: 'người đi xe buýt', note_vi: 'khi nói về người' }, { phrase: 'public transport', meaning_vi: 'giao thông công cộng', note_vi: 'nghĩa rộng hơn, dùng cẩn thận' }] },
        { word: 'bicycle', meaning_vi: 'xe đạp', alternatives: [{ phrase: 'bike', meaning_vi: 'xe đạp' }, { phrase: 'cycling to work', meaning_vi: 'đạp xe đi làm' }] },
        { word: 'percentage', meaning_vi: 'tỷ lệ phần trăm', alternatives: [{ phrase: 'proportion', meaning_vi: 'tỷ lệ' }, { phrase: 'figure', meaning_vi: 'số liệu' }] },
        { word: 'between 2000 and 2025', meaning_vi: 'giữa năm 2000 và 2025', alternatives: [{ phrase: 'from 2000 to 2025', meaning_vi: 'từ 2000 đến 2025' }, { phrase: 'over the 25-year period', meaning_vi: 'trong 25 năm' }] },
        { word: 'Metro City', meaning_vi: 'thành phố Metro', alternatives: [{ phrase: 'the city', meaning_vi: 'thành phố', note_vi: 'dùng ở lần nhắc thứ hai' }] },
      ],
      exercises: [
        { type: 'mcq', title_vi: 'Đọc biểu đồ', instruction_vi: 'Chọn đáp án đúng dựa vào biểu đồ.', items: [
          { q: 'Which means of transport was the most popular in 2000?', options: ['Car', 'Bus', 'Bicycle'], answer: 0, explain_vi: 'Ô tô 60%, cao nhất năm 2000.' },
          { q: 'What was the percentage of bicycle commuters in 2025?', options: ['About 10%', 'About 20%', 'About 39%'], answer: 1, explain_vi: 'Đường xe đạp kết thúc ở 20%.' },
          { q: 'In about which year did the bus overtake the car?', options: ['2015', '2020', '2023'], answer: 2, explain_vi: 'Hai đường cắt nhau giữa 2020 và 2025, khoảng năm 2023.' },
          { q: 'Which sentence describes the overall trend?', options: ['All three figures increased.', 'Car use fell, while bus and bicycle use rose.', 'Bus use fell, while car use rose.'], answer: 1, explain_vi: 'Ô tô giảm, xe buýt và xe đạp tăng.' },
        ] },
        { type: 'tf', title_vi: 'Đúng / Sai / Không có thông tin', instruction_vi: 'Câu nào đúng với biểu đồ?', items: [
          { statement: 'In 2000, more than half of commuters travelled to work by car.', answer: 'T', explain_vi: '60% > 50%.' },
          { statement: 'The percentage of bus users fell between 2000 and 2010.', answer: 'F', explain_vi: 'Xe buýt tăng từ 25% lên 30%.' },
          { statement: 'Cycling to work was cheaper than driving.', answer: 'NG', explain_vi: 'Biểu đồ không nói về chi phí.' },
          { statement: 'By 2025, the figure for bicycles was four times higher than in 2000.', answer: 'T', explain_vi: '5% → 20% = gấp 4 lần.' },
        ] },
        { type: 'match', title_vi: 'Nối từ paraphrase', instruction_vi: 'Nối từ trong đề (1–6) với cách viết khác cùng nghĩa (A–F).', items: [
          { left: 'commuters', right: 'people travelling to work', meaning_vi: 'người đi làm' },
          { left: 'car commuters', right: 'car users', meaning_vi: 'người dùng ô tô' },
          { left: 'percentage', right: 'proportion', meaning_vi: 'tỷ lệ' },
          { left: 'shows', right: 'illustrates', meaning_vi: 'minh hoạ' },
          { left: 'between 2000 and 2025', right: 'over the 25-year period', meaning_vi: 'trong 25 năm' },
          { left: 'rose', right: 'grew', meaning_vi: 'tăng' },
        ] },
        { type: 'gap', title_vi: 'Điền từ theo khung', instruction_vi: 'Chọn từ trong ngân hàng từ để hoàn thành câu theo khung Ms. Gigi.', bank: ['was', 'respectively', 'fell gradually to', 'the opposite was true for', 'was overtaken by', 'accounted for', 'witnessed', 'rose'], items: [
          { sentence: 'In 2000, the percentage of car commuters ____ 60%, while the proportions for bus and bicycle users were 25% and 5% ____.', answers: ['was', 'respectively'], explain_vi: 'Khung K1 Body 1: “… was …%, while the proportions for … were …% and …% respectively”.' },
          { sentence: 'Over the next 10 years, the figure for car usage ____ 55%.', answers: ['fell gradually to'], explain_vi: 'Giảm từ 60% xuống 55% → “fell gradually to”.' },
          { sentence: 'Overall, it is obvious that while the proportion of car commuters experienced a downward trend, ____ bus and bicycle commuters.', answers: ['the opposite was true for'], explain_vi: 'Khung K1 Overview.' },
          { sentence: 'The percentage of car commuters ____ that of bus commuters in about 2023.', answers: ['was overtaken by'], explain_vi: 'Khung K2 Body 2: “[A] was overtaken by [B] in [năm]”. Không dùng “witnessed” với chủ ngữ là percentage.' },
        ] },
        { type: 'order', title_vi: 'Sắp xếp câu theo khung', instruction_vi: 'Sắp xếp các cụm từ theo đúng thứ tự để tạo câu hoàn chỉnh.', items: [
          { frame: 'K1 · Introduction', chunks: ['The line graph illustrates', 'the percentage of commuters', 'in Metro City', 'who travelled to work by car, bus and bicycle', 'between 2000 and 2025.'], explain_vi: 'Name + Verb + Object + Time.' },
          { frame: 'K2 · Overview', chunks: ['In addition,', 'the bus', 'became the most popular', 'means of transport', 'at the end of the period.'], explain_vi: 'Câu 2 của Overview: cái phổ biến nhất cuối giai đoạn.' },
          { frame: 'K2 · Body 1', chunks: ['Over the next 10 years,', 'the percentages of', 'bus and bicycle commuters', 'rose slightly', 'to 30% and 10%.'], explain_vi: '“Over the next … years, …” nói xu hướng sau năm đầu.' },
          { frame: 'K1 · Body 2', chunks: ['From 2010 to 2025,', 'the proportion of people driving to work', 'continued to decline significantly,', 'falling to 35%', 'at the end of the period.'], explain_vi: '“From … to …,” mở đầu Body 2; “falling to” nối thêm số liệu.' },
        ] },
        { type: 'write', title_vi: 'Viết câu theo khung', instruction_vi: 'Viết 1 câu cho mỗi đoạn theo khung, rồi so với câu mẫu.', items: [
          { para: 'Introduction', frame: 'The line graph + illustrates + the percentage of + [chủ thể] + between [..] and [..].', task_vi: 'Viết câu mở bài.', hint_vi: 'Đổi shows → illustrates; giữ đủ car, bus, bicycle và 2000, 2025.', model: 'The line graph illustrates the percentage of commuters in Metro City who travelled to work by car, bus and bicycle between 2000 and 2025.' },
          { para: 'Overview', frame: 'Overall, it is obvious that while [S] + [V], the opposite was true for [cái còn lại].', task_vi: 'Viết câu tổng quan về 2 xu hướng ngược nhau.', hint_vi: 'Không ghi số liệu.', model: 'Overall, it is obvious that while the proportion of car commuters experienced a downward trend, the opposite was true for bus and bicycle commuters.' },
          { para: 'Body 1', frame: 'In [năm đầu], the percentage of [A] was [..]%, while the proportions for [B] and [C] were [..]% and [..]% respectively.', task_vi: 'Viết số liệu năm 2000.', hint_vi: 'Car 60%, bus 25%, bicycle 5%.', model: 'In 2000, the percentage of car commuters was 60%, while the proportions for bus and bicycle users were 25% and 5% respectively.' },
          { para: 'Body 2', frame: '[A] was overtaken by [B] in [năm].', task_vi: 'Viết câu về điểm hai đường cắt nhau.', hint_vi: 'Khoảng năm 2023.', model: 'The percentage of car commuters was overtaken by that of bus commuters in about 2023.' },
        ] },
      ],
    };
  }
  function loadDemo() {
    const keep = { band: L.band, types: L.types, count: L.count };
    L = Object.assign(blank(), keep, { image: demoChart(), prompt: '', type: 'charts', data: demoLesson(), isDemo: true });
    L.prompt = L.data.prompt_text;
    ans = {}; save(); render(); window.scrollTo({ top: 0 });
    toast('Đang xem bài giảng mẫu (biểu đồ minh hoạ).', 3000);
  }

  /* ================= Events ================= */
  function onClick(t, e) {
    if (t.dataset.ltab) { L.tab = t.dataset.ltab; save(); renderResult(); window.scrollTo({ top: 0, behavior: 'smooth' }); return true; }
    if (t.dataset.pick != null) {
      const ei = +t.dataset.ex, ii = +t.dataset.it, ex = L.data.exercises[ei];
      (ans[ei] = ans[ei] || {})[ii] = ex.type === 'tf' ? t.dataset.pick : +t.dataset.pick;
      rerender(ei); return true;
    }
    if (t.dataset.chunk != null) {
      const ei = +t.dataset.ex, ii = +t.dataset.it, st = ans[ei] || (ans[ei] = { built: {} });
      st.checked = false; (st.built[ii] = st.built[ii] || []).push(+t.dataset.chunk); rerender(ei); return true;
    }
    if (t.dataset.unpick != null) {
      const ei = +t.dataset.ex, ii = +t.dataset.it, st = ans[ei];
      st.checked = false; st.built[ii].splice(+t.dataset.unpick, 1); rerender(ei); return true;
    }
    if (t.dataset.bank != null) {
      // điền từ vào ô trống đang chọn (hoặc ô trống đầu tiên còn rỗng)
      const ei = t.dataset.bank;
      const inputs = [...document.querySelectorAll(`.gap-in[data-ex="${ei}"]`)];
      const target = (lastGap && lastGap.dataset.ex === ei && document.body.contains(lastGap)) ? lastGap : inputs.find(i => !i.value.trim());
      if (target) { target.value = t.dataset.word; target.dispatchEvent(new Event('input', { bubbles: true })); const nx = inputs.find(i => !i.value.trim()); (nx || target).focus(); }
      return true;
    }
    if (t.dataset.check != null) { const ei = +t.dataset.check; (ans[ei] = ans[ei] || {}).checked = true; rerender(ei); return true; }
    if (t.dataset.reset != null) { delete ans[+t.dataset.reset]; rerender(+t.dataset.reset); return true; }
    if (t.dataset.model != null) { const ei = +t.dataset.ex, ii = +t.dataset.it, st = ans[ei]; st.show[ii] = !st.show[ii]; rerender(ei); return true; }
    switch (t.id) {
      case 'ls-drop': $('#ls-file').click(); return true;
      case 'ls-img-clear': L.image = null; save(); renderImage(); return true;
      case 'ls-go': generate(); return true;
      case 'ls-demo': loadDemo(); return true;
      case 'ls-stop': if (ctl) ctl.abort(); return true;
      case 'lr-new': {
        const keep = { band: L.band, types: L.types, count: L.count, type: L.type };
        L = Object.assign(blank(), keep); ans = {}; save(); render(); window.scrollTo({ top: 0 }); return true;
      }
      case 'lr-copy-lesson': { const c = lessonCopy(); H.copyRich(c.plain, c.html, 'Đã sao chép bài giảng.'); return true; }
      case 'lr-copy-sheet': { const c = worksheetCopy(false); H.copyRich(c.plain, c.html, 'Đã sao chép phiếu bài tập (không có đáp án) — gửi học sinh.'); return true; }
      case 'lr-copy-key': { const c = worksheetCopy(true); H.copyRich(c.plain, c.html, 'Đã sao chép đáp án.'); return true; }
      case 'lr-img': if (L.image) { $('#dlg-img-src').src = L.image.dataUrl; $('#dlg-img').showModal(); } return true;
    }
    return false;
  }
  let lastGap = null;
  function bind() {
    document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('gap-in')) lastGap = e.target; });
    document.addEventListener('input', e => {
      const el = e.target;
      if (el.classList.contains('gap-in')) {
        const ei = +el.dataset.ex, ii = +el.dataset.it, st = ans[ei] || (ans[ei] = {});
        st.checked = false; st.val = st.val || {}; (st.val[ii] = st.val[ii] || [])[+el.dataset.b] = el.value;
        el.classList.remove('ok', 'bad');
      }
      if (el.classList.contains('w-in')) {
        const ei = +el.dataset.ex, ii = +el.dataset.it, st = ans[ei];
        st.val[ii] = el.value;
        const it = L.data.exercises[ei].items[ii];
        const issues = G.lint(el.value, G.outlineFor(L.data.task_type, L.data.outline), Math.max(0, STEP_NAMES.indexOf(it.para)));
        const box = document.querySelector(`[data-issues="${ei}-${ii}"]`);
        if (box) box.innerHTML = issues.map(m => `<span class="warn-line">⚠️ ${esc(m)}</span>`).join('');
      }
    });
    document.addEventListener('change', e => {
      const el = e.target;
      if (el.matches('[data-match]')) {
        const ei = +el.dataset.ex, st = ans[ei] || (ans[ei] = {});
        st.checked = false; (st.sel = st.sel || {})[+el.dataset.it] = el.value;
        el.closest('.m-row').classList.remove('ok', 'bad');
      }
    });
    $('#ls-file').addEventListener('change', e => { takeImage(e.target.files[0]); e.target.value = ''; });
    const dz = $('#ls-drop');
    dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#ls-file').click(); } });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); takeImage(e.dataTransfer.files[0]); });
  }

  function init(helpers) {
    H = helpers; $ = H.$; esc = H.esc; toast = H.toast;
    bind();
  }
  return { init, render, onClick, takeImage, setupVisible };
})();
