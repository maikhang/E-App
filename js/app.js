(function () {
  const C = window.CONTENT, G = window.GIGI;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORE = 'e-app.task1.v2';
  const STEP_NAMES = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
  const STEP_HINT = ['1 câu paraphrase đề', '2 câu, bắt đầu “Overall,”, không số liệu', '3–5 câu, có số liệu', '3–5 câu, số liệu + so sánh'];
  const TYPE_VI = { maps: 'Maps', process: 'Process', line: 'Line graph', bar: 'Bar chart', pie: 'Pie chart', table: 'Table', mixed: 'Mixed' };

  /* ================= State ================= */
  function blank() {
    return { view: 'setup', type: 'auto', band: '7.0', prompt: '', image: null, visual: null, analysis: null, step: 0, paras: ['', '', '', ''], picks: [[], [], [], []], blur: false, showFrames: false, open: null, isDemo: false };
  }
  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const s = Object.assign(blank(), JSON.parse(raw));
        // Bài lưu từ bản cũ (gợi ý cả đoạn) → chuyển sang gợi ý từng câu
        if (s.analysis && Array.isArray(s.analysis.steps)) s.analysis.steps = AI.upgradeSteps(s.analysis.steps);
        if (!Array.isArray(s.picks) || s.picks.length !== 4) s.picks = [[], [], [], []];
        // Đoạn đã viết ở bản cũ → tách thành từng câu (tự viết) để không mất bài
        if (s.analysis) s.paras.forEach((para, k) => {
          const slots = s.analysis.steps[k] && s.analysis.steps[k].sentences;
          if (!para || !slots || !slots.length || s.picks[k].some(Boolean)) return;
          const sents = para.trim().split(/(?<=[.!?])\s+/);
          slots.forEach((sl, j) => {
            const text = j === slots.length - 1 ? sents.slice(j).join(' ') : sents[j];
            if (text) s.picks[k][j] = { text, f: 0, custom: true, plan: sl.f[0] || 0 };
          });
        });
        s.open = null;
        return s;
      }
    } catch (e) { /* bỏ qua */ }
    return blank();
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(writeNow, 200);
  }
  function writeNow() {
    saveT = null;
    try { localStorage.setItem(STORE, JSON.stringify(S)); }
    catch (e) { try { localStorage.setItem(STORE, JSON.stringify(Object.assign({}, S, { image: null }))); } catch (e2) { /* bỏ qua */ } }
  }
  // Lưu ngay khi rời trang (save() chờ 200ms)
  addEventListener('pagehide', () => { if (saveT) { clearTimeout(saveT); writeNow(); } });
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  const wc = s => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'.,%-]*/g) || []).length;

  let AVAIL = { via: 'key', images: true };

  /* ================= Views ================= */
  function show(view) {
    S.view = view; save();
    for (const v of ['setup', 'loading', 'wizard', 'review', 'lesson']) $('#view-' + v).hidden = v !== view;
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', (b.dataset.mode === 'lesson') === (view === 'lesson')));
    $('#btn-new').hidden = view === 'lesson';
    if (view === 'lesson') LESSON.render();
    if (view === 'setup') renderSetup();
    if (view === 'wizard') renderStep();
    if (view === 'review') renderReview();
    window.scrollTo({ top: 0 });
  }

  /* ---------- Setup ---------- */
  function renderSetup() {
    document.querySelectorAll('input[name=type]').forEach(r => { r.checked = r.value === S.type; });
    $('#prompt').value = S.prompt;
    $('#band').value = S.band;
    renderImage();
    const note = $('#setup-note');
    note.classList.remove('err');
    if (AVAIL.via === 'claude') note.textContent = 'AI chạy bằng tài khoản Claude của bạn — không cần API key. Chỉ dán ảnh đề cũng được: AI đọc ảnh rồi tạo gợi ý. Lần đầu dùng, trang sẽ hỏi bạn có cho phép không.';
    else note.innerHTML = AI.getKey() ? 'Đang dùng Anthropic API key đã lưu (⚙️ để đổi).' : 'Mở ngoài claude.ai: cần Anthropic API key để dùng AI — bấm ⚙️ ở góc trên. Không có key vẫn bấm được “Xem bài mẫu”.';
  }
  function renderImage() {
    const img = $('#img-preview');
    if (S.image) { img.src = S.image.dataUrl; img.hidden = false; $('#drop-empty').hidden = true; $('#img-clear').hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; $('#drop-empty').hidden = false; $('#img-clear').hidden = true; }
  }

  /* ---------- Analyse ---------- */
  let ctl = null, tick = null;
  async function analyze() {
    S.prompt = $('#prompt').value.trim();
    if (!S.prompt && !S.image) { showSetupError('Hãy dán đề bài hoặc ảnh đề trước khi bấm.'); return; }
    AVAIL = await AI.available();   // chờ kết nối Claude xong rồi mới quyết định
    if (AVAIL.via === 'claude') $('#btn-key').hidden = true;
    if (AVAIL.via === 'key' && !AI.getKey()) { openKey(); return; }
    show('loading');
    const t0 = Date.now();
    const stage = txt => { $('#loading-stage').textContent = txt; };
    $('#elapsed').textContent = '0 giây';
    tick = setInterval(() => { $('#elapsed').textContent = Math.round((Date.now() - t0) / 1000) + ' giây'; }, 1000);
    ctl = new AbortController();
    try {
      // Bước 1: ảnh → chữ. Luôn thử gửi ảnh cho AI; nếu chế độ xem không gửi được ảnh thì OCR trong trình duyệt.
      S.visual = null;
      let detected = '';
      if (S.image) {
        try {
          stage('Bước 1/2 · AI đang đọc ảnh đề: câu hỏi, số liệu, chú thích…');
          const r = await AI.readImage({ image: S.image, signal: ctl.signal });
          S.visual = r.visual; detected = r.task_type;
          if (!S.prompt && r.prompt_text) S.prompt = r.prompt_text;
        } catch (e) {
          if (e.code === 'cancelled') throw e;
          if (!['images_unavailable', 'image_rejected'].includes(e.code)) throw e;
          stage('Bước 1/2 · Chế độ xem này không gửi được ảnh cho AI — đang đọc chữ trong ảnh (OCR)…');
          try {
            S.visual = await AI.ocr(S.image, p => stage(`Bước 1/2 · Đang đọc chữ trong ảnh (OCR) ${Math.round(p * 100)}%…`));
          } catch (oe) {
            if (!S.prompt) throw new Error('Không đọc được ảnh (' + oe.message + '). Hãy gõ đề vào ô văn bản rồi thử lại.');
          }
        }
      }
      stage('Bước 2/2 · AI đang tạo gợi ý bám sát đề cho 4 đoạn…');
      const type = S.type === 'auto' && detected ? ({ maps: 'maps', process: 'process' }[detected] || 'charts') : S.type;
      const r = await AI.analyze({ text: S.prompt, type, band: S.band, visual: S.visual, detected, signal: ctl.signal });
      S.analysis = r; S.step = 0; S.paras = ['', '', '', '']; S.picks = [[], [], [], []]; S.open = null; S.isDemo = false;
      revealed.clear();
      if (!S.prompt && r.prompt_text) S.prompt = r.prompt_text;
      show('wizard');
      toast(`Dàn ý Ms. Gigi: ${G.OUTLINES[r.outline].short} — ${r.subject || ''}`, 3500);
    } catch (e) {
      show('setup');
      if (e.code !== 'cancelled') showSetupError('⚠️ ' + (e.message || 'AI không đọc được đề. Thử lại.') + (e.code ? ` (mã: ${e.code})` : ''));
    } finally {
      clearInterval(tick); ctl = null;
    }
  }
  function showSetupError(msg) { const n = $('#setup-note'); n.textContent = msg; n.classList.add('err'); }

  function loadDemo() {
    S = Object.assign(blank(), { band: S.band, type: 'maps', blur: S.blur, prompt: C.demo.prompt_text, analysis: JSON.parse(JSON.stringify(C.demo)), isDemo: true });
    revealed.clear();
    show('wizard');
    toast('Đang xem bài mẫu (đề minh hoạ). Bấm “Nhập đề khác” để dùng đề của bạn.', 3500);
  }

  /* ---------- Wizard ---------- */
  // Tô màu trong gợi ý: chữ cố định của khung Ms. Gigi (đậm xanh) + từ vựng của đề (nền vàng)
  const reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function hl(text, vocab, fixed) {
    const out = esc(text);
    const fx = (fixed || []).map(t => t.toLowerCase());
    const vterms = (vocab || []).map(v => String(v.phrase || '').split('/')).flat()
      .map(t => t.replace(/\(.*?\)|\[.*?\]|\.{3}|…/g, '').trim()).filter(t => t.length > 2);
    const terms = [...new Set((fixed || []).concat(vterms))].sort((x, y) => y.length - x.length);
    if (!terms.length) return out;
    const re = new RegExp('\\b(' + terms.map(t => reEsc(esc(t))).join('|') + ')\\b', 'gi');
    return out.replace(re, m => fx.includes(m.toLowerCase()) ? `<b class="fx">${m}</b>` : `<mark>${m}</mark>`);
  }

  const outlineOf = a => G.outlineFor(a && a.task_type, a && a.outline);
  const LETTER = 'ABCD';
  const PCOLOR = ['#1f63b8', '#5a3fb5', '#1a7a43', '#c2501f'];   // màu từng đoạn (dùng chung cho bảng sao chép)
  const slotFrame = (o, i, f) => o[G.STEP_KEYS[i]].frames[f - 1] || '';
  const frameHtml = t => esc(t).replace(/\[([^\]]+)\]/g, '<span class="slot-ph">[$1]</span>');

  /* Trạng thái từng câu: S.picks[đoạn][câu] = { text, f, custom } | { skipped: true } */
  function picksOf(i) { return (S.picks[i] = S.picks[i] || []); }
  function syncPara(i) { S.paras[i] = picksOf(i).filter(p => p && p.text).map(p => p.text.trim()).join(' '); }
  function currentSlot(i) {
    const st = S.analysis.steps[i], ps = picksOf(i);
    if (S.open && S.open.step === i) return S.open.slot;
    const k = st.sentences.findIndex((_, n) => !ps[n]);
    return k;   // -1 = đã xong đoạn
  }
  const revealed = new Set();   // các câu đã bấm "xem gợi ý" khi đang che mờ
  const pending = {};           // câu đang được AI gợi ý lại: key → true

  function renderFrame(i) {
    const o = G.OUTLINES[outlineOf(S.analysis)];
    const sec = o[G.STEP_KEYS[i]];
    $('#frame-name').textContent = o.name;
    $('#frame-rule').textContent = sec.rule;
    $('#frame-list').innerHTML = sec.frames.map((f, n) => `<li><span class="fno">K${n + 1}</span> ${frameHtml(f)}</li>`).join('');
    $('#frame-box').hidden = !S.showFrames;
    $('#btn-frames').setAttribute('aria-pressed', String(!!S.showFrames));
    $('#btn-blur').setAttribute('aria-pressed', String(!!S.blur));
    $('#btn-blur').textContent = S.blur ? '👁️ Đang che gợi ý — bấm để bỏ che' : '🙈 Che mờ gợi ý';
  }

  function renderStepsNav() {
    $('#steps-nav').innerHTML = STEP_NAMES.map((n, k) => {
      const st = S.analysis.steps[k], ps = picksOf(k);
      const done = st.sentences.filter((_, j) => ps[j]).length, all = st.sentences.length;
      return `<button type="button" class="sn ${k === S.step ? 'on' : ''} ${done === all ? 'done' : ''}" data-goto="${k}" style="--pc:${PCOLOR[k]}">
        <span class="sn-no">${done === all ? '✓' : k + 1}</span><span class="sn-name">${n}</span><span class="sn-count">${done}/${all} câu</span></button>`;
    }).join('');
  }

  function renderSlots() {
    const a = S.analysis, i = S.step, st = a.steps[i], ps = picksOf(i);
    const o = G.OUTLINES[outlineOf(a)];
    const fixed = G.fixedPhrases(outlineOf(a), i);
    const cur = currentSlot(i);
    $('#skips').innerHTML = (st.skipped || []).length ? `<div class="skips"><b>Khung không dùng cho đề này:</b> ${st.skipped.map(k => `<span class="skip"><span class="fno muted-fno">K${k.f}</span> ${esc(k.why_vi)}</span>`).join('')}</div>` : '';
    $('#slots').innerHTML = st.sentences.map((sl, k) => {
      const p = ps[k], key = i + '-' + k;
      const frames = sl.status === 'replaced'
        ? `<div class="notice"><b>⚠️ Khung ${sl.f.map(n => 'K' + n).join('/')} của cô chưa phù hợp với đề này.</b> ${esc(sl.why_vi)}<br><span class="notice-alt">→ Đổi sang câu thay thế: <span class="slot-frame-txt">${frameHtml(sl.alt_frame)}</span></span></div>`
        : sl.f.map(n => `<div class="slot-frame"><span class="fno">K${n}</span> ${frameHtml(slotFrame(o, i, n))}</div>`).join('');
      const fTags = sl.f.map(n => `<span class="fno">K${n}</span>`).join('');
      const head = `<div class="slot-head"><span class="slot-title">Câu ${k + 1}</span>${fTags}${sl.status === 'replaced' ? '<span class="tag-warn">đã đổi khung</span>' : ''}<span class="slot-focus">${esc(sl.focus_vi)}</span></div>`;
      if (p && k !== cur) {
        return `<li class="slot done"><span class="slot-no" style="--pc:${PCOLOR[i]}">✓</span><div class="slot-body">${head}
          ${p.skipped ? '<p class="chosen muted">(Đã bỏ qua câu này)</p>' : `<p class="chosen">${p.f ? `<span class="fno">K${p.f}</span>` : '<span class="fno own-fno">Tự viết</span>'} ${hl(p.text, st.vocab, fixed)}</p>`}
          <button type="button" class="link" data-reopen="${k}">✏️ Đổi câu này</button></div></li>`;
      }
      if (k !== cur) {
        return `<li class="slot locked"><span class="slot-no">${k + 1}</span><div class="slot-body">${head}${sl.status === 'replaced' ? '' : frames}
          <p class="muted small">🔒 Viết xong câu ${cur + 1} để mở câu này.</p></div></li>`;
      }
      const blurred = S.blur && !revealed.has(key);
      const opts = pending[key]
        ? `<div class="sopts busy"><span class="spinner"></span> AI đang gợi ý câu ${k + 1} dựa trên các câu em đã chọn…</div>`
        : `<div class="sopts ${blurred ? 'blurred' : ''}" role="radiogroup" aria-label="Gợi ý cho câu ${k + 1}">
            ${sl.options.map((op, j) => `<button type="button" class="sopt ${p && p.text === op.text ? 'on' : ''}" data-slot="${k}" data-sopt="${j}" ${blurred ? 'tabindex="-1" aria-hidden="true"' : ''}>
              <span class="sopt-l">${LETTER[j]}</span><span class="sopt-t">${hl(op.text, st.vocab, fixed)}</span>${sl.f.length > 1 || op.f !== sl.f[0] ? `<span class="fno">K${op.f}</span>` : ''}</button>`).join('')}
            ${blurred ? `<button type="button" class="reveal" data-reveal="${key}">👀 Em đã nghĩ xong theo khung — xem gợi ý</button>` : ''}
          </div>`;
      const ownVal = p && p.custom ? p.text : '';
      return `<li class="slot current" id="slot-cur"><span class="slot-no" style="--pc:${PCOLOR[i]}">${k + 1}</span><div class="slot-body">${head}${frames}
        ${opts}
        <div class="own"><label class="sr" for="own-${key}">Tự viết câu ${k + 1}</label>
          <input id="own-${key}" class="own-in" data-slot="${k}" value="${esc(ownVal)}" placeholder="✍️ Hoặc tự viết câu ${k + 1} theo khung…" autocomplete="off">
          <button type="button" class="btn sm primary" data-own="${k}">Dùng câu này</button></div>
        <div class="own-lint" id="own-lint"></div>
        <div class="slot-tools">${S.isDemo ? '' : `<button type="button" class="btn sm ghost" data-sregen="${k}" ${pending[key] ? 'disabled' : ''}>↻ Gợi ý khác cho câu này</button>`}
          <button type="button" class="btn sm ghost" data-skipslot="${k}">⏭ Bỏ qua câu này</button>
          ${p ? `<button type="button" class="btn sm ghost" data-keep="${k}">Giữ câu đã chọn</button>` : ''}</div>
        <p class="note" id="slot-note"></p></div></li>`;
    }).join('') + (cur === -1 ? `<li class="slot finished"><span class="slot-no" style="--pc:${PCOLOR[i]}">★</span><div class="slot-body"><b>Đoạn ${STEP_NAMES[i]} đã xong!</b> <span class="muted">Đọc lại “Đoạn của em” bên dưới rồi sang đoạn tiếp theo.</span></div></li>` : '');
  }

  function renderPara() {
    const i = S.step, ps = picksOf(i), st = S.analysis.steps[i];
    syncPara(i);
    const sents = ps.map((p, k) => (p && p.text ? `<span class="ps"><sup>${k + 1}</sup>${esc(p.text)}</span>` : '')).filter(Boolean);
    $('#para-preview').innerHTML = sents.length ? sents.join(' ') : '<span class="muted">Chọn hoặc tự viết từng câu ở trên — đoạn văn sẽ hiện dần ở đây.</span>';
    $('#para-count').textContent = `${wc(S.paras[i])} từ · ${ps.filter(Boolean).length}/${st.sentences.length} câu`;
    const issues = G.lint(S.paras[i], outlineOf(S.analysis), i);
    $('#para-hint').innerHTML = issues.map(m => `<span class="warn-line">⚠️ ${esc(m)}</span>`).join('');
  }

  function renderStep() {
    const a = S.analysis;
    if (!a) { show('setup'); return; }
    const i = S.step, st = a.steps[i];
    renderStepsNav();
    $('#step-kicker').textContent = `Đoạn ${i + 1}/4 · ${STEP_NAMES[i]} · ${STEP_HINT[i]}`;
    $('#step-title').textContent = st.title || STEP_NAMES[i];
    $('#step-guide').textContent = st.guide_vi;
    renderFrame(i);
    $('#slots').style.setProperty('--pc', PCOLOR[i]);
    $('#steps-nav').closest('.card').style.setProperty('--pc', PCOLOR[i]);
    $('#step-vocab').innerHTML = st.vocab.length ? st.vocab.map(v => `<span class="chip">${esc(v.phrase)}${v.meaning_vi ? ` <i>· ${esc(v.meaning_vi)}</i>` : ''}</span>`).join('') : '<span class="muted small">—</span>';
    renderSlots();
    renderPara();
    $('#btn-prev').hidden = i === 0;
    $('#btn-next').textContent = i === 3 ? 'Xem bài hoàn chỉnh ✓' : `${STEP_NAMES[i + 1]} →`;
    $('#btn-next').classList.toggle('pulse', currentSlot(i) === -1);
    renderSide();
  }
  function refreshStep(scrollToCur) {
    const y = window.scrollY;
    save(); renderStep();
    if (scrollToCur) { const el = $('#slot-cur'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    else window.scrollTo(0, y);
  }

  // Chọn / tự viết / bỏ qua một câu
  function setPick(k, pick) {
    const i = S.step;
    picksOf(i)[k] = pick;
    S.open = null;
    syncPara(i);
    refreshStep(true);
  }
  function chooseOption(k, j) {
    const op = S.analysis.steps[S.step].sentences[k].options[j];
    setPick(k, { text: op.text, f: op.f, custom: false });
  }
  function useOwn(k) {
    const inp = document.querySelector(`.own-in[data-slot="${k}"]`);
    const text = (inp && inp.value || '').trim();
    if (!text) { toast('Hãy viết câu của em trước khi bấm “Dùng câu này”.'); return; }
    const sl = S.analysis.steps[S.step].sentences[k];
    setPick(k, { text: /[.!?]$/.test(text) ? text : text + '.', f: 0, custom: true, plan: sl.f[0] || 0 });
    // Câu tự viết có thể khác nội dung gợi ý → AI gợi ý lại câu tiếp theo dựa trên câu này
    const next = k + 1, st = S.analysis.steps[S.step];
    if (next < st.sentences.length && !picksOf(S.step)[next] && !S.isDemo) regenSlot(next, true);
  }

  async function regenSlot(k, auto) {
    const i = S.step, key = i + '-' + k;
    if (pending[key]) return;
    AVAIL = await AI.available();
    if (AVAIL.via === 'key' && !AI.getKey()) { if (!auto) openKey(); return; }
    pending[key] = true; refreshStep(false);
    try {
      const slot = await AI.regenSentence({ text: S.prompt, band: S.band, visual: S.visual, analysis: S.analysis, stepIndex: i, slotIndex: k, picks: S.picks });
      S.analysis.steps[i].sentences[k] = slot;
      toast(auto ? `Đã gợi ý câu ${k + 1} theo câu em vừa viết.` : `Đã có gợi ý mới cho câu ${k + 1}.`);
    } catch (e) {
      if (!auto) toast('⚠️ ' + (e.message || 'Không tạo được gợi ý mới.'), 4000);
    } finally {
      delete pending[key];
      if (S.step === i) refreshStep(false); else save();
    }
  }

  function renderSide() {
    const a = S.analysis;
    $('#ref-topic').textContent = `${G.OUTLINES[outlineOf(a)].short}${a.topic_vi ? ' · ' + a.topic_vi : ''}`;
    $('#ref-text').textContent = S.prompt || a.prompt_text || '';
    const vis = $('#ref-visual');
    if (S.visual && S.visual.text) {
      vis.hidden = false;
      $('#ref-visual-title').textContent = S.visual.source === 'ocr' ? 'Chữ đọc được từ ảnh (OCR)' : 'AI đọc được từ ảnh';
      $('#ref-visual-text').textContent = S.visual.text;
    } else vis.hidden = true;
    renderParaphrase();
    if (S.image) { $('#ref-img').src = S.image.dataUrl; $('#ref-img-btn').hidden = false; } else $('#ref-img-btn').hidden = true;
    const total = S.paras.reduce((n, p) => n + wc(p), 0);
    $('#mini-count').textContent = `${total} / 150 từ`;
    $('#mini').innerHTML = STEP_NAMES.map((n, k) => `<li class="${k === S.step ? 'cur' : ''}">${n}${S.paras[k] ? `<p>${esc(S.paras[k])}</p>` : ' <span class="ph">— chưa viết</span>'}</li>`).join('');
  }

  function go(delta) {
    const i = S.step;
    syncPara(i);
    if (delta > 0 && !S.paras[i]) { toast('Hãy chọn hoặc tự viết ít nhất một câu cho đoạn này trước khi tiếp tục.'); return; }
    if (delta > 0) {
      const left = S.analysis.steps[i].sentences.filter((_, k) => !picksOf(i)[k]).length;
      if (left) toast(`Đoạn ${STEP_NAMES[i]} còn ${left} câu chưa viết — em có thể quay lại sau.`, 3200);
    }
    S.open = null;
    if (delta > 0 && i === 3) { save(); show('review'); return; }
    S.step = Math.min(3, Math.max(0, i + delta));
    save(); renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Paraphrase theo đề ---------- */
  function paraphraseHtml(list) {
    if (!list || !list.length) return '<p class="muted small">Chưa có — bấm “AI đọc đề & tạo gợi ý” để AI soạn từ paraphrase cho đề này.</p>';
    return `<ul class="pp">${list.map(x => `<li><b>${esc(x.word)}</b>${x.meaning_vi ? ` <span class="vi">(${esc(x.meaning_vi)})</span>` : ''}
      <span class="arrow">→</span> ${x.alternatives.map(a => `<span class="alt">${esc(a.phrase)}${a.meaning_vi ? ` <span class="vi">(${esc(a.meaning_vi)})</span>` : ''}${a.note_vi ? ` <span class="note">— ${esc(a.note_vi)}</span>` : ''}</span>`).join('<span class="sep">; </span>')}</li>`).join('')}</ul>`;
  }
  function paraphraseText(a) {
    const list = (a && a.paraphrase) || [];
    const head = `TỪ PARAPHRASE CHO ĐỀ${a && a.subject ? ': ' + a.subject : ''}`;
    return head + '\n' + list.map(x => `• ${x.word}${x.meaning_vi ? ' (' + x.meaning_vi + ')' : ''} → ` +
      x.alternatives.map(v => v.phrase + (v.meaning_vi ? ' (' + v.meaning_vi + ')' : '') + (v.note_vi ? ' – ' + v.note_vi : '')).join('; ')).join('\n');
  }
  function renderParaphrase() {
    const a = S.analysis || {};
    for (const id of ['#pp-side', '#pp-review']) { const el = $(id); if (el) el.innerHTML = paraphraseHtml(a.paraphrase); }
  }
  async function copyText(txt, okMsg, fallbackEl) {
    try { await navigator.clipboard.writeText(txt); toast(okMsg); }
    catch (err) {
      if (fallbackEl) { const r = document.createRange(); r.selectNodeContents(fallbackEl); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
      toast('Đã bôi đen nội dung — nhấn Ctrl+C để sao chép.');
    }
  }

  /* ---------- Bài học hoàn chỉnh (sao chép gửi học sinh) ---------- */
  // Mỗi câu trong bài gắn với khung Ms. Gigi (hoặc khung thay thế khi khung của cô không hợp với đề)
  function sentenceRows(k) {
    const a = S.analysis, st = a && a.steps[k];
    if (!st) return [];
    const o = G.OUTLINES[outlineOf(a)], ps = picksOf(k);
    return st.sentences.map((sl, j) => {
      const p = ps[j];
      if (!p || p.skipped || !p.text) return null;
      const f = (p.custom ? (p.plan || sl.f[0]) : (p.f || sl.f[0])) || 0;
      const replaced = sl.status === 'replaced';
      return { f, text: p.text.trim(), custom: !!p.custom, replaced, why: sl.why_vi, frame: replaced ? sl.alt_frame : slotFrame(o, k, f) };
    }).filter(Boolean);
  }
  function lessonData() {
    const a = S.analysis || {};
    const o = G.OUTLINES[outlineOf(a)];
    return {
      a, o,
      words: S.paras.reduce((n, p) => n + wc(p), 0),
      prompt: S.prompt || a.prompt_text || '',
      sections: STEP_NAMES.map((name, k) => ({
        name, para: (S.paras[k] || '').trim(), rule: o[G.STEP_KEYS[k]].rule,
        rows: sentenceRows(k),
        skipped: (a.steps && a.steps[k] && a.steps[k].skipped) || [],
        vocab: (a.steps && a.steps[k] && a.steps[k].vocab) || [],
      })),
      paraphrase: a.paraphrase || [],
    };
  }
  const NUM = ['①', '②', '③', '④'];
  function lessonPlain() {
    const d = lessonData();
    const line = '━━━━━━━━━━━━━━━━━━━━';
    const out = ['📘 MS. NHI GIGI · IELTS WRITING TASK 1', `Dạng đề: ${d.o.name}`];
    if (d.a.subject) out.push(`Chủ đề: ${d.a.subject}`);
    if (d.prompt) out.push('', '📝 ĐỀ BÀI', d.prompt);
    out.push('', line, `✍️ 1. BÀI VIẾT HOÀN CHỈNH (${d.words} từ)`, line);
    d.sections.forEach((x, k) => { if (x.para) out.push('', `${NUM[k]} ${x.name}`, x.para); });
    out.push('', line, '📐 2. PHÂN TÍCH TỪNG CÂU THEO DÀN Ý MS. GIGI', line);
    d.sections.forEach((x, k) => {
      if (!x.rows.length) return;
      out.push('', `${NUM[k]} ${x.name.toUpperCase()} — ${x.rule}`);
      x.rows.forEach((r, n) => {
        out.push(`  Câu ${n + 1}${r.f ? ' · ' + (r.replaced ? '⚠️ đổi khung K' : 'K') + r.f : ''}${r.custom ? ' · tự viết' : ''}`);
        if (r.replaced && r.why) out.push(`     Lý do: ${r.why}`);
        if (r.frame) out.push(`     Khung: ${r.frame}`);
        out.push(`     ➜ ${r.text}`);
      });
      x.skipped.forEach(sk => out.push(`  (Không dùng K${sk.f}: ${sk.why_vi})`));
      if (x.vocab.length) out.push('  Từ vựng: ' + x.vocab.map(v => v.phrase + (v.meaning_vi ? ' (' + v.meaning_vi + ')' : '')).join(' · '));
    });
    if (d.paraphrase.length) {
      out.push('', line, '🔁 3. TỪ PARAPHRASE (từ trong đề → cách viết khác)', line);
      d.paraphrase.forEach(x => out.push(`• ${x.word}${x.meaning_vi ? ' (' + x.meaning_vi + ')' : ''}`,
        ...x.alternatives.map(v => `   → ${v.phrase}${v.meaning_vi ? ' (' + v.meaning_vi + ')' : ''}${v.note_vi ? ' – ' + v.note_vi : ''}`)));
    }
    return out.join('\n');
  }
  // Bảng màu (style inline để dán vào Word / Google Docs / Gmail vẫn giữ màu)
  const PTINT = ['#eaf1fb', '#f0ecfa', '#e7f4ec', '#fcefe7'];
  function lessonHtml() {
    const d = lessonData();
    const B = '1px solid #d5dfd0';
    const td = (x, st, attrs) => `<td style="border:${B};padding:7px 9px;vertical-align:top;${st || ''}"${attrs || ''}>${x}</td>`;
    const th = (x, st) => `<th style="border:${B};padding:7px 9px;text-align:left;vertical-align:top;${st || ''}">${x}</th>`;
    const table = rows => `<table style="border-collapse:collapse;width:100%;margin:0 0 14px;font-size:14px;line-height:1.5">${rows}</table>`;
    const h2 = t => `<h2 style="font-size:17px;margin:22px 0 8px;color:#2f6f45;border-bottom:3px solid #2f6f45;padding-bottom:4px">${t}</h2>`;
    const ph = (t, c) => esc(t).replace(/\[([^\]]+)\]/g, `<b style="color:${c}">[$1]</b>`);
    const vi = t => t ? ` <span style="color:#5b6957">(${esc(t)})</span>` : '';
    let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1d281b;max-width:860px">`;
    h += table(`<tr><td style="background:#2f6f45;color:#ffffff;padding:14px 16px;border-radius:0">
      <div style="font-size:21px;font-weight:bold">📘 Ms. Nhi Gigi · IELTS Writing Task 1</div>
      <div style="font-size:14px;margin-top:2px">Bài học hoàn chỉnh theo dàn ý Ms. Gigi</div></td></tr>`);
    const info = [['Dạng đề', esc(d.o.name)]];
    if (d.a.subject) info.push(['Chủ đề', esc(d.a.subject)]);
    info.push(['Số từ', `${d.words} từ${d.words < 150 ? ' <span style="color:#b42318">(cần tối thiểu 150 từ)</span>' : ''}`]);
    if (d.prompt) info.push(['Đề bài', `<i>${esc(d.prompt)}</i>`]);
    h += table(info.map(([k, v]) => `<tr>${td('<b>' + k + '</b>', 'background:#e0eee2;width:110px;white-space:nowrap')}${td(v)}</tr>`).join(''));

    h += h2(`✍️ 1. Bài viết hoàn chỉnh (${d.words} từ)`);
    h += table(d.sections.map((x, k) => `<tr>${td(`<b>${NUM[k]} ${x.name}</b>`, `background:${PCOLOR[k]};color:#ffffff;width:120px;white-space:nowrap`)}${td(x.para ? esc(x.para) : '<span style="color:#8a958a">— chưa viết —</span>', `background:${PTINT[k]};font-family:Georgia,'Times New Roman',serif;font-size:15px`)}</tr>`).join(''));

    h += h2('📐 2. Phân tích từng câu theo dàn ý Ms. Gigi');
    h += `<p style="margin:0 0 10px;color:#5b6957">Mỗi câu trong bài ↔ khung câu của cô. Chữ <b style="color:#2f6f45">[trong ngoặc]</b> là phần em điền thông tin của đề. Ô vàng = khung của cô không hợp với đề này nên đã đổi sang câu khác.</p>`;
    d.sections.forEach((x, k) => {
      if (!x.rows.length) return;
      const c = PCOLOR[k];
      let rows = `<tr><td colspan="3" style="background:${c};color:#ffffff;padding:8px 10px;border:1px solid ${c}"><b>${NUM[k]} ${x.name}</b> <span style="font-size:13px">— ${esc(x.rule)}</span></td></tr>`;
      rows += `<tr>${th('Câu', `background:${PTINT[k]};width:70px`)}${th('Khung câu của cô', `background:${PTINT[k]};width:42%`)}${th('Câu trong bài', `background:${PTINT[k]}`)}</tr>`;
      rows += x.rows.map((r, n) => {
        const zebra = n % 2 ? '#fafbf9' : '#ffffff';
        const no = `<b>Câu ${n + 1}</b>` + (r.f ? `<br><span style="display:inline-block;margin-top:2px;padding:0 6px;border-radius:8px;background:${r.replaced ? '#fbf1d9' : PTINT[k]};color:${r.replaced ? '#93600a' : c};font-size:12px;font-weight:bold">K${r.f}</span>` : '');
        const frame = r.replaced
          ? td(`<b style="color:#93600a">⚠️ Đổi khung K${r.f}</b>${r.why ? ` — <span style="color:#5b4300">${esc(r.why)}</span>` : ''}<br>➜ ${ph(r.frame, '#93600a')}`, 'background:#fff6dc')
          : td(ph(r.frame, c), `background:${zebra}`);
        return `<tr>${td(no, `background:${zebra};white-space:nowrap`)}${frame}${td(esc(r.text) + (r.custom ? ' <span style="color:#5b6957;font-size:12px">(tự viết)</span>' : ''), `background:${zebra};font-family:Georgia,'Times New Roman',serif;font-size:15px`)}</tr>`;
      }).join('');
      if (x.skipped.length) rows += `<tr>${td(`<span style="color:#5b6957"><b>Khung không dùng:</b> ${x.skipped.map(sk => `K${sk.f} — ${esc(sk.why_vi)}`).join(' · ')}</span>`, 'background:#f6f7f5', ' colspan="3"')}</tr>`;
      if (x.vocab.length) rows += `<tr>${td(`<b>Từ vựng:</b> ${x.vocab.map(v => `<b style="color:${c}">${esc(v.phrase)}</b>${vi(v.meaning_vi)}`).join(' · ')}`, 'background:#fbfcfa', ' colspan="3"')}</tr>`;
      h += table(rows);
    });

    if (d.paraphrase.length) {
      h += h2('🔁 3. Từ paraphrase (từ trong đề → cách viết khác)');
      const hd = 'background:#2f6f45;color:#ffffff;border-color:#2f6f45';
      let rows = `<tr>${th('Từ trong đề', hd)}${th('Nghĩa', hd)}${th('Cách viết khác', hd)}${th('Nghĩa', hd)}${th('Lưu ý', hd)}</tr>`;
      d.paraphrase.forEach((x, n) => {
        const bg = n % 2 ? '#ffffff' : '#f3f8f0';
        const alts = x.alternatives.length ? x.alternatives : [{ phrase: '—' }];
        alts.forEach((v, j) => {
          rows += '<tr>' + (j === 0 ? td(`<b>${esc(x.word)}</b>`, `background:${bg}`, ` rowspan="${alts.length}"`) + td(esc(x.meaning_vi || ''), `background:${bg};color:#5b6957`, ` rowspan="${alts.length}"`) : '') +
            td(`<b style="color:#2f6f45">${esc(v.phrase)}</b>`, `background:${bg}`) + td(esc(v.meaning_vi || ''), `background:${bg};color:#5b6957`) + td(v.note_vi ? `<i style="color:#93600a">${esc(v.note_vi)}</i>` : '', `background:${bg}`) + '</tr>';
        });
      });
      h += table(rows);
    }
    return h + '<p style="color:#8a958a;font-size:12px;margin:6px 0 0">Soạn bằng Ms. Nhi Gigi · IELTS Writing Task 1</p></div>';
  }
  async function copyRich(plain, html, okMsg) {
    try {
      if (window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([plain], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]);
      } else await navigator.clipboard.writeText(plain);
      toast(okMsg);
    } catch (e) {
      try { await navigator.clipboard.writeText(plain); toast(okMsg); }
      catch (e2) { toast('Trình duyệt chặn sao chép. Hãy bôi đen nội dung và nhấn Ctrl+C.'); }
    }
  }
  function copyLesson() {
    if (!S.paras.some(p => p.trim())) { toast('Chưa có bài viết để sao chép.'); return; }
    copyRich(lessonPlain(), lessonHtml(), 'Đã sao chép bài học (bảng màu) — dán vào Word, Google Docs, Gmail hoặc Zalo gửi học sinh.');
  }

  /* ---------- Review ---------- */
  function renderReview() {
    renderParaphrase();
    const a = S.analysis || {};
    const total = S.paras.reduce((n, p) => n + wc(p), 0);
    $('#review-meta').textContent = `Dàn ý Ms. Gigi: ${G.OUTLINES[outlineOf(a)].short}${a.subject ? ' · ' + a.subject : ''} · ${total} từ${total < 150 ? ' (Task 1 cần tối thiểu 150 từ)' : ''}`;
    const vocab = (a.steps || []).map(s => s.vocab).flat();
    $('#paper').innerHTML = STEP_NAMES.map((n, k) => `<div class="para-block">
      <h3><span>Đoạn ${k + 1}: ${n}</span><a href="#" class="edit" data-edit="${k}">Sửa đoạn này</a></h3>
      ${S.paras[k] ? `<p>${hl(S.paras[k], vocab)}</p>` : '<p class="empty">Chưa viết.</p>'}
      ${G.lint(S.paras[k], outlineOf(a), k).map(m => `<p class="warn-line">⚠️ ${esc(m)}</p>`).join('')}</div>`).join('');
    $('#lesson-preview').innerHTML = S.paras.some(p => p.trim()) ? lessonHtml() : '<p class="muted">Chưa có bài viết.</p>';
  }
  function essayText() {
    return S.paras.map(p => p.trim()).filter(Boolean).join('\n\n');
  }

  /* ---------- Thư viện dàn ý Ms. Gigi ---------- */
  let libTab = null;
  function renderVocab() {
    const cur = S.analysis ? outlineOf(S.analysis) : null;
    const tabs = [['general', 'Quy tắc chung']].concat(Object.keys(G.OUTLINES).map(id => [id, G.OUTLINES[id].short])).concat([['mapsvocab', 'Từ vựng Maps']]);
    if (!libTab) libTab = cur || 'general';
    $('#vocab-tabs').innerHTML = tabs.map(([id, n]) => `<button type="button" class="tab ${id === libTab ? 'on' : ''}" data-libtab="${id}">${esc(n)}${id === cur ? ' •' : ''}</button>`).join('');
    const ul = arr => `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    let html = '';
    if (libTab === 'general') {
      html = `<div class="rule-box"><h3>Quy tắc vàng</h3>${ul(G.GENERAL.golden)}</div>
        <div class="vsec"><h3>Công thức chủ thể theo chủ đề</h3><ul>${G.GENERAL.subjects.map(x => `<li><b>${esc(x.group)}:</b> ${esc(x.items)}</li>`).join('')}</ul></div>
        <div class="vsec"><h3>3 tuyệt chiêu đổi cấu trúc</h3>${ul(G.GENERAL.changeTricks)}</div>
        <div class="vsec"><h3>Từ đồng nghĩa (không lệch nghĩa)</h3>${ul(G.GENERAL.synonyms)}</div>
        <div class="vsec"><h3>Mô tả tăng / giảm</h3>${ul(G.GENERAL.trendBasic)}</div>
        <div class="vsec"><h3>Pie / Bar: công thức S + V + O</h3>${ul(G.GENERAL.pieBar)}</div>
        <div class="vsec"><h3>Nâng cấp ghép câu (Band 7+)</h3>${ul(G.GENERAL.band7)}</div>`;
    } else if (libTab === 'mapsvocab') {
      const row = v => `<tr><td>${esc(v.phrase)}</td><td>${esc(v.meaning)}</td><td>${esc(v.usage)} <i>“${esc(v.example)}”</i></td><td>${esc(v.note)}</td></tr>`;
      const table = list => `<div class="table-wrap"><table><thead><tr><th>Từ/Cụm từ</th><th>Ý nghĩa</th><th>Cách sử dụng</th><th>Ghi chú</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`;
      html = `<div class="vsec"><h3>A. Từ vựng miêu tả sự thay đổi (Body 2)</h3>${table(C.changeVocab)}</div>
        <div class="vsec"><h3>B. Từ vựng miêu tả vị trí (Body 1 và Body 2)</h3>${table(C.positionVocab)}</div>
        <div class="vsec"><h3>Các cấu trúc viết</h3><ul>${C.writingStructures.map(g => `<li><b>${esc(g.group)}:</b> ${g.items.map(esc).join(' · ')}</li>`).join('')}</ul></div>
        <div class="vsec"><h3>Bảng cấu trúc câu</h3><div class="table-wrap"><table><thead><tr><th>Cấu trúc</th><th>Công thức</th><th>Ví dụ</th></tr></thead><tbody>
          ${C.sentenceStructures.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.formula)}</td><td>${esc(x.example)}</td></tr>`).join('')}</tbody></table></div></div>`;
    } else {
      const o = G.OUTLINES[libTab];
      const sec = (k, n) => `<div class="vsec"><h3>${n} — <span class="muted">${esc(o[k].rule)}</span></h3><ul class="frames">${o[k].frames.map(f => `<li>${esc(f).replace(/\[([^\]]+)\]/g, '<span class="slot-ph">[$1]</span>')}</li>`).join('')}</ul></div>`;
      html = `<p class="muted">${esc(o.when)}</p>
        ${sec('intro', 'Introduction')}${sec('overview', 'Overview')}${sec('body1', 'Body 1')}${sec('body2', 'Body 2')}
        <div class="rule-box"><h3>Lưu ý & từ vựng</h3>${ul(o.rules)}</div>
        ${o.sample ? `<div class="vsec"><h3>Bài mẫu</h3><div class="paper">${o.sample.split('\n').map(p => `<div class="para-block"><p>${esc(p)}</p></div>`).join('')}</div></div>` : ''}`;
    }
    const own = S.analysis && !S.isDemo ? (S.analysis.steps || []).map((x, k) => x.vocab.length ? `<p><b>${STEP_NAMES[k]}:</b> ${x.vocab.map(v => esc(v.phrase) + (v.meaning_vi ? ' <span class="muted">(' + esc(v.meaning_vi) + ')</span>' : '')).join(' · ')}</p>` : '').join('') : '';
    $('#vocab-content').innerHTML = html + (own ? `<div class="vsec"><h3>Từ vựng riêng cho đề đang làm</h3>${own}</div>` : '');
  }

  /* ================= Image ================= */
  function takeFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => downscale(reader.result, file.type).then(img => { S.image = img; S.visual = null; save(); renderImage(); toast('Đã nhận ảnh đề bài — bấm “AI đọc đề & tạo gợi ý”.'); });
    reader.readAsDataURL(file);
  }
  // Thu nhỏ ảnh (cạnh dài ≤ 1600px) để gửi AI nhanh hơn và lưu được
  function downscale(dataUrl, type) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * scale); cv.height = Math.round(im.height * scale);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        const mediaType = type === 'image/png' ? 'image/png' : 'image/jpeg';
        const url = cv.toDataURL(mediaType, 0.9);
        resolve({ dataUrl: url, mediaType, base64: url.split(',')[1] });
      };
      im.onerror = () => resolve({ dataUrl, mediaType: type, base64: String(dataUrl).split(',')[1] });
      im.src = dataUrl;
    });
  }

  /* ================= Dialogs ================= */
  function openKey() { $('#api-key').value = AI.getKey(); $('#dlg-key').showModal(); }

  /* ================= Events ================= */
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, a, .dropzone, [data-close]');
    if (!t) return;
    if (t.matches('[data-close]')) { t.closest('dialog').close(); return; }
    if (t.dataset.mode) { show(t.dataset.mode === 'lesson' ? 'lesson' : (S.analysis ? 'wizard' : 'setup')); return; }
    if (S.view === 'lesson' && LESSON.onClick(t, e)) return;
    if (t.dataset.libtab) { libTab = t.dataset.libtab; renderVocab(); $('#dlg-vocab .dlg-body').scrollTop = 0; return; }
    if (t.dataset.edit != null) { e.preventDefault(); S.step = +t.dataset.edit; show('wizard'); return; }
    // ----- Gợi ý từng câu -----
    if (t.dataset.goto != null) { S.open = null; S.step = +t.dataset.goto; save(); renderStep(); return; }
    if (t.dataset.sopt != null) { chooseOption(+t.dataset.slot, +t.dataset.sopt); return; }
    if (t.dataset.own != null) { useOwn(+t.dataset.own); return; }
    if (t.dataset.reopen != null) { S.open = { step: S.step, slot: +t.dataset.reopen }; refreshStep(true); return; }
    if (t.dataset.keep != null) { S.open = null; refreshStep(true); return; }
    if (t.dataset.skipslot != null) { setPick(+t.dataset.skipslot, { skipped: true }); return; }
    if (t.dataset.sregen != null) { regenSlot(+t.dataset.sregen, false); return; }
    if (t.dataset.reveal != null) {
      revealed.add(t.dataset.reveal); refreshStep(false);
      const first = document.querySelector('#slot-cur .sopt'); if (first) first.focus();
      return;
    }
    switch (t.id) {
      case 'dropzone': $('#file').click(); return;
      case 'img-clear': S.image = null; S.visual = null; save(); renderImage(); return;
      case 'btn-analyze': analyze(); return;
      case 'btn-demo': loadDemo(); return;
      case 'btn-stop': if (ctl) ctl.abort(); return;
      case 'btn-prev': go(-1); return;
      case 'btn-next': go(1); return;
      case 'btn-blur': S.blur = !S.blur; revealed.clear(); refreshStep(false); toast(S.blur ? 'Đã che gợi ý — học sinh đọc khung và tự nghĩ câu trước nhé.' : 'Đã bỏ che gợi ý.'); return;
      case 'btn-frames': S.showFrames = !S.showFrames; save(); renderFrame(S.step); return;
      case 'ref-img-btn': $('#dlg-img-src').src = S.image.dataUrl; $('#dlg-img').showModal(); return;
      case 'btn-vocab': libTab = null; renderVocab(); $('#dlg-vocab').showModal(); return;
      case 'btn-key': openKey(); return;
      case 'api-save': AI.setKey($('#api-key').value.trim()); toast('Đã lưu API key.'); if (S.view === 'setup') renderSetup(); return;
      case 'api-clear': AI.setKey(''); $('#api-key').value = ''; toast('Đã xoá API key.'); return;
      case 'btn-new': case 'btn-new-2': {
        if (S.view === 'loading') return;
        const keep = { band: S.band, type: S.type, blur: S.blur };
        S = Object.assign(blank(), keep); revealed.clear(); save(); show('setup'); $('#prompt').focus(); return;
      }
      case 'btn-copy-pp': case 'btn-copy-pp2': {
        const a = S.analysis;
        if (!a || !a.paraphrase || !a.paraphrase.length) { toast('Chưa có từ paraphrase để sao chép.'); return; }
        copyText(paraphraseText(a), 'Đã sao chép từ paraphrase — dán gửi học sinh.', t.id === 'btn-copy-pp' ? $('#pp-side') : $('#pp-review'));
        return;
      }
      case 'btn-copy-lesson': copyLesson(); return;
      case 'btn-copy-all': {
        const txt = essayText();
        if (!txt) { toast('Chưa có nội dung để sao chép.'); return; }
        copyText(txt + '\n\n' + paraphraseText(S.analysis), 'Đã sao chép bài viết + từ paraphrase.', $('#paper'));
        return;
      }
      case 'btn-copy': {
        const txt = essayText();
        if (!txt) { toast('Chưa có nội dung để sao chép.'); return; }
        try { await navigator.clipboard.writeText(txt); toast('Đã sao chép toàn bộ bài viết.'); }
        catch (err) {
          const r = document.createRange(); r.selectNodeContents($('#paper'));
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
          toast('Đã bôi đen bài viết — nhấn Ctrl+C để sao chép.');
        }
      }
    }
  });
  $('#dropzone').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file').click(); } });
  $('#file').addEventListener('change', e => { takeFile(e.target.files[0]); e.target.value = ''; });
  $('#prompt').addEventListener('input', e => { S.prompt = e.target.value; save(); });
  $('#band').addEventListener('change', e => { S.band = e.target.value; save(); });
  $('#types').addEventListener('change', e => { if (e.target.name === 'type') { S.type = e.target.value; save(); } });
  // Ô tự viết câu: kiểm tra nhanh theo quy tắc của dàn ý, Enter = dùng câu này
  $('#slots').addEventListener('input', e => {
    if (!e.target.classList.contains('own-in')) return;
    const k = +e.target.dataset.slot;
    const issues = G.lint(e.target.value, outlineOf(S.analysis), S.step).filter(m => !(k > 0 && /Overall/.test(m)));
    $('#own-lint').innerHTML = e.target.value.trim() ? issues.map(m => `<span class="warn-line">⚠️ ${esc(m)}</span>`).join('') : '';
  });
  $('#slots').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('own-in')) { e.preventDefault(); useOwn(+e.target.dataset.slot); }
  });
  document.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items ? [...e.clipboardData.items] : [];
    const img = items.find(i => i.type.startsWith('image/'));
    if (!img) return;
    if (S.view === 'lesson' && LESSON.setupVisible()) { e.preventDefault(); LESSON.takeImage(img.getAsFile()); return; }
    if (S.view !== 'setup') return;
    e.preventDefault(); takeFile(img.getAsFile());
  });
  const dz = $('#dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); takeFile(e.dataTransfer.files[0]); });

  /* ================= Start ================= */
  LESSON.init({ $, esc, toast, downscale, copyRich, paraphraseHtml, available: () => AI.available(), getKey: () => AI.getKey(), openKey });
  const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
  if (IN_CLAUDE) $('#btn-key').hidden = true;
  show(S.view === 'loading' ? 'setup' : (S.view !== 'setup' && S.view !== 'lesson' && !S.analysis ? 'setup' : S.view));
  AI.available().then(a => { AVAIL = a; if (a.via === 'claude') $('#btn-key').hidden = true; if (S.view === 'setup') renderSetup(); });
})();
