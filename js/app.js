(function () {
  const C = window.CONTENT;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORE = 'e-app.task1.v2';
  const STEP_NAMES = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
  const STEP_HINT = ['1 câu paraphrase đề', '2 câu, bắt đầu “Overall,”, không số liệu', '3–5 câu, có số liệu', '3–5 câu, số liệu + so sánh'];
  const TYPE_VI = { maps: 'Maps', process: 'Process', line: 'Line graph', bar: 'Bar chart', pie: 'Pie chart', table: 'Table', mixed: 'Mixed' };

  /* ================= State ================= */
  function blank() {
    return { view: 'setup', type: 'auto', band: '7.0', prompt: '', image: null, visual: null, analysis: null, step: 0, paras: ['', '', '', ''], isDemo: false };
  }
  let S = load();
  function load() {
    try { const raw = localStorage.getItem(STORE); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* bỏ qua */ }
    return blank();
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(S)); }
      catch (e) { try { localStorage.setItem(STORE, JSON.stringify(Object.assign({}, S, { image: null }))); } catch (e2) { /* bỏ qua */ } }
    }, 200);
  }
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }
  const wc = s => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'.,%-]*/g) || []).length;

  let AVAIL = { via: 'key', images: true };

  /* ================= Views ================= */
  function show(view) {
    S.view = view; save();
    for (const v of ['setup', 'loading', 'wizard', 'review']) $('#view-' + v).hidden = v !== view;
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
      const r = await AI.analyze({ text: S.prompt, type, band: S.band, visual: S.visual, signal: ctl.signal });
      S.analysis = r; S.step = 0; S.paras = ['', '', '', '']; S.isDemo = false;
      if (!S.prompt && r.prompt_text) S.prompt = r.prompt_text;
      show('wizard');
      toast(`AI nhận dạng: ${TYPE_VI[r.task_type] || r.task_type} — ${r.subject || ''}`, 3500);
    } catch (e) {
      show('setup');
      if (e.code !== 'cancelled') showSetupError('⚠️ ' + (e.message || 'AI không đọc được đề. Thử lại.') + (e.code ? ` (mã: ${e.code})` : ''));
    } finally {
      clearInterval(tick); ctl = null;
    }
  }
  function showSetupError(msg) { const n = $('#setup-note'); n.textContent = msg; n.classList.add('err'); }

  function loadDemo() {
    S = Object.assign(blank(), { band: S.band, type: 'maps', prompt: C.demo.prompt_text, analysis: JSON.parse(JSON.stringify(C.demo)), isDemo: true });
    show('wizard');
    toast('Đang xem bài mẫu (đề minh hoạ). Bấm “Nhập đề khác” để dùng đề của bạn.', 3500);
  }

  /* ---------- Wizard ---------- */
  // Tô đậm từ vựng riêng của đề trong các gợi ý
  function hl(text, vocab) {
    let out = esc(text);
    const terms = (vocab || []).map(v => String(v.phrase || '').split('/')).flat()
      .map(t => t.replace(/\(.*?\)|\[.*?\]|\.{3}|…/g, '').trim()).filter(t => t.length > 2)
      .sort((a, b) => b.length - a.length);
    if (!terms.length) return out;
    const re = new RegExp('\\b(' + terms.map(t => esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi');
    return out.replace(re, '<mark>$1</mark>');
  }

  function renderStep() {
    const a = S.analysis;
    if (!a) { show('setup'); return; }
    const i = S.step, st = a.steps[i];
    $('#progress').innerHTML = STEP_NAMES.map((_, k) => `<span class="${k <= i ? 'on' : ''}"></span>`).join('');
    $('#step-kicker').textContent = `Đoạn ${i + 1}: ${STEP_NAMES[i]} · ${STEP_HINT[i]}`;
    $('#step-title').textContent = st.title || STEP_NAMES[i];
    $('#step-count').textContent = `Đoạn ${i + 1} / 4`;
    $('#step-guide').textContent = st.guide_vi;
    $('#step-vocab').innerHTML = st.vocab.length ? st.vocab.map(v => `<span class="chip">${esc(v.phrase)}${v.meaning_vi ? ` <i>· ${esc(v.meaning_vi)}</i>` : ''}</span>`).join('') : '<span class="muted small">—</span>';
    $('#options').innerHTML = st.options.map((o, k) => {
      const on = S.paras[i] === o;
      return `<button type="button" class="opt" role="radio" aria-checked="${on}" data-opt="${k}"><span class="dot" aria-hidden="true"></span>
        <span><span class="lbl">Gợi ý bám sát đề ${k + 1}</span><span class="txt">${hl(o, st.vocab)}</span></span></button>`;
    }).join('');
    $('#para').value = S.paras[i];
    updateCount();
    $('#btn-prev').hidden = i === 0;
    $('#btn-next').textContent = i === 3 ? 'Xem bài hoàn chỉnh ✓' : `${STEP_NAMES[i + 1]} →`;
    $('#btn-regen').hidden = S.isDemo;
    $('#regen-note').textContent = '';
    $('#regen-note').classList.remove('err');
    renderSide();
  }
  function updateCount() {
    const n = wc($('#para').value);
    $('#para-count').textContent = `${n} từ`;
    const i = S.step;
    const hint = i === 0 && n > 45 ? 'Introduction nên chỉ 1 câu.' : i === 1 && /\d/.test($('#para').value) ? 'Overview không nên có số liệu.' : '';
    $('#para-hint').textContent = hint;
  }
  function renderSide() {
    const a = S.analysis;
    $('#ref-topic').textContent = `${TYPE_VI[a.task_type] || ''}${a.topic_vi ? ' · ' + a.topic_vi : ''}`;
    $('#ref-text').textContent = S.prompt || a.prompt_text || '';
    const vis = $('#ref-visual');
    if (S.visual && S.visual.text) {
      vis.hidden = false;
      $('#ref-visual-title').textContent = S.visual.source === 'ocr' ? 'Chữ đọc được từ ảnh (OCR)' : 'AI đọc được từ ảnh';
      $('#ref-visual-text').textContent = S.visual.text;
    } else vis.hidden = true;
    if (S.image) { $('#ref-img').src = S.image.dataUrl; $('#ref-img-btn').hidden = false; } else $('#ref-img-btn').hidden = true;
    const total = S.paras.reduce((n, p) => n + wc(p), 0);
    $('#mini-count').textContent = `${total} / 150 từ`;
    $('#mini').innerHTML = STEP_NAMES.map((n, k) => `<li class="${k === S.step ? 'cur' : ''}">${n}${S.paras[k] ? `<p>${esc(S.paras[k])}</p>` : ' <span class="ph">— chưa viết</span>'}</li>`).join('');
  }

  function go(delta) {
    S.paras[S.step] = $('#para').value.trim();
    if (delta > 0 && !S.paras[S.step]) { toast('Hãy chọn 1 gợi ý hoặc tự viết đoạn này trước khi tiếp tục.'); return; }
    save();
    if (delta > 0 && S.step === 3) { show('review'); return; }
    S.step = Math.min(3, Math.max(0, S.step + delta));
    save(); renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function regen(btn) {
    AVAIL = await AI.available();
    if (AVAIL.via === 'key' && !AI.getKey()) { openKey(); return; }
    S.paras[S.step] = $('#para').value.trim();
    const note = $('#regen-note');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang viết gợi ý mới…';
    note.classList.remove('err'); note.textContent = 'Thường mất 20–60 giây.';
    try {
      const opts = await AI.regenerate({ text: S.prompt, band: S.band, visual: S.visual, analysis: S.analysis, stepIndex: S.step, chosen: S.paras });
      S.analysis.steps[S.step].options = opts.concat(S.analysis.steps[S.step].options.filter(o => o === S.paras[S.step]));
      save(); renderStep();
      toast('Đã có 3 gợi ý mới.');
    } catch (e) {
      note.textContent = '⚠️ ' + (e.message || 'Không tạo được gợi ý mới.'); note.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = '↻ Gợi ý khác';
    }
  }

  /* ---------- Review ---------- */
  function renderReview() {
    const a = S.analysis || {};
    const total = S.paras.reduce((n, p) => n + wc(p), 0);
    $('#review-meta').textContent = `${TYPE_VI[a.task_type] || ''}${a.subject ? ' · ' + a.subject : ''} · ${total} từ${total < 150 ? ' (Task 1 cần tối thiểu 150 từ)' : ''}`;
    const vocab = (a.steps || []).map(s => s.vocab).flat();
    $('#paper').innerHTML = STEP_NAMES.map((n, k) => `<div class="para-block">
      <h3><span>Đoạn ${k + 1}: ${n}</span><a href="#" class="edit" data-edit="${k}">Sửa đoạn này</a></h3>
      ${S.paras[k] ? `<p>${hl(S.paras[k], vocab)}</p>` : '<p class="empty">Chưa viết.</p>'}</div>`).join('');
  }
  function essayText() {
    return S.paras.map(p => p.trim()).filter(Boolean).join('\n\n');
  }

  /* ---------- Kho từ vựng ---------- */
  function renderVocab() {
    const row = v => `<tr><td>${esc(v.phrase)}</td><td>${esc(v.meaning)}</td><td>${esc(v.usage)} <i>“${esc(v.example)}”</i></td><td>${esc(v.note)}</td></tr>`;
    const table = list => `<div class="table-wrap"><table><thead><tr><th>Từ/Cụm từ</th><th>Ý nghĩa</th><th>Cách sử dụng</th><th>Ghi chú</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>`;
    const a = S.analysis;
    const own = a ? (a.steps || []).map((s, k) => s.vocab.length ? `<p><b>${STEP_NAMES[k]}:</b> ${s.vocab.map(v => esc(v.phrase) + (v.meaning_vi ? ' <span class="muted">(' + esc(v.meaning_vi) + ')</span>' : '')).join(' · ')}</p>` : '').join('') : '';
    $('#vocab-content').innerHTML = `
      <div class="rule-box"><h3>Quy tắc vàng: chống viết chung chung</h3>
        <p>Mỗi câu phải gọi đúng tên chủ thể, quốc gia, hạng mục và số liệu của đề (ví dụ: <i>water consumption in the USA and China</i>, <i>the number of visitors to museums</i>). Không dùng “the given chart”.</p></div>
      ${own ? `<div class="vsec"><h3>Từ vựng riêng cho đề đang làm</h3>${own}</div>` : ''}
      <div class="vsec"><h3>Bảng cấu trúc câu</h3><div class="table-wrap"><table><thead><tr><th>Cấu trúc</th><th>Công thức</th><th>Ví dụ</th></tr></thead><tbody>
        ${C.sentenceStructures.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.formula)}</td><td>${esc(s.example)}</td></tr>`).join('')}</tbody></table></div>
        <p class="small" style="margin-top:6px"><b>Mẹo:</b> ${esc(C.formulaTip.formula)} — <i>${esc(C.formulaTip.example)}</i></p></div>
      <div class="vsec"><h3>Maps · A. Từ vựng miêu tả sự thay đổi (Body 2)</h3>${table(C.changeVocab)}</div>
      <div class="vsec"><h3>Maps · B. Từ vựng miêu tả vị trí (Body 1 và Body 2)</h3>${table(C.positionVocab)}</div>
      <div class="vsec"><h3>Maps · Các cấu trúc viết</h3><ul>${C.writingStructures.map(g => `<li><b>${esc(g.group)}:</b> ${g.items.map(esc).join(' · ')}</li>`).join('')}</ul></div>
      <div class="vsec"><h3>Lưu ý quan trọng</h3><ul>${C.rules.map(r => `<li><b>${esc(r.title)}</b> — ${r.points.join(' ')}</li>`).join('')}
        ${C.prepGroups.map(g => `<li><b>${esc(g.group)}</b>: ${esc(g.use)}</li>`).join('')}</ul></div>
      <div class="vsec"><h3>Mẹo áp dụng</h3><ul>${C.tips.map(t => `<li><b>${esc(t.title)}:</b> ${esc(t.text)}</li>`).join('')}</ul></div>`;
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
    if (t.dataset.edit != null) { e.preventDefault(); S.step = +t.dataset.edit; show('wizard'); return; }
    if (t.dataset.opt != null) {
      const o = S.analysis.steps[S.step].options[+t.dataset.opt];
      S.paras[S.step] = o; $('#para').value = o; save();
      document.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-checked', String(b === t)));
      updateCount(); renderSide();
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
      case 'btn-regen': regen(t); return;
      case 'ref-img-btn': $('#dlg-img-src').src = S.image.dataUrl; $('#dlg-img').showModal(); return;
      case 'btn-vocab': renderVocab(); $('#dlg-vocab').showModal(); return;
      case 'btn-key': openKey(); return;
      case 'api-save': AI.setKey($('#api-key').value.trim()); toast('Đã lưu API key.'); if (S.view === 'setup') renderSetup(); return;
      case 'api-clear': AI.setKey(''); $('#api-key').value = ''; toast('Đã xoá API key.'); return;
      case 'btn-new': case 'btn-new-2': {
        if (S.view === 'loading') return;
        const keep = { band: S.band, type: S.type };
        S = Object.assign(blank(), keep); save(); show('setup'); $('#prompt').focus(); return;
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
  $('#para').addEventListener('input', e => {
    S.paras[S.step] = e.target.value; save();
    document.querySelectorAll('.opt').forEach(b => b.setAttribute('aria-checked', String(S.analysis.steps[S.step].options[+b.dataset.opt] === e.target.value)));
    updateCount(); renderSide();
  });
  document.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items ? [...e.clipboardData.items] : [];
    const img = items.find(i => i.type.startsWith('image/'));
    if (!img || S.view !== 'setup') return;
    e.preventDefault(); takeFile(img.getAsFile());
  });
  const dz = $('#dropzone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); takeFile(e.dataTransfer.files[0]); });

  /* ================= Start ================= */
  const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
  if (IN_CLAUDE) $('#btn-key').hidden = true;
  show(S.view === 'loading' ? 'setup' : (S.view !== 'setup' && !S.analysis ? 'setup' : S.view));
  AI.available().then(a => { AVAIL = a; if (a.via === 'claude') $('#btn-key').hidden = true; if (S.view === 'setup') renderSetup(); });
})();
