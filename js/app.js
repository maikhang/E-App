(function () {
  const C = window.CONTENT, E = window.ENGINE;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const STORE = 'e-app.maps.v1';
  const WRITING = ['intro', 'overview', 'body1', 'body2'];

  const TASK_TYPES = [
    { id: 'maps', label: '🗺️ Maps', ready: true },
    { id: 'line', label: 'Line graph' }, { id: 'bar', label: 'Bar chart' }, { id: 'pie', label: 'Pie chart' },
    { id: 'table', label: 'Table' }, { id: 'process', label: 'Process' }, { id: 'mixed', label: 'Mixed' },
  ];

  function blank() {
    return {
      step: 'prompt', view: 'outline',
      promptText: '', image: null,
      place: '', year1: '', year2: '', tense: 'past',
      features: [newFeature()], changes: [newChange()],
      draft: { intro: '', overview: '', body1: '', body2: '' },
      checks: {},
    };
  }
  function newFeature() { return { id: uid(), name: '', pos: { rel: 'in_dir', dir: 'north', ref: '' } }; }
  function newChange() { return { id: uid(), type: 'built', subject: '', target: '', pos: { rel: 'in_dir', dir: 'north', ref: '' }, main: false }; }

  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* bỏ qua */ }
    return blank();
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(S)); }
      catch (e) {
        // ảnh quá lớn → lưu mà không kèm ảnh
        try { localStorage.setItem(STORE, JSON.stringify(Object.assign({}, S, { image: null }))); } catch (e2) { /* bỏ qua */ }
      }
    }, 250);
  }

  function toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  /* ================= Highlight ================= */
  const TERMS = E.highlightTerms();
  const TERM_RE = new RegExp('\\b(' + TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi');
  const hl = s => esc(s).replace(TERM_RE, '<mark>$1</mark>');

  /* ================= Top / stepper ================= */
  function renderTypes() {
    $('#types').innerHTML = TASK_TYPES.map(t =>
      `<button type="button" class="type ${t.ready ? 'active' : ''}" ${t.ready ? '' : 'disabled title="Sắp có"'}>${esc(t.label)}${t.ready ? '' : ' <small>· sắp có</small>'}</button>`).join('');
  }

  function stepDone(id) {
    if (id === 'prompt') return !!(S.promptText.trim() || S.image || S.place);
    if (id === 'analyze') return S.features.some(f => f.name.trim()) && S.changes.some(c => (c.subject || c.target).trim());
    if (WRITING.includes(id)) return !!S.draft[id].trim();
    return false;
  }
  function renderStepper() {
    const parts = ['<p class="label">Dàn ý Task 1 · Maps</p>'];
    C.outline.forEach((o, i) => {
      if (i) parts.push('<div class="connector"></div>');
      const active = S.view === 'outline' && S.step === o.id;
      const meta = [o.minutes ? `${o.minutes} phút` : '', o.sentences || ''].filter(Boolean).join(' · ');
      parts.push(`<button type="button" class="step ${active ? 'active' : ''} ${stepDone(o.id) ? 'done' : ''}" data-step="${o.id}">
        <span class="num">${stepDone(o.id) && !active ? '✓' : o.num}</span>
        <span>${esc(o.title)}${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</span></button>`);
    });
    $('#stepper').innerHTML = parts.join('');
  }

  /* ================= Main ================= */
  function render() {
    renderStepper();
    const main = $('#main');
    if (S.view === 'library') main.innerHTML = libraryView();
    else {
      const o = C.outline.find(x => x.id === S.step) || C.outline[0];
      const body = {
        prompt: promptView, analyze: analyzeView, intro: writeView, overview: writeView, body1: writeView, body2: writeView, check: checkView,
      }[o.id](o);
      main.innerHTML = headerCard(o) + body + navCard(o);
    }
    renderEssay();
    restoreTimer();
  }

  function headerCard(o) {
    return `<section class="card"><div class="head">
      <div><span class="kicker">Bước ${esc(o.num)}${o.sentences ? ' · ' + esc(o.sentences) : ''}</span><h2>${esc(o.icon)} ${esc(o.title)}</h2>
      <p class="goal">${esc(o.goal)}</p></div>
      ${o.minutes ? `<button type="button" class="btn sm timer" id="timer" data-min="${o.minutes}">⏱ ${o.minutes}:00</button>` : ''}
    </div></section>`;
  }
  function navCard(o) {
    const i = C.outline.findIndex(x => x.id === o.id);
    const prev = C.outline[i - 1], next = C.outline[i + 1];
    return `<div class="row" style="justify-content:space-between">
      ${prev ? `<button type="button" class="btn" data-step="${prev.id}">← ${esc(prev.title)}</button>` : '<span></span>'}
      ${next ? `<button type="button" class="btn primary" data-step="${next.id}">${esc(next.title)} →</button>` : ''}
    </div>`;
  }

  /* ---------- Bước 0: Đề bài ---------- */
  function promptView() {
    const img = S.image;
    return `<section class="card">
      <h3>Đề bài</h3>
      <label class="field"><span>Gõ hoặc dán đề (tiếng Anh)</span>
        <textarea id="prompt-text" rows="4" placeholder="The maps below show the village of ... in 1990 and 2010. Summarise the information by selecting and reporting the main features...">${esc(S.promptText)}</textarea>
      </label>
      <div style="height:12px"></div>
      <div class="dropzone" id="dropzone">
        ${img ? `<img src="${esc(img.dataUrl)}" alt="Ảnh đề bài">` : '<div style="font-size:34px">🖼️</div>'}
        <p class="hint">${img ? 'Ảnh đề đã sẵn sàng.' : 'Dán ảnh đề bằng <kbd>Ctrl</kbd>+<kbd>V</kbd> (<kbd>⌘</kbd>+<kbd>V</kbd>), kéo thả, hoặc chọn ảnh.'}</p>
        <div class="row" style="justify-content:center">
          <label class="btn sm">📁 Chọn / chụp ảnh<input type="file" id="file" accept="image/*" hidden></label>
          ${IN_CLAUDE ? '' : '<button type="button" class="btn sm" id="paste-btn">📋 Dán ảnh</button>'}
          ${img ? '<button type="button" class="btn sm" id="img-clear">✕ Xoá ảnh</button>' : ''}
        </div>
      </div>
      <div style="height:12px"></div>
      <div class="row">
        <button type="button" class="btn primary" id="ai-btn" ${img || S.promptText.trim() ? '' : 'disabled'}>🤖 AI đọc đề + bản đồ</button>
        ${SAMPLE ? '' : `<button type="button" class="btn" id="ocr-btn" ${img ? '' : 'disabled'}>🔤 Đọc chữ trong ảnh (OCR)</button>`}
        <button type="button" class="btn ghost" id="sample-btn">Dùng đề mẫu</button>
        <button type="button" class="btn ghost" id="reset-btn">Làm bài mới</button>
      </div>
      <p class="muted small" id="ai-status">${SAMPLE ? 'AI đọc ảnh đề và tự điền công trình + thay đổi vào bước Phân tích. Dùng tài khoản Claude của bạn, không cần API key.' : 'AI tự điền công trình + thay đổi vào bước Phân tích (cần API key ở ⚙️). OCR miễn phí chỉ đọc chữ của đề.'}</p>
    </section>
    <section class="card">
      <h3>Thông tin đề <span class="muted small">(tự nhận từ đề — sửa nếu sai)</span></h3>
      <div class="grid-4">
        <label class="field"><span>Địa điểm</span><input type="text" data-f="place" value="${esc(S.place)}" placeholder="the village of Stokeford"></label>
        <label class="field"><span>Năm Map 1</span><input type="text" data-f="year1" value="${esc(S.year1)}" placeholder="1930"></label>
        <label class="field"><span>Năm Map 2</span><input type="text" data-f="year2" value="${esc(S.year2)}" placeholder="2010 / present"></label>
        <label class="field"><span>Thì của bài</span>
          <select data-f="tense">
            <option value="past" ${S.tense === 'past' ? 'selected' : ''}>Quá khứ đơn (2 năm đã qua)</option>
            <option value="perfect" ${S.tense === 'perfect' ? 'selected' : ''}>Hiện tại hoàn thành (Map 2 = hiện nay)</option>
            <option value="future" ${S.tense === 'future' ? 'selected' : ''}>Tương lai (bản đồ dự kiến)</option>
          </select></label>
      </div>
      <p class="muted small" style="margin-bottom:0">Thì quyết định dạng động từ: <b>was built</b> · <b>has been built</b> · <b>will be built</b>.</p>
    </section>`;
  }

  /* ---------- Bước 1: Phân tích ---------- */
  function relOptions(sel) {
    const groups = {};
    E.RELATIONS.forEach(r => (groups[r.group] = groups[r.group] || []).push(r));
    return Object.entries(groups).map(([g, rs]) => `<optgroup label="${esc(g)}">${rs.map(r =>
      `<option value="${r.id}" ${r.id === sel ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}</optgroup>`).join('');
  }
  function posPicker(kind, item, allowNone) {
    const p = item.pos || {};
    const r = E.REL[p.rel];
    const dirSel = r && r.dirs ? `<select data-k="${kind}" data-id="${item.id}" data-p="dir">${r.dirs.map(d => `<option ${d === p.dir ? 'selected' : ''}>${d}</option>`).join('')}</select>` : '';
    const refPh = !r ? '' : r.ref === 'map' ? 'the map (mặc định)' : r.ref === 'opt' ? 'tham chiếu (tuỳ chọn)' : 'tham chiếu: river, main road…';
    const refInp = r && r.ref !== 'no' ? `<input type="text" list="refs" data-k="${kind}" data-id="${item.id}" data-p="ref" value="${esc(p.ref || '')}" placeholder="${refPh}">` : '';
    const cls = !r ? 'bare' : !r.dirs ? 'no-dir' : r.ref === 'no' ? 'no-ref' : '';
    return `<div class="pos ${cls}">
      <select data-k="${kind}" data-id="${item.id}" data-p="rel">${allowNone ? `<option value="" ${!p.rel ? 'selected' : ''}>— không cần vị trí —</option>` : ''}${relOptions(p.rel)}</select>
      ${dirSel}${refInp}</div>`;
  }
  function analyzeView() {
    const names = S.features.map(f => E.cleanNoun(f.name)).filter(Boolean);
    const refs = [...new Set(names.concat(['map', 'town', 'village', 'river', 'main road', 'railway', 'lake', 'park', 'school', 'beach', 'forest']))];
    const mains = S.changes.filter(c => c.main).length;
    const tip = C.tips[0];
    return `<datalist id="refs">${refs.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <datalist id="feats">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <section class="card">
      <details class="prep" open><summary>Trước khi phân tích</summary>
        <div class="prep-grid">
          <div class="prep-box"><h4>${esc(tip.title)}</h4><p style="margin:0 0 4px">${esc(tip.text)}</p><ul>${tip.sub.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
          <div class="prep-box"><h4>${esc(C.tips[1].title)}</h4><p style="margin:0">${esc(C.tips[1].text)}</p></div>
          ${rulesBox()}
        </div>
      </details>
    </section>
    <section class="card">
      <div class="head"><h3>🗺️ Map 1${S.year1 ? ' (' + esc(S.year1) + ')' : ''} — công trình &amp; vị trí <span class="muted small">→ dùng cho Body 1</span></h3>
        <button type="button" class="btn sm" data-act="add-feature">＋ Thêm công trình</button></div>
      <div class="items">${S.features.map(f => `<div class="item">
        <div class="item-grid">
          <label class="field"><span>Công trình (tiếng Anh)</span><input type="text" data-k="feature" data-id="${f.id}" data-p="name" value="${esc(f.name)}" placeholder="school, houses, car park…"></label>
          <label class="field"><span>Vị trí</span>${posPicker('feature', f, false)}</label>
          <button type="button" class="icon-btn" data-act="del-feature" data-id="${f.id}" aria-label="Xoá">✕</button>
        </div>
        <div class="preview" data-preview="${f.id}">${esc(featurePreview(f))}</div></div>`).join('')}</div>
    </section>
    <section class="card">
      <div class="head"><h3>🗺️ Map 2${S.year2 ? ' (' + esc(S.year2) + ')' : ''} — thay đổi <span class="muted small">→ dùng cho Overview &amp; Body 2</span></h3>
        <button type="button" class="btn sm" data-act="add-change">＋ Thêm thay đổi</button></div>
      <p class="muted small" style="margin-top:0">⭐ Đánh dấu 3-4 thay đổi chính (đang chọn <b>${mains}</b>) — chúng sẽ lên Overview và được viết trước trong Body 2.</p>
      <div class="items">${S.changes.map(changeRow).join('')}</div>
    </section>`;
  }
  function featurePreview(f) {
    const n = E.cleanNoun(f.name);
    if (!n) return '';
    const p = E.posText(f.pos);
    return `→ “${n} ${p}”`;
  }
  function changeRow(c) {
    const t = E.CHANGE_TYPES.find(x => x.id === c.type) || E.CHANGE_TYPES[0];
    const needX = t.need.includes('X'), needY = t.need.includes('Y') || t.optY;
    return `<div class="item ${c.main ? 'main' : ''}">
      <div class="change-grid">
        <label class="field"><span>Loại thay đổi</span><select data-k="change" data-id="${c.id}" data-p="type">${E.CHANGE_TYPES.map(x =>
          `<option value="${x.id}" ${x.id === c.type ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
        ${needX ? `<label class="field"><span>Công trình cũ (X)</span><input type="text" list="feats" data-k="change" data-id="${c.id}" data-p="subject" value="${esc(c.subject)}" placeholder="factory"></label>` : '<span></span>'}
        ${needY ? `<label class="field"><span>${t.optY ? 'Thay bằng (tuỳ chọn)' : 'Công trình mới (Y)'}</span><input type="text" data-k="change" data-id="${c.id}" data-p="target" value="${esc(c.target)}" placeholder="museum"></label>` : '<span></span>'}
        <button type="button" class="star ${c.main ? 'on' : ''}" data-act="star" data-id="${c.id}" title="Thay đổi chính">⭐ Chính</button>
        <button type="button" class="icon-btn" data-act="del-change" data-id="${c.id}" aria-label="Xoá">✕</button>
      </div>
      ${t.pos ? `<label class="field" style="margin-top:8px"><span>${c.type === 'relocated' ? 'Vị trí mới' : c.type === 'expanded' || c.type === 'extended' ? 'Hướng mở rộng / kéo dài' : 'Vị trí'}</span>${posPicker('change', c, true)}</label>` : ''}
      <div class="preview" data-preview="${c.id}">${esc(changePreview(c))}</div></div>`;
  }
  function changePreview(c) {
    const st = Object.assign({}, S, { changes: [c] });
    const slots = E.body2Sentences(st);
    const v = slots[1] && slots[1].variants[0];
    return v ? '→ ' + v.text : '';
  }

  /* ---------- Bước 2–5: Viết ---------- */
  function vocabChips(list, key) {
    return `<div class="chips">${list.map(v => `<button type="button" class="chip" data-chip="${key}:${v.id}">${esc(v.phrase)}</button>`).join('')}</div><div class="chip-detail" data-chip-detail="${key}"></div>`;
  }
  function structuresBox(ids) {
    const rows = C.sentenceStructures.filter(s => ids.includes(s.id));
    return `<div class="prep-box"><h4>Cấu trúc câu</h4><ul>${rows.map(s => `<li><b>${esc(s.name)}</b>: ${esc(s.formula)}<br><span class="muted small">${esc(s.example)}</span></li>`).join('')}</ul></div>`;
  }
  function rulesBox() {
    return `<div class="prep-box"><h4>Lưu ý giới từ</h4><ul>
      <li><b>In</b> the north of X = bên <b>trong</b> X · <b>To</b> the north of X = bên <b>ngoài</b> X</li>
      <li>Có <b>side</b> → <b>On</b> · Có <b>part</b> → <b>In</b></li>
      ${C.prepGroups.map(g => `<li><b>${esc(g.group)}</b>: ${esc(g.use)}</li>`).join('')}</ul></div>`;
  }
  function paraphraseBox() {
    return `<div class="prep-box"><h4>Paraphrase vị trí</h4><ul>${C.paraphrasing.ways.map(w => `<li><b>${esc(w.name)}:</b> ${w.text}</li>`).join('')}</ul></div>`;
  }
  function prepFor(id) {
    if (id === 'intro') {
      return `<div class="prep-grid">
        <div class="prep-box"><h4>Đề gốc</h4><p style="margin:0">${S.promptText.trim() ? esc(S.promptText.trim().split(/(?<=\.)\s/)[0]) : '<span class="muted">Chưa nhập đề — quay lại bước 0.</span>'}</p></div>
        <div class="prep-box"><h4>Cách paraphrase</h4><ul>
          <li>show → <b>illustrate / compare</b></li><li>maps below → <b>the two maps</b></li>
          <li>in 1990 and 2010 → <b>between 1990 and 2010</b></li><li>Không chép nguyên câu đề, không thêm nhận xét.</li></ul></div>
        <div class="prep-box"><h4>Thì của bài</h4><p style="margin:0">${S.tense === 'past' ? 'Quá khứ đơn: <b>was built</b>' : S.tense === 'perfect' ? 'Hiện tại hoàn thành: <b>has been built</b>' : 'Tương lai: <b>will be built</b>'}</p></div>
      </div>`;
    }
    if (id === 'overview') {
      const ov = C.changeVocab.filter(v => v.sections.includes('overview'));
      const mains = S.changes.filter(c => c.main && (c.subject || c.target));
      return `<div class="prep-grid">
        <div class="prep-box"><h4>Từ vựng Overview</h4>${vocabChips(ov, 'change')}</div>
        ${structuresBox(['contrast'])}
        <div class="prep-box"><h4>Thay đổi chính ⭐ (${mains.length})</h4>${mains.length ? `<ul>${mains.map(c => `<li>${esc(E.cleanNoun(c.subject) || E.cleanNoun(c.target))} — ${esc((E.CHANGE_TYPES.find(t => t.id === c.type) || {}).label || '')}</li>`).join('')}</ul>` : '<p class="muted" style="margin:0">Chưa đánh dấu ⭐ ở bước Phân tích — app tạm lấy 3 thay đổi đầu tiên.</p>'}
          <p class="muted small" style="margin:6px 0 0">${esc(C.tips[1].text)}</p></div>
      </div>`;
    }
    if (id === 'body1') {
      return `<div class="prep-grid">
        <div class="prep-box"><h4>Công thức</h4><p class="formula" style="margin:0 0 6px">${esc(C.formulaTip.formula)}</p><p class="muted small" style="margin:0"><i>${esc(C.formulaTip.example)}</i></p></div>
        ${structuresBox(['time', 'there', 'passive', 'addition', 'contrast'])}
        ${paraphraseBox()}
        <div class="prep-box"><h4>Từ vựng vị trí (B)</h4>${vocabChips(C.positionVocab, 'pos')}</div>
        ${rulesBox()}
        <div class="prep-box"><h4>${esc(C.tips[3].title)}</h4><p style="margin:0">${esc(C.tips[3].text)}</p></div>
      </div>`;
    }
    if (id === 'body2') {
      const grp = (ids) => C.changeVocab.filter(v => ids.includes(v.id));
      return `<div class="prep-grid">
        <div class="prep-box"><h4>Xuất hiện</h4>${vocabChips(grp(['built', 'constructed', 'added', 'addition']), 'change')}</div>
        <div class="prep-box"><h4>Biến mất / thay thế</h4>${vocabChips(grp(['demolished', 'removed', 'replaced', 'converted', 'transformed']), 'change')}</div>
        <div class="prep-box"><h4>Thay đổi kích thước / vị trí</h4>${vocabChips(grp(['expanded', 'extended', 'relocated', 'reduced', 'modernized', 'renovated', 'redeveloped']), 'change')}</div>
        <div class="prep-box"><h4>Tổng quát / giữ nguyên</h4>${vocabChips(grp(['experienced', 'underwent', 'unchanged']), 'change')}</div>
        <div class="prep-box"><h4>Cấu trúc viết (dạng map)</h4><ul>${C.writingStructures.map(g => `<li><b>${esc(g.group)}:</b> ${g.items.map(esc).join(' · ')}</li>`).join('')}</ul></div>
        ${structuresBox(['time', 'passive', 'there', 'addition', 'contrast'])}
        <div class="prep-box"><h4>${esc(C.tips[2].title)}</h4><p style="margin:0">${esc(C.tips[2].text)}</p></div>
      </div>`;
    }
    return '';
  }
  function slotsFor(id) {
    if (id === 'intro') return [{ label: 'Câu 1 · Paraphrase đề bài', variants: E.introSentences(S) }];
    if (id === 'overview') return E.overviewSentences(S);
    if (id === 'body1') return E.body1Sentences(S);
    if (id === 'body2') return E.body2Sentences(S);
    return [];
  }
  function writeView(o) {
    const slots = slotsFor(o.id);
    const draft = S.draft[o.id] || '';
    const needData = (o.id === 'body1' && !S.features.some(f => f.name.trim())) || ((o.id === 'body2') && !S.changes.some(c => (c.subject || c.target).trim()));
    return `<section class="card"><details class="prep" open><summary>📌 Trước khi viết ${esc(o.title)}</summary>${prepFor(o.id)}</details></section>
    <section class="card">
      <div class="head"><h3>✍️ Gợi ý từng câu</h3><span class="muted small">Chọn 1 phương án mỗi câu · từ trong dàn ý được <mark>tô vàng</mark></span></div>
      ${needData ? `<div class="empty">Chưa có dữ liệu bản đồ. <button type="button" class="btn sm" data-step="analyze">Điền ở bước Phân tích →</button></div>` : ''}
      <div class="slots">${slots.map((s, si) => `<div class="slot">
        <div class="slot-head"><span>${esc(s.label)}</span>${s.optional ? '<span class="opt">tuỳ chọn</span>' : ''}</div>
        ${s.variants.map((v, vi) => {
          const used = draft.includes(v.text);
          return `<div class="variant ${used ? 'used' : ''}"><div class="txt"><p class="sent">${hl(v.text)}</p>
            <div class="tags">${(v.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
            <button type="button" class="btn sm ${used ? '' : 'primary'} use" data-use="${o.id}:${si}:${vi}">${used ? '✓ Đã dùng' : '＋ Dùng'}</button></div>`;
        }).join('')}</div>`).join('')}</div>
    </section>
    <section class="card section-draft">
      <div class="head"><h3>Đoạn ${esc(o.title)} của bạn</h3><span class="count" id="sec-count">${wc(draft)} từ</span></div>
      <textarea id="sec-draft" data-sec="${o.id}" rows="6" placeholder="Bấm “＋ Dùng” ở trên hoặc tự viết tại đây…">${esc(draft)}</textarea>
      <div class="row" style="margin-top:8px"><button type="button" class="btn sm ghost" data-act="clear-sec">Xoá đoạn này</button></div>
    </section>`;
  }

  /* ---------- Bước 6: Kiểm tra ---------- */
  function essayText() {
    return WRITING.map(k => S.draft[k].trim()).filter(Boolean).join('\n\n');
  }
  function checkView() {
    const r = E.check(essayText(), S);
    const items = [
      'Introduction paraphrase đề, không chép nguyên văn',
      'Overview có xu hướng chung + 2 thay đổi nổi bật, không có vị trí chi tiết',
      'Chỉ chọn 3-4 thay đổi chính',
      'Body 1 dùng từ vị trí, Body 2 dùng từ thay đổi + vị trí',
      'Đã xen kẽ từ đồng nghĩa (was built / was constructed, next to / adjacent to)',
      'Thì động từ thống nhất với năm của đề',
      'In / To / On / At dùng đúng quy tắc',
    ];
    return `<section class="card">
      <h3>🔎 Kiểm tra tự động</h3>
      <ul class="issues">${r.issues.map(i => `<li class="${i.level}">${esc(i.msg)}</li>`).join('')}</ul>
      <p class="muted small" style="margin-bottom:0">Cấu trúc đã dùng: ${r.used.length ? r.used.map(u => `<span class="tag">${esc(u)}</span>`).join(' ') : '—'}</p>
    </section>
    <section class="card checklist">
      <h3>☑️ Tự kiểm tra (${esc(C.tips[4].text)})</h3>
      ${items.map((t, i) => `<label><input type="checkbox" data-check="${i}" ${S.checks[i] ? 'checked' : ''}> <span>${esc(t)}</span></label>`).join('')}
    </section>
    <section class="card">
      <div class="head"><h3>Bài hoàn chỉnh</h3><button type="button" class="btn sm primary" data-act="copy">📋 Sao chép bài</button></div>
      <div style="white-space:pre-wrap; margin-top:8px">${essayText() ? hl(essayText()) : '<span class="muted">Chưa có nội dung.</span>'}</div>
    </section>`;
  }

  /* ---------- Thư viện ---------- */
  function libraryView() {
    const q = (S.libQ || '').toLowerCase();
    const match = (...xs) => !q || xs.join(' ').toLowerCase().includes(q);
    const vt = list => `<div class="table-wrap"><table><thead><tr><th>Từ/Cụm từ</th><th>Ý nghĩa</th><th>Cách sử dụng</th><th>Ghi chú</th></tr></thead><tbody>${list.filter(v => match(v.phrase, v.meaning, v.usage, v.example, v.note)).map(v =>
      `<tr><td>${esc(v.phrase)}</td><td>${esc(v.meaning)}</td><td>${esc(v.usage)} Ví dụ: “${esc(v.example)}”</td><td>${esc(v.note)}</td></tr>`).join('')}</tbody></table></div>`;
    return `<section class="card"><div class="head"><div><span class="kicker">Thư viện</span><h2>📚 Dàn ý &amp; từ vựng Maps</h2></div>
      <button type="button" class="btn" data-step="${esc(S.step)}">← Quay lại bài</button></div>
      <div style="height:10px"></div><input type="text" class="lib-search" id="lib-q" placeholder="Tìm từ, ví dụ…" value="${esc(S.libQ || '')}"></section>
    <section class="card"><h3>A. Từ vựng miêu tả sự thay đổi (Dùng chủ yếu trong Body 2)</h3>${vt(C.changeVocab)}</section>
    <section class="card"><h3>B. Từ vựng miêu tả vị trí (Dùng trong Body 1 và Body 2)</h3>${vt(C.positionVocab)}</section>
    <section class="card"><h3>Các cấu trúc viết</h3><p class="muted" style="margin-top:0">Dạng map thường yêu cầu miêu tả các sự thay đổi, vì vậy cần sử dụng các cụm từ phù hợp để nói về sự thay đổi hoặc sự xuất hiện, biến mất của các đối tượng.</p>
      ${C.writingStructures.map(g => `<p style="margin:8px 0 2px"><b>${esc(g.group)}:</b></p><ul style="margin:0">${g.items.map(i => `<li>"${esc(i)}"</li>`).join('')}</ul>`).join('')}</section>
    <section class="card"><h3>Bảng cấu trúc câu</h3><div class="table-wrap"><table><thead><tr><th>Tên cấu trúc</th><th>Công thức</th><th>Ví dụ</th></tr></thead><tbody>
      ${C.sentenceStructures.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.formula)}</td><td>${esc(s.example)}</td></tr>`).join('')}</tbody></table></div>
      <p><b>Mẹo:</b> Khi làm bài thi, hãy kết hợp: <span class="formula">${esc(C.formulaTip.formula)}</span><br><i>Ví dụ: ${esc(C.formulaTip.example)}</i></p></section>
    <section class="card"><h3>Lưu ý quan trọng Task 1</h3>
      ${C.rules.map(r => `<p style="margin:10px 0 2px"><b>${esc(r.title)}</b></p><ul style="margin:0">${r.points.map(p => `<li>${p}</li>`).join('')}</ul>`).join('')}
      <div class="table-wrap" style="margin-top:12px"><table><tbody>${C.prepGroups.map(g => `<tr><td>${esc(g.group)}</td><td>Dùng cho: ${esc(g.use)}</td></tr>`).join('')}</tbody></table></div>
      <p style="margin:12px 0 2px"><b>Mẹo ghi điểm (Paraphrasing):</b> ${esc(C.paraphrasing.intro)}</p>
      <ul style="margin:0">${C.paraphrasing.ways.map(w => `<li><i>${esc(w.name)}:</i> ${w.text}</li>`).join('')}</ul></section>
    <section class="card"><h3>Mẹo áp dụng dàn ý và từ vựng</h3><ul>${C.tips.map(t => `<li><b>${esc(t.title)}:</b> ${esc(t.text)}${t.sub ? `<ul>${t.sub.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul></section>`;
  }

  /* ================= Essay panel ================= */
  function wc(s) { return (String(s).match(/[A-Za-z][A-Za-z'-]*/g) || []).length; }
  function renderEssay() {
    const total = wc(essayText());
    const pct = Math.min(100, Math.round(total / 150 * 100));
    const titles = { intro: 'Introduction', overview: 'Overview', body1: 'Body 1', body2: 'Body 2' };
    $('#essay').innerHTML = `<div class="card">
      <div class="head"><div><span class="kicker">Bài viết của bạn</span><div class="wc">${total} <span class="muted small">/ 150 từ</span></div></div>
        <button type="button" class="btn sm" data-act="copy">📋 Sao chép</button></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      ${WRITING.map(k => `<div class="essay-sec ${S.step === k && S.view === 'outline' ? 'current' : ''}"><h4><span>${titles[k]}</span><span>${wc(S.draft[k])} từ</span></h4>
        ${S.draft[k].trim() ? `<p>${esc(S.draft[k].trim())}</p>` : `<p class="ph"><a href="#" data-step="${k}">Viết ${titles[k]} →</a></p>`}</div>`).join('')}
    </div>`;
  }

  /* ================= Timer ================= */
  let timer = { end: 0, step: null, iv: null };
  function restoreTimer() {
    const el = $('#timer');
    if (!el) return;
    if (timer.step === S.step && timer.end) tick();
  }
  function tick() {
    const el = $('#timer');
    const left = Math.round((timer.end - Date.now()) / 1000);
    if (!el || timer.step !== S.step) return;
    const a = Math.abs(left);
    el.textContent = (left < 0 ? '⏰ +' : '⏱ ') + Math.floor(a / 60) + ':' + String(a % 60).padStart(2, '0');
    el.classList.toggle('running', left >= 0);
    el.classList.toggle('over', left < 0);
  }
  function startTimer(min) {
    clearInterval(timer.iv);
    if (timer.step === S.step && timer.end) { timer = { end: 0, step: null, iv: null }; render(); return; }
    timer = { end: Date.now() + min * 60000, step: S.step, iv: setInterval(tick, 1000) };
    tick();
  }

  /* ================= Image handling ================= */
  function setImageFromFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      downscale(reader.result, file.type).then(img => {
        S.image = img; save(); render(); toast('Đã nhận ảnh đề.');
      });
    };
    reader.readAsDataURL(file);
  }
  // Thu nhỏ ảnh (cạnh dài ≤ 1600px) để gửi AI nhanh hơn và lưu được
  function downscale(dataUrl, type) {
    return new Promise(resolve => {
      const im = new Image();
      im.onload = () => {
        const max = 1600, scale = Math.min(1, max / Math.max(im.width, im.height));
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

  function applyDetect() {
    const d = E.detectFromPrompt(S.promptText);
    let changed = false;
    for (const k of ['place', 'year1', 'year2', 'tense']) {
      if (d[k] && !S['_manual_' + k] && S[k] !== d[k]) { S[k] = d[k]; changed = true; }
    }
    return changed;
  }

  function applyAI(r) {
    if (r.prompt_text && !S.promptText.trim()) S.promptText = r.prompt_text;
    for (const k of ['place', 'year1', 'year2']) if (r[k]) S[k] = r[k];
    if (r.tense) S.tense = r.tense;
    const fixPos = p => {
      if (!p || !p.rel || !E.REL[p.rel]) return { rel: '', dir: '', ref: '' };
      const rr = E.REL[p.rel];
      return { rel: p.rel, dir: rr.dirs ? (rr.dirs.includes(p.dir) ? p.dir : rr.dirs[0]) : '', ref: p.ref || '' };
    };
    if (r.features && r.features.length) S.features = r.features.map(f => ({ id: uid(), name: f.name, pos: fixPos(f.pos) }));
    if (r.changes && r.changes.length) S.changes = r.changes.map(c => ({ id: uid(), type: c.type, subject: c.subject || '', target: c.target || '', pos: fixPos(c.pos), main: !!c.main }));
  }

  function loadSample() {
    S = blank();
    S.promptText = 'The maps below show the village of Stokeford in 1930 and 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';
    applyDetect();
    S.features = [
      { id: uid(), name: 'houses', pos: { rel: 'along', dir: '', ref: 'main road' } },
      { id: uid(), name: 'school', pos: { rel: 'center', dir: '', ref: 'the village' } },
      { id: uid(), name: 'post office', pos: { rel: 'next_to', dir: '', ref: 'school' } },
      { id: uid(), name: 'farmland', pos: { rel: 'in_dir', dir: 'south', ref: 'the village' } },
    ];
    S.changes = [
      { id: uid(), type: 'transformed', subject: 'farmland', target: 'residential area', pos: { rel: '', dir: '', ref: '' }, main: true },
      { id: uid(), type: 'built', subject: '', target: 'retirement home', pos: { rel: 'in_dir', dir: 'north', ref: 'the village' }, main: true },
      { id: uid(), type: 'expanded', subject: 'school', target: '', pos: { rel: 'to_dir', dir: 'west', ref: '' }, main: true },
      { id: uid(), type: 'converted', subject: 'post office', target: 'shop', pos: { rel: '', dir: '', ref: '' }, main: false },
      { id: uid(), type: 'unchanged', subject: 'main road', target: '', pos: { rel: '', dir: '', ref: '' }, main: false },
    ];
    save(); render(); toast('Đã nạp đề mẫu Stokeford 1930 – 2010.');
  }

  /* ================= Events ================= */
  function go(step) {
    S.view = 'outline'; S.step = step; save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function findItem(kind, id) { return (kind === 'feature' ? S.features : S.changes).find(x => x.id === id); }

  document.addEventListener('click', async e => {
    const t = e.target.closest('button, a, [data-step]');
    if (!t) return;
    if (t.dataset.step) { e.preventDefault(); go(t.dataset.step); return; }
    if (t.id === 'btn-library') { S.view = S.view === 'library' ? 'outline' : 'library'; render(); return; }
    if (t.id === 'btn-settings') { $('#api-key').value = AI.getKey(); $('#settings').showModal(); return; }
    if (t.id === 'api-save') { AI.setKey($('#api-key').value.trim()); toast('Đã lưu API key.'); return; }
    if (t.id === 'api-clear') { AI.setKey(''); $('#api-key').value = ''; toast('Đã xoá API key.'); return; }
    if (t.id === 'timer') { startTimer(+t.dataset.min); return; }
    if (t.id === 'sample-btn') { loadSample(); return; }
    if (t.id === 'reset-btn') {
      if (t.dataset.armed) { S = blank(); save(); render(); toast('Đã xoá, bắt đầu bài mới.'); return; }
      t.dataset.armed = '1'; t.textContent = 'Bấm lần nữa để xoá hết'; t.classList.add('danger');
      setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Làm bài mới'; t.classList.remove('danger'); } }, 3000);
      return;
    }
    if (t.id === 'img-clear') { S.image = null; save(); render(); return; }
    if (t.id === 'paste-btn') { pasteFromClipboard(); return; }
    if (t.id === 'ocr-btn') { runOCR(t); return; }
    if (t.id === 'ai-btn') { runAI(t); return; }
    if (t.dataset.chip) { showChip(t); return; }
    if (t.dataset.use) { useSentence(t.dataset.use); return; }
    const act = t.dataset.act;
    if (!act) return;
    if (act === 'add-feature') { S.features.push(newFeature()); save(); render(); return; }
    if (act === 'add-change') { S.changes.push(newChange()); save(); render(); return; }
    if (act === 'del-feature') { S.features = S.features.filter(f => f.id !== t.dataset.id); if (!S.features.length) S.features.push(newFeature()); save(); render(); return; }
    if (act === 'del-change') { S.changes = S.changes.filter(c => c.id !== t.dataset.id); if (!S.changes.length) S.changes.push(newChange()); save(); render(); return; }
    if (act === 'star') {
      const c = findItem('change', t.dataset.id);
      c.main = !c.main;
      if (c.main && S.changes.filter(x => x.main).length > 4) toast('Mẹo: chỉ nên chọn 3-4 thay đổi chính.');
      save(); render(); return;
    }
    if (act === 'clear-sec') { S.draft[S.step] = ''; save(); render(); return; }
    if (act === 'copy') {
      const txt = essayText();
      if (!txt) { toast('Chưa có nội dung để sao chép.'); return; }
      try { await navigator.clipboard.writeText(txt); toast('Đã sao chép bài viết.'); }
      catch (err) { toast('Không sao chép được — hãy bôi đen và copy thủ công.'); }
    }
  });

  function showChip(btn) {
    const [key, id] = btn.dataset.chip.split(':');
    const list = key === 'pos' ? C.positionVocab : C.changeVocab;
    const v = list.find(x => x.id === id);
    const box = btn.closest('.prep-box').querySelector('[data-chip-detail]');
    const wasOn = btn.classList.contains('on');
    btn.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('on'));
    if (wasOn) { box.innerHTML = ''; return; }
    btn.classList.add('on');
    box.innerHTML = `<b>${esc(v.phrase)}</b> — ${esc(v.meaning)}<br>${esc(v.usage)} <i>“${esc(v.example)}”</i><br><span class="muted">${esc(v.note)}</span>`;
  }

  function useSentence(ref) {
    const [sec, si, vi] = ref.split(':');
    const slot = slotsFor(sec)[+si];
    const v = slot && slot.variants[+vi];
    if (!v) return;
    let d = S.draft[sec] || '';
    if (d.includes(v.text)) { S.draft[sec] = d.replace(v.text, '').replace(/\s{2,}/g, ' ').trim(); }
    else {
      // bỏ phương án khác của cùng câu nếu đã dùng → mỗi câu chỉ 1 phương án
      slot.variants.forEach(o => { if (o !== v && d.includes(o.text)) d = d.replace(o.text, '').replace(/\s{2,}/g, ' ').trim(); });
      S.draft[sec] = (d ? d.replace(/\s+$/, '') + ' ' : '') + v.text;
    }
    save();
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  }

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'prompt-text') {
      S.promptText = t.value;
      const changed = applyDetect();
      save();
      if (changed) {
        ['place', 'year1', 'year2', 'tense'].forEach(k => { const el = document.querySelector(`[data-f="${k}"]`); if (el && el !== t) el.value = S[k]; });
      }
      const ai = $('#ai-btn'); if (ai) ai.disabled = !(S.image || S.promptText.trim());
      renderStepper();
      return;
    }
    if (t.dataset.f) { S[t.dataset.f] = t.value; S['_manual_' + t.dataset.f] = true; save(); renderStepper(); return; }
    if (t.id === 'sec-draft') {
      S.draft[t.dataset.sec] = t.value; save();
      $('#sec-count').textContent = wc(t.value) + ' từ';
      renderEssay(); renderStepper();
      return;
    }
    if (t.id === 'lib-q') {
      S.libQ = t.value;
      const pos = t.selectionStart;
      render();
      const n = $('#lib-q'); n.focus(); n.setSelectionRange(pos, pos);
      return;
    }
    if (t.dataset.k && t.tagName === 'INPUT') {
      const it = findItem(t.dataset.k, t.dataset.id);
      if (!it) return;
      if (t.dataset.p === 'ref') it.pos.ref = t.value; else it[t.dataset.p] = t.value;
      save();
      const pv = document.querySelector(`[data-preview="${it.id}"]`);
      if (pv) pv.textContent = t.dataset.k === 'feature' ? featurePreview(it) : changePreview(it);
      renderStepper();
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.check != null) { S.checks[t.dataset.check] = t.checked; save(); return; }
    if (t.id === 'file') { setImageFromFile(t.files[0]); return; }
    if (t.dataset.f === 'tense') { S.tense = t.value; S._manual_tense = true; save(); return; }
    if (t.dataset.k && t.tagName === 'SELECT') {
      const it = findItem(t.dataset.k, t.dataset.id);
      if (!it) return;
      const p = t.dataset.p;
      if (p === 'rel') {
        const r = E.REL[t.value];
        it.pos = { rel: t.value, dir: r && r.dirs ? (r.dirs.includes(it.pos.dir) ? it.pos.dir : r.dirs[0]) : '', ref: it.pos.ref || '' };
      } else if (p === 'dir') it.pos.dir = t.value;
      else it[p] = t.value;
      save(); render();
    }
  });

  // Dán ảnh bằng Ctrl+V ở bất kỳ đâu
  document.addEventListener('paste', e => {
    const items = e.clipboardData && e.clipboardData.items ? [...e.clipboardData.items] : [];
    const img = items.find(i => i.type.startsWith('image/'));
    if (!img) return;
    e.preventDefault();
    if (S.view !== 'outline' || S.step !== 'prompt') { S.view = 'outline'; S.step = 'prompt'; }
    setImageFromFile(img.getAsFile());
  });
  async function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.read) { toast('Trình duyệt chưa hỗ trợ — hãy nhấn Ctrl+V hoặc chọn ảnh.'); return; }
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find(x => x.startsWith('image/'));
        if (type) { setImageFromFile(new File([await it.getType(type)], 'paste', { type })); return; }
      }
      toast('Clipboard không có ảnh.');
    } catch (err) { toast('Không đọc được clipboard — hãy nhấn Ctrl+V hoặc chọn ảnh.'); }
  }

  // Kéo thả
  document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('#dropzone'); if (z) { e.preventDefault(); z.classList.add('drag'); } });
  document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('#dropzone'); if (z) z.classList.remove('drag'); });
  document.addEventListener('drop', e => {
    const z = e.target.closest && e.target.closest('#dropzone');
    if (!z) return;
    e.preventDefault(); z.classList.remove('drag');
    setImageFromFile(e.dataTransfer.files[0]);
  });

  async function runOCR(btn) {
    if (!S.image) return;
    const status = $('#ai-status');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang đọc chữ…';
    try {
      const text = await AI.ocr(S.image.dataUrl, p => { status.textContent = `OCR: ${Math.round(p * 100)}%`; });
      if (!text) throw new Error('Không thấy chữ trong ảnh.');
      S.promptText = text;
      applyDetect(); save(); render();
      toast('Đã đọc chữ của đề. Kiểm tra lại phần Thông tin đề.');
    } catch (err) {
      btn.disabled = false; btn.textContent = '🔤 Đọc chữ trong ảnh (OCR)';
      status.textContent = '⚠️ ' + err.message;
    }
  }

  async function runAI(btn) {
    if (!SAMPLE && !AI.getKey()) { $('#api-key').value = ''; $('#settings').showModal(); return; }
    const status = $('#ai-status');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> AI đang đọc đề…';
    status.textContent = 'Có thể mất 10–40 giây.';
    try {
      const r = await AI.analyze({ text: S.promptText.trim(), image: S.image });
      applyAI(r);
      save();
      toast('AI đã điền xong — kiểm tra lại ở bước Phân tích.', 3500);
      go('analyze');
    } catch (err) {
      btn.disabled = false; btn.textContent = '🤖 AI đọc đề + bản đồ';
      status.textContent = '⚠️ ' + (err && err.message ? err.message : String(err));
    }
  }

  // Trong claude.ai: dùng Claude của người xem (không cần key), ẩn nút cài đặt key
  const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
  let SAMPLE = null;
  if (IN_CLAUDE) $('#btn-settings').hidden = true;

  renderTypes();
  render();
  AI.sampleCaps().then(caps => {
    if (!caps) return;
    SAMPLE = caps;
    if (S.view === 'outline' && S.step === 'prompt') render();
  });
})();
