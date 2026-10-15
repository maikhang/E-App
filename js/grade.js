/* 📝 Chấm bài: giáo viên dán đề + bài của học sinh → AI chấm 4 tiêu chí IELTS, đối chiếu số liệu với đề,
 * xem từng đoạn có đúng dàn ý Ms. Gigi không, chỉ ra từng lỗi và sửa trên chính bài của em, kèm bài mẫu
 * nâng cấp theo dàn ý. Sao chép phiếu chấm (bảng màu) gửi học sinh; lưu lịch sử bài đã chấm. */
window.GRADE = (function () {
  const G = window.GIGI, C = window.CONTENT;
  const STORE = 'e-app.grade.v1';
  const CRIT = [
    ['ta', 'Task Achievement', 'Hoàn thành yêu cầu đề'],
    ['cc', 'Coherence & Cohesion', 'Mạch lạc & liên kết'],
    ['lr', 'Lexical Resource', 'Từ vựng'],
    ['gra', 'Grammatical Range & Accuracy', 'Ngữ pháp'],
  ];
  const ROLE = { intro: 'Introduction', overview: 'Overview', body1: 'Body 1', body2: 'Body 2', other: 'Đoạn khác' };
  const ROLE_STEP = { intro: 0, overview: 1, body1: 2, body2: 3 };
  const ETYPE = { grammar: 'Ngữ pháp', spelling: 'Chính tả', punctuation: 'Dấu câu', vocabulary: 'Từ vựng', data: 'Số liệu', rule: 'Quy tắc Ms. Gigi', frame: 'Khung câu', coherence: 'Liên kết' };
  const MAX_HISTORY = 40;
  let H = null, $, esc, toast;

  /* ================= State ================= */
  function blank() {
    return { image: null, visual: null, prompt: '', essay: '', name: '', result: null, date: '', isDemo: false, history: [] };
  }
  let R = load();
  function load() {
    try { const raw = localStorage.getItem(STORE); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch (e) { /* bỏ qua */ }
    return blank();
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(writeNow, 200);
  }
  function writeNow() {
    saveT = null;
    try { localStorage.setItem(STORE, JSON.stringify(R)); }
    catch (e) { try { localStorage.setItem(STORE, JSON.stringify(Object.assign({}, R, { image: null }))); } catch (e2) { /* bỏ qua */ } }
  }
  addEventListener('pagehide', () => { if (saveT) { clearTimeout(saveT); writeNow(); } });
  const wc = s => (String(s || '').match(/[A-Za-z0-9][A-Za-z0-9'.,%-]*/g) || []).length;
  const paras = s => String(s || '').split(/\n+/).map(p => p.trim()).filter(Boolean);
  const level = b => (b >= 7 ? 'hi' : b >= 6 ? 'mid' : 'lo');
  const LEVEL_VI = { hi: 'Tốt', mid: 'Khá', lo: 'Cần cố gắng' };
  const LEVEL_INK = { hi: ['#e3f4e8', '#136c3a'], mid: ['#fbf1d9', '#93600a'], lo: ['#fdf0ee', '#b42318'] };
  const fmtBand = b => (Number.isInteger(b) ? b.toFixed(1) : String(b));
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; } };

  /* ================= Views ================= */
  let busy = false;
  function render() {
    $('#grade-setup').hidden = busy || !!R.result;
    $('#grade-history').hidden = busy || !!R.result || !R.history.length;
    $('#grade-loading').hidden = !busy;
    $('#grade-result').hidden = busy || !R.result;
    if (!busy) { if (R.result) renderResult(); else renderSetup(); }
    if (!$('#view-grade').hidden) H.layout();
  }
  function renderSetup() {
    $('#gr-prompt').value = R.prompt;
    $('#gr-essay').value = R.essay;
    $('#gr-name').value = R.name;
    updateWc();
    renderImage();
    $('#gr-use-write').hidden = !H.writingTask();
    $('#gr-hist').innerHTML = R.history.map((h, k) => `<li>
      <button type="button" class="gr-hist-open" data-hist="${k}"><span class="gr-hist-band ${level(h.result.overall)}">${fmtBand(h.result.overall)}</span>
        <span class="gr-hist-main"><b>${esc(h.name || 'Học sinh')}</b> <span class="muted small">· ${fmtDate(h.date)}</span><span class="gr-hist-ex">${esc(h.essay.slice(0, 110))}…</span></span></button>
      <button type="button" class="btn sm ghost" data-hist-del="${k}" aria-label="Xoá bài đã chấm của ${esc(h.name || 'học sinh')}">✕</button></li>`).join('');
  }
  function updateWc() {
    const n = wc($('#gr-essay').value);
    $('#gr-wc').textContent = `${n} từ${n && n < 150 ? ' · dưới 150' : ''}`;
    $('#gr-wc').classList.toggle('warn', !!n && n < 150);
  }
  function renderImage() {
    const img = $('#gr-img');
    if (R.image) { img.src = R.image.dataUrl; img.hidden = false; $('#gr-drop-empty').hidden = true; $('#gr-img-clear').hidden = false; }
    else { img.removeAttribute('src'); img.hidden = true; $('#gr-drop-empty').hidden = false; $('#gr-img-clear').hidden = true; }
  }
  function takeImage(file) {
    if (!file || !/^image\//.test(file.type)) return;
    const rd = new FileReader();
    rd.onload = () => H.downscale(rd.result, file.type).then(img => { R.image = img; R.visual = null; save(); renderImage(); toast('Đã nhận ảnh đề bài.'); });
    rd.readAsDataURL(file);
  }
  const setupVisible = () => !$('#view-grade').hidden && !$('#grade-setup').hidden;

  /* ================= Chấm bằng AI ================= */
  let ctl = null, tick = null;
  async function grade() {
    R.prompt = $('#gr-prompt').value.trim(); R.essay = $('#gr-essay').value.trim(); R.name = $('#gr-name').value.trim();
    const note = $('#gr-note'); note.classList.remove('err'); note.textContent = '';
    const err = m => { note.textContent = m; note.classList.add('err'); };
    if (!R.prompt && !R.image) { err('Hãy dán đề bài (ảnh hoặc chữ) để AI đối chiếu số liệu.'); return; }
    if (wc(R.essay) < 20) { err('Hãy dán bài viết của học sinh (ít nhất vài câu).'); $('#gr-essay').focus(); return; }
    save();
    const avail = await H.available();
    if (avail.via === 'key' && !H.getKey()) { H.openKey(); return; }
    busy = true; render();
    const t0 = Date.now();
    const stage = txt => { $('#gr-stage').textContent = txt; };
    $('#gr-elapsed').textContent = '0 giây';
    tick = setInterval(() => { $('#gr-elapsed').textContent = Math.round((Date.now() - t0) / 1000) + ' giây'; }, 1000);
    ctl = new AbortController();
    try {
      // Cùng một đề cho nhiều học sinh: ảnh đã đọc rồi thì không đọc lại
      if (R.image && !R.visual) {
        try {
          stage('Bước 1/2 · AI đang đọc ảnh đề: câu hỏi, số liệu, chú thích…');
          const r = await AI.readImage({ image: R.image, signal: ctl.signal });
          R.visual = r.visual;
          if (!R.prompt && r.prompt_text) R.prompt = r.prompt_text;
        } catch (e) {
          if (e.code === 'cancelled') throw e;
          if (!['images_unavailable', 'image_rejected'].includes(e.code)) throw e;
          stage('Bước 1/2 · Chế độ xem này không gửi được ảnh cho AI — đang đọc chữ trong ảnh (OCR)…');
          try { R.visual = await AI.ocr(R.image, p => stage(`Bước 1/2 · Đang đọc chữ trong ảnh (OCR) ${Math.round(p * 100)}%…`)); }
          catch (oe) { if (!R.prompt) throw new Error('Không đọc được ảnh đề (' + oe.message + '). Hãy dán chữ của đề rồi chấm lại.'); }
        }
      }
      stage(`Bước ${R.image ? 2 : 1}/${R.image ? 2 : 1} · AI đối chiếu số liệu, chấm 4 tiêu chí, kiểm tra dàn ý từng đoạn và sửa lỗi…`);
      R.result = await AI.gradeEssay({ text: R.prompt, visual: R.visual, essay: R.essay, signal: ctl.signal });
      R.date = new Date().toISOString(); R.isDemo = false;
      R.history.unshift({ date: R.date, name: R.name, prompt: R.prompt, visual: R.visual, essay: R.essay, result: R.result });
      R.history = R.history.slice(0, MAX_HISTORY);
      save();
      toast(`Đã chấm xong: band ước tính ${fmtBand(R.result.overall)}.`, 3500);
    } catch (e) {
      if (e.code !== 'cancelled') err('⚠️ ' + (e.message || 'AI chưa chấm được bài. Thử lại.') + (e.code ? ` (mã: ${e.code})` : ''));
    } finally {
      clearInterval(tick); ctl = null; busy = false; render(); window.scrollTo({ top: 0 });
    }
  }

  /* ================= Phiếu chấm trên màn hình ================= */
  function facts() {
    const ps = paras(R.essay), words = wc(R.essay);
    return { words, paraCount: ps.length, overview: ps.some(p => /^\s*overall\b/i.test(p)) };
  }
  // Lỗi theo quy tắc của cô (kiểm tra ngay trong trình duyệt) cho từng đoạn theo vai trò AI xác định
  function lintFor(p) {
    const text = paras(R.essay)[p.p - 1] || '';
    return p.role in ROLE_STEP ? G.lint(text, R.result.outline, ROLE_STEP[p.role]) : [];
  }
  function renderResult() {
    const r = R.result, o = G.OUTLINES[r.outline], f = facts();
    H.setPaneImage($('#pane-grade'), R.image);
    $('#gr-prompt-view').textContent = R.prompt;
    $('#gr-data').hidden = !r.data.length;
    $('#gr-data-list').innerHTML = r.data.map(x => `<li>${esc(x)}</li>`).join('');
    $('#gr-orig').innerHTML = paras(R.essay).map((p, i) => `<p class="gr-orig-p"><span class="gr-pno">Đoạn ${i + 1}</span>${esc(p)}</p>`).join('');
    $('#gr-meta').textContent = `${R.name || 'Học sinh'} · ${fmtDate(R.date)} · Dàn ý Ms. Gigi: ${o.short}${R.isDemo ? ' · bài chấm mẫu (đề minh hoạ)' : ''}`;
    const lv = level(r.overall);
    const tiles = `<div class="gr-score">
      <div class="gr-overall ${lv}"><span class="gr-ov-lbl">Band ước tính</span><span class="gr-ov-band">${fmtBand(r.overall)}</span><span class="gr-ov-lv">${LEVEL_VI[lv]}</span></div>
      <div class="gr-crit-tiles">${CRIT.map(([k, en, vi]) => `<div class="gr-tile ${level(r.bands[k])}"><span class="gr-tile-band">${fmtBand(r.bands[k])}</span><span class="gr-tile-name"><b>${k.toUpperCase()}</b> · ${vi}</span></div>`).join('')}</div>
    </div>
    <p class="gr-facts"><span class="${f.words < 150 ? 'bad' : 'ok'}">${f.words < 150 ? '⚠️' : '✓'} ${f.words} từ${f.words < 150 ? ' (cần ≥ 150)' : ''}</span>
      <span class="${f.overview ? 'ok' : 'bad'}">${f.overview ? '✓ Có Overview' : '⚠️ Chưa có Overview “Overall,”'}</span>
      <span class="${f.paraCount === 4 ? 'ok' : 'bad'}">${f.paraCount === 4 ? '✓' : '⚠️'} ${f.paraCount} đoạn</span>
      <span class="${r.errors.some(e => e.type === 'data') ? 'bad' : 'ok'}">${r.errors.some(e => e.type === 'data') ? `⚠️ ${r.errors.filter(e => e.type === 'data').length} lỗi số liệu` : '✓ Số liệu khớp đề'}</span></p>
    <p class="muted small">Band là ước tính theo tiêu chí IELTS Task 1 (trung bình 4 tiêu chí), dùng để luyện tập — không thay cho điểm thi chính thức.</p>`;
    const summary = `<section class="gr-sec"><h3>💬 Nhận xét chung</h3><p>${esc(r.summary_vi)}</p>
      ${r.priorities_vi.length ? `<div class="gr-prio"><b>🎯 3 việc cần làm ở bài sau</b><ol>${r.priorities_vi.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}</section>`;
    const crit = `<section class="gr-sec"><h3>📊 Nhận xét theo 4 tiêu chí</h3><div class="gr-crit">${CRIT.map(([k, en, vi]) => `<div class="gr-crit-card">
      <div class="gr-crit-head"><span class="gr-band-pill ${level(r.bands[k])}">${fmtBand(r.bands[k])}</span><div><b>${vi}</b><span class="muted small"> · ${en}</span></div></div>
      ${r.criteria[k].good_vi.length ? `<ul class="gr-good">${r.criteria[k].good_vi.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${r.criteria[k].fix_vi.length ? `<ul class="gr-fix">${r.criteria[k].fix_vi.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div></section>`;
    const outline = `<section class="gr-sec"><h3>📐 Từng đoạn theo dàn ý Ms. Gigi · ${esc(o.name)}</h3>
      <div class="gr-outline">${r.paragraphs.map(p => {
        const lint = lintFor(p);
        return `<div class="gr-op ${p.ok && !lint.length ? 'ok' : 'warn'}"><div class="gr-op-head"><span class="gr-pno">Đoạn ${p.p}</span><b>${ROLE[p.role] || ROLE.other}</b>
          <span class="gr-op-verdict">${p.ok && !lint.length ? '✓ Đúng dàn ý' : '⚠️ Cần sửa theo dàn ý'}</span>${p.frames.map(n => `<span class="fno">K${n}</span>`).join('')}</div>
          ${p.note_vi ? `<p>${esc(p.note_vi)}</p>` : ''}${lint.map(m => `<p class="warn-line">⚠️ ${esc(m)}</p>`).join('')}</div>`;
      }).join('')}</div></section>`;
    const errs = `<section class="gr-sec"><h3>🔍 Lỗi trong bài (${r.errors.length})</h3>${r.errors.length ? `<ol class="gr-errs">${r.errors.map(e => `<li>
        <span class="etag e-${e.type}">${ETYPE[e.type]}</span>${e.s ? ` <span class="gr-sref">câu ${esc(e.s)}</span>` : ''}
        ${e.wrong ? `<del>${esc(e.wrong)}</del>` : ''}${e.fix ? ` → <ins>${esc(e.fix)}</ins>` : ''}${e.why_vi ? `<span class="why">${esc(e.why_vi)}</span>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Không tìm thấy lỗi — bài rất tốt!</p>'}</section>`;
    const fixed = `<section class="gr-sec"><h3>✏️ Bài của em đã sửa lỗi</h3><p class="muted small">Giữ nguyên câu chữ của em, chỉ sửa chỗ sai: <del>gạch đỏ</del> là bỏ, <ins>tô xanh</ins> là sửa.</p>
      <div class="gr-essay">${diffParas(R.essay, r.corrected).map(h => `<p>${h}</p>`).join('')}</div></section>`;
    const model = r.model ? `<section class="gr-sec"><h3>🌟 Bài mẫu nâng cấp theo dàn ý của cô</h3><p class="muted small">Viết lại theo khung câu Ms. Gigi, số liệu đúng đề, giữ các ý đúng của em.</p>
      <div class="gr-essay model">${paras(r.model).map(p => `<p>${esc(p)}</p>`).join('')}</div></section>` : '';
    $('#gr-body').innerHTML = tiles + summary + crit + outline + errs + fixed + model;
  }
  // So sánh từng đoạn (nếu số đoạn khớp), không thì so sánh cả bài
  function diffParas(a, b) {
    const A = paras(a), B = paras(b);
    if (A.length === B.length) return A.map((p, i) => H.diffHtml(p, B[i]));
    return [H.diffHtml(A.join(' '), B.join(' '))];
  }

  /* ================= Sao chép phiếu chấm ================= */
  function sheetPlain() {
    const r = R.result, o = G.OUTLINES[r.outline], f = facts();
    const line = '━━━━━━━━━━━━━━━━━━━━';
    const out = ['📝 PHIẾU CHẤM IELTS WRITING TASK 1 · MS. NHI GIGI', `Học sinh: ${R.name || '—'} · Ngày: ${fmtDate(R.date)}`, `Dàn ý: ${o.name} · ${f.words} từ`];
    if (R.prompt) out.push('', '📌 ĐỀ BÀI', R.prompt);
    out.push('', line, `🏅 BAND ƯỚC TÍNH: ${fmtBand(r.overall)}`, line,
      CRIT.map(([k, en, vi]) => `${k.toUpperCase()} (${vi}): ${fmtBand(r.bands[k])}`).join(' · '));
    out.push('', '💬 NHẬN XÉT CHUNG', r.summary_vi);
    if (r.priorities_vi.length) out.push('🎯 Cần làm ở bài sau:', ...r.priorities_vi.map((x, i) => `  ${i + 1}. ${x}`));
    out.push('', line, '📊 THEO 4 TIÊU CHÍ', line);
    CRIT.forEach(([k, en, vi]) => {
      out.push('', `${vi} (${en}) — ${fmtBand(r.bands[k])}`);
      r.criteria[k].good_vi.forEach(x => out.push(`  ✓ ${x}`));
      r.criteria[k].fix_vi.forEach(x => out.push(`  ✗ ${x}`));
    });
    out.push('', line, '📐 TỪNG ĐOẠN THEO DÀN Ý MS. GIGI', line);
    r.paragraphs.forEach(p => out.push(`Đoạn ${p.p} · ${ROLE[p.role] || ROLE.other}: ${p.ok ? '✓' : '⚠️'} ${p.note_vi}${p.frames.length ? ' (khung ' + p.frames.map(n => 'K' + n).join(', ') + ')' : ''}`));
    out.push('', line, `🔍 LỖI TRONG BÀI (${r.errors.length})`, line);
    r.errors.forEach((e, i) => out.push(`${i + 1}. [${ETYPE[e.type]}${e.s ? ' · câu ' + e.s : ''}] ${e.wrong ? e.wrong + ' → ' : ''}${e.fix}${e.why_vi ? ' — ' + e.why_vi : ''}`));
    out.push('', line, '✏️ BÀI CỦA EM ĐÃ SỬA LỖI', line, ...paras(r.corrected).flatMap(p => ['', p]));
    if (r.model) out.push('', line, '🌟 BÀI MẪU NÂNG CẤP THEO DÀN Ý CỦA CÔ', line, ...paras(r.model).flatMap(p => ['', p]));
    return out.join('\n');
  }
  const DEL = 'color:#b42318;background:#fde3df;text-decoration:line-through';
  const INS = 'color:#136c3a;background:#d5efdd;font-weight:bold;text-decoration:none';
  const inlineDiff = h => h.replace(/<del>/g, `<span style="${DEL}">`).replace(/<\/del>/g, '</span>').replace(/<ins>/g, `<span style="${INS}">`).replace(/<\/ins>/g, '</span>');
  function sheetHtml() {
    const r = R.result, o = G.OUTLINES[r.outline], f = facts();
    const B = '1px solid #d5dfd0';
    const td = (x, st, at) => `<td style="border:${B};padding:7px 9px;vertical-align:top;${st || ''}"${at || ''}>${x}</td>`;
    const hd = 'background:#2f6f45;color:#ffffff;border:1px solid #2f6f45;padding:7px 9px;text-align:left';
    const table = rows => `<table style="border-collapse:collapse;width:100%;margin:0 0 14px;font-size:14px;line-height:1.5">${rows}</table>`;
    const h2 = t => `<h2 style="font-size:17px;margin:22px 0 8px;color:#2f6f45;border-bottom:3px solid #2f6f45;padding-bottom:4px">${t}</h2>`;
    const essayStyle = "font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7";
    const bullets = list => list.map(x => '• ' + esc(x)).join('<br>');
    const tile = (b, label) => { const [bg, ink] = LEVEL_INK[level(b)]; return td(`<div style="font-size:26px;font-weight:bold;color:${ink}">${fmtBand(b)}</div><div style="font-size:12px;color:${ink}">${label}</div>`, `background:${bg};text-align:center`); };
    let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1d281b;max-width:860px">`;
    h += table(`<tr><td style="background:#2f6f45;color:#ffffff;padding:14px 16px"><div style="font-size:21px;font-weight:bold">📝 Phiếu chấm IELTS Writing Task 1</div><div style="font-size:14px;margin-top:2px">Ms. Nhi Gigi · chấm theo 4 tiêu chí IELTS và dàn ý của cô</div></td></tr>`);
    const info = [['Học sinh', esc(R.name || '—')], ['Ngày chấm', fmtDate(R.date)], ['Dàn ý', esc(o.name)], ['Số từ', `${f.words} từ${f.words < 150 ? ' <span style="color:#b42318">(cần tối thiểu 150 từ)</span>' : ''}`]];
    if (R.prompt) info.push(['Đề bài', `<i>${esc(R.prompt)}</i>`]);
    h += table(info.map(([k, v]) => `<tr>${td('<b>' + k + '</b>', 'background:#e0eee2;width:110px;white-space:nowrap')}${td(v)}</tr>`).join(''));
    h += h2('🏅 Kết quả');
    h += table(`<tr>${tile(r.overall, 'BAND ƯỚC TÍNH')}${CRIT.map(([k, en, vi]) => tile(r.bands[k], `${k.toUpperCase()} · ${vi}`)).join('')}</tr>`);
    h += `<p style="margin:0 0 6px"><b>💬 Nhận xét chung:</b> ${esc(r.summary_vi)}</p>`;
    if (r.priorities_vi.length) h += `<div style="background:#fbf1d9;border-radius:6px;padding:8px 12px;margin:0 0 10px"><b style="color:#93600a">🎯 3 việc cần làm ở bài sau</b><ol style="margin:4px 0 0;padding-left:22px">${r.priorities_vi.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
    h += h2('📊 Nhận xét theo 4 tiêu chí');
    h += table(`<tr><th style="${hd};width:26%">Tiêu chí</th><th style="${hd};width:60px">Band</th><th style="${hd}">✓ Làm tốt</th><th style="${hd}">✗ Cần sửa</th></tr>` + CRIT.map(([k, en, vi], i) => {
      const [bg, ink] = LEVEL_INK[level(r.bands[k])], z = i % 2 ? '#ffffff' : '#f3f8f0';
      return `<tr>${td(`<b>${vi}</b><br><span style="color:#5b6957;font-size:12px">${en}</span>`, `background:${z}`)}${td(`<b style="color:${ink}">${fmtBand(r.bands[k])}</b>`, `background:${bg};text-align:center`)}${td(bullets(r.criteria[k].good_vi), `background:${z}`)}${td(bullets(r.criteria[k].fix_vi), `background:${z}`)}</tr>`;
    }).join(''));
    h += h2(`📐 Từng đoạn theo dàn ý Ms. Gigi · ${esc(o.name)}`);
    h += table(`<tr><th style="${hd};width:70px">Đoạn</th><th style="${hd};width:100px">Vai trò</th><th style="${hd};width:120px">Dàn ý</th><th style="${hd}">Nhận xét</th></tr>` + r.paragraphs.map(p => {
      const ok = p.ok && !lintFor(p).length;
      return `<tr>${td(`<b>${p.p}</b>`)}${td(ROLE[p.role] || ROLE.other)}${td(`${ok ? '✓ Đúng' : '⚠️ Cần sửa'}${p.frames.length ? '<br><span style="font-size:12px">' + p.frames.map(n => 'K' + n).join(', ') + '</span>' : ''}`, ok ? 'background:#e3f4e8;color:#136c3a' : 'background:#fbf1d9;color:#93600a')}${td(esc(p.note_vi) + lintFor(p).map(m => `<br><span style="color:#93600a">⚠️ ${esc(m)}</span>`).join(''))}</tr>`;
    }).join(''));
    h += h2(`🔍 Lỗi trong bài (${r.errors.length})`);
    if (r.errors.length) h += table(`<tr><th style="${hd};width:28px">#</th><th style="${hd};width:110px">Loại · câu</th><th style="${hd}">Lỗi → sửa</th><th style="${hd}">Giải thích</th></tr>` + r.errors.map((e, i) => {
      const z = i % 2 ? '#ffffff' : '#fafbf9';
      return `<tr>${td(`<b>${i + 1}</b>`, `background:${z}`)}${td(`${ETYPE[e.type]}${e.s ? `<br><span style="color:#5b6957;font-size:12px">câu ${esc(e.s)}</span>` : ''}`, `background:${z}${e.type === 'data' ? ';color:#b42318;font-weight:bold' : ''}`)}${td(`${e.wrong ? `<span style="${DEL}">${esc(e.wrong)}</span> → ` : ''}<span style="${INS}">${esc(e.fix)}</span>`, `background:${z}`)}${td(esc(e.why_vi), `background:${z};color:#3d4a3a`)}</tr>`;
    }).join(''));
    h += h2('✏️ Bài của em đã sửa lỗi');
    h += `<p style="margin:0 0 6px;color:#5b6957">Giữ nguyên câu chữ của em, chỉ sửa chỗ sai: <span style="${DEL}">gạch đỏ</span> là bỏ, <span style="${INS}">tô xanh</span> là sửa.</p>`;
    h += `<div style="${essayStyle};background:#f7faf5;border:1px solid #d5dfd0;border-radius:6px;padding:10px 14px">${diffParas(R.essay, r.corrected).map(x => `<p style="margin:0 0 10px">${inlineDiff(x)}</p>`).join('')}</div>`;
    if (r.model) {
      h += h2('🌟 Bài mẫu nâng cấp theo dàn ý của cô');
      h += `<div style="${essayStyle};background:#eaf1fb;border:1px solid #c9daf2;border-radius:6px;padding:10px 14px">${paras(r.model).map(p => `<p style="margin:0 0 10px">${esc(p)}</p>`).join('')}</div>`;
    }
    return h + '<p style="color:#8a958a;font-size:12px;margin:10px 0 0">Band là ước tính để luyện tập, không thay cho điểm thi chính thức. Soạn bằng Ms. Nhi Gigi.</p></div>';
  }
  function fixedCopy() {
    const r = R.result;
    const plain = `✏️ BÀI ĐÃ SỬA LỖI${R.name ? ' · ' + R.name : ''}\n\n` + paras(r.corrected).join('\n\n');
    const html = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;color:#1d281b"><p style="font-family:Arial,sans-serif"><b>✏️ Bài đã sửa lỗi${R.name ? ' · ' + esc(R.name) : ''}</b> — <span style="${DEL}">gạch đỏ</span> là bỏ, <span style="${INS}">tô xanh</span> là sửa.</p>${diffParas(R.essay, r.corrected).map(x => `<p>${inlineDiff(x)}</p>`).join('')}</div>`;
    return { plain, html };
  }

  /* ================= Bài chấm mẫu (không cần AI) ================= */
  function demo() {
    const d = C.demo;
    const model = [d.steps[0].sentences[0].options[1].text, d.steps[1].sentences.map(s => s.options[0].text).join(' ')]
      .concat(d.steps.slice(2).map(st => st.sentences.map(s => s.options[0].text).join(' '))).join('\n\n');
    const essay = [
      'The maps show the change of Stokeford village from 1930 to 2010.',
      'Overall, the village has many changes, the farmland was replaced by houses and a retirement home was built.',
      'In 1930, there was a row of houses along the main road and a school in the center. The post office was located next the school. In the south, there was farmland which accounted for 50% of the village.',
      'By 2010, the farmland was demolished and replace by a residential area with a new road. The school was expanded to the east and the post office was converted into a shop. A retirement home was built in the north. The main road remain unchanged.',
    ].join('\n');
    const corrected = [
      'The maps show the changes in the village of Stokeford between 1930 and 2010.',
      'Overall, the village underwent significant development, with the farmland replaced by houses and a retirement home built.',
      'In 1930, there was a row of houses along the main road and a school in the center. The post office was located next to the school. In the south, there was farmland which covered a large area.',
      'By 2010, the farmland was redeveloped and replaced by a residential area with a new road. The school was expanded to the west and the post office was converted into a shop. A retirement home was built in the north. The main road remained unchanged.',
    ].join('\n\n');
    const E = (s, type, wrong, fix, why_vi) => ({ s, type, wrong, fix, why_vi });
    const result = AI.normGrade({
      task_type: 'maps', outline: 'maps', data: d.data,
      bands: { ta: 5.5, cc: 6, lr: 6, gra: 5.5 },
      criteria: {
        ta: { good_vi: ['Có đủ 4 đoạn và có Overview bắt đầu bằng “Overall,”.', 'Nêu được các thay đổi chính: đất nông nghiệp thành khu dân cư, có viện dưỡng lão mới, bưu điện thành cửa hàng.'],
          fix_vi: ['Bài chỉ khoảng 110 từ — Task 1 cần ít nhất 150 từ: viết đủ khung K1–K4 ở Body 1 và K1–K5 ở Body 2.', 'Sai số liệu: trường mở rộng về phía TÂY, không phải phía đông; đề không có số “50%”.', 'Overview nên nhắc cả điểm giữ nguyên (đường chính, dãy nhà).'] },
        cc: { good_vi: ['Chia đoạn rõ ràng: Introduction → Overview → Body 1 → Body 2.'],
          fix_vi: ['Thiếu câu mở đoạn theo khung của cô ở Body 1 và Body 2.', 'Thêm từ nối Additionally, / Moreover, giữa các câu Body 2.'] },
        lr: { good_vi: ['Dùng đúng từ vựng thay đổi trong bảng của cô: was converted into, was expanded, remained unchanged.'],
          fix_vi: ['“demolished” chỉ dùng cho công trình, không dùng cho đất nông nghiệp → was redeveloped.', 'Lặp “there was” nhiều lần — thay bằng was located / lay / was situated.'] },
        gra: { good_vi: ['Biết dùng câu bị động và mệnh đề quan hệ which.'],
          fix_vi: ['Lỗi nối hai mệnh đề chỉ bằng dấu phẩy ở Overview.', 'Sai thì: has / remain → quá khứ; thiếu V3: replace → replaced.'] },
      },
      paragraphs: [
        { p: 1, role: 'intro', ok: true, frames: [2], note_vi: 'Đúng 1 câu paraphrase theo khung K2, nhưng cần “the changes in … between 1930 and 2010”.' },
        { p: 2, role: 'overview', ok: false, frames: [], note_vi: 'Có “Overall,” và không có số liệu, nhưng chưa theo khung K1 của cô (“…underwent significant development, with …”) và thiếu điểm giữ nguyên.' },
        { p: 3, role: 'body1', ok: false, frames: [2, 3], note_vi: 'Chỉ tả bản đồ 1930 là đúng. Thiếu câu mở đoạn K1 (“In 1930, the layout of the village included several key features.”); câu cuối bịa số liệu 50%.' },
        { p: 4, role: 'body2', ok: true, frames: [2, 3, 4], note_vi: 'Có các thay đổi chính. Thiếu câu mở đoạn K1 và câu kết quả K5 (“These modifications resulted in …”); sai hướng mở rộng của trường.' },
      ],
      errors: [
        E('1.1', 'vocabulary', 'the change of Stokeford village', 'the changes in the village of Stokeford', 'Có nhiều thay đổi → số nhiều; “changes in + nơi chốn”.'),
        E('1.1', 'rule', 'from 1930 to 2010', 'between 1930 and 2010', 'Khung Introduction của cô dùng “between … and …”.'),
        E('2.1', 'grammar', 'has many changes', 'underwent significant development', 'Bản đồ 1930–2010 là quá khứ → thì quá khứ; dùng cụm trong khung Overview của cô.'),
        E('2.1', 'punctuation', 'the farmland was replaced by houses and a retirement home was built', 'with the farmland replaced by houses and a retirement home built', 'Hai mệnh đề nối chỉ bằng dấu phẩy là lỗi — dùng “with + N + V3”.'),
        E('3.2', 'grammar', 'next the school', 'next to the school', '“next to” luôn có “to”.'),
        E('3.3', 'data', 'which accounted for 50% of the village', 'which covered a large area', 'Đề không có số liệu % — không thêm số; “accounted for” chỉ dùng với % của tổng.'),
        E('4.1', 'vocabulary', 'was demolished', 'was redeveloped', '“demolish” (phá dỡ) dùng cho công trình, không dùng cho đất.'),
        E('4.1', 'grammar', 'replace by', 'replaced by', 'Bị động: was + V3 → “(was) replaced”.'),
        E('4.2', 'data', 'to the east', 'to the west', 'Trên bản đồ 2010, trường mở rộng về phía tây.'),
        E('4.4', 'grammar', 'remain unchanged', 'remained unchanged', 'Bản đồ quá khứ → động từ chia quá khứ.'),
      ],
      corrected, model,
      summary_vi: 'Em nắm được bố cục 4 đoạn và các thay đổi chính của làng — đây là nền tảng tốt. Bài còn ngắn, có 2 lỗi số liệu và vài lỗi thì/ngữ pháp nên band ước tính khoảng 6.0. Viết đủ khung câu của cô ở từng đoạn là em sẽ lên 6.5–7.0.',
      priorities_vi: ['Viết đủ 150+ từ: dùng đủ khung K1–K4 ở Body 1 và K1–K5 ở Body 2.', 'Đối chiếu từng số liệu, hướng (đông/tây) với bản đồ trước khi viết; không thêm số không có trong đề.', 'Bản đồ quá khứ → chia động từ quá khứ; bị động luôn là was/were + V3.'],
    }, essay);
    const history = R.history;
    R = Object.assign(blank(), { image: C.demoImage, prompt: d.prompt_text, essay, name: 'Học sinh mẫu', result, date: new Date().toISOString(), isDemo: true, history });
    save(); render(); window.scrollTo({ top: 0 });
    toast('Đang xem bài chấm mẫu (đề minh hoạ, không cần AI).', 3000);
  }

  /* ================= Events ================= */
  function onClick(t) {
    if (t.dataset.hist != null) {
      const h = R.history[+t.dataset.hist];
      if (h) { Object.assign(R, { image: null, visual: h.visual || null, prompt: h.prompt, essay: h.essay, name: h.name, result: h.result, date: h.date, isDemo: false }); save(); render(); window.scrollTo({ top: 0 }); }
      return true;
    }
    if (t.dataset.histDel != null) { R.history.splice(+t.dataset.histDel, 1); save(); render(); return true; }
    switch (t.id) {
      case 'gr-drop': $('#gr-file').click(); return true;
      case 'gr-img-clear': R.image = null; R.visual = null; save(); renderImage(); return true;
      case 'gr-use-write': {
        const w = H.writingTask();
        if (!w) { toast('Chưa có đề nào ở mục Luyện viết bài.'); return true; }
        R.image = w.image; R.visual = w.visual; R.prompt = w.prompt; save(); renderSetup();
        toast('Đã lấy đề đang luyện viết.');
        return true;
      }
      case 'gr-go': grade(); return true;
      case 'gr-demo': demo(); return true;
      case 'gr-stop': if (ctl) ctl.abort(); return true;
      case 'gr-new': // chấm học sinh khác cùng đề: giữ đề, xoá bài
        Object.assign(R, { essay: '', name: '', result: null, date: '', isDemo: false });
        if (R.image && R.image.dataUrl === C.demoImage.dataUrl) Object.assign(R, { image: null, prompt: '', visual: null });
        save(); render(); window.scrollTo({ top: 0 }); $('#gr-essay').focus();
        return true;
      case 'gr-copy': H.copyRich(sheetPlain(), sheetHtml(), 'Đã sao chép phiếu chấm (bảng màu) — dán vào Word, Google Docs, Gmail hoặc Zalo gửi học sinh.'); return true;
      case 'gr-copy-fixed': { const c = fixedCopy(); H.copyRich(c.plain, c.html, 'Đã sao chép bài đã sửa lỗi.'); return true; }
      case 'gr-img-full': if (R.image) { $('#dlg-img-src').src = R.image.dataUrl; $('#dlg-img').showModal(); } return true;
    }
    return false;
  }
  function bind() {
    $('#gr-file').addEventListener('change', e => { takeImage(e.target.files[0]); e.target.value = ''; });
    const dz = $('#gr-drop');
    dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#gr-file').click(); } });
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); takeImage(e.dataTransfer.files[0]); });
    // Đề đổi → phải đọc lại ảnh / đối chiếu lại; nháp được lưu khi gõ
    $('#gr-prompt').addEventListener('input', e => { R.prompt = e.target.value; save(); });
    $('#gr-essay').addEventListener('input', e => { R.essay = e.target.value; updateWc(); save(); });
    $('#gr-name').addEventListener('input', e => { R.name = e.target.value; save(); });
    $('#gr-essay').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); grade(); } });
  }
  function init(helpers) {
    H = helpers; $ = H.$; esc = H.esc; toast = H.toast;
    bind();
  }
  return { init, render, onClick, takeImage, setupVisible };
})();
