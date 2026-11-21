/* 📒 Bảng từ cần học thuộc: (A) từ trong dàn ý của dạng đề (gigi.js → MEMORIZE, Maps thêm 2 bảng từ vựng Maps)
 * + (B) từ của chính đề đang làm (paraphrase chủ thể, từ paraphrase, từ vựng AI gợi ý cho đề).
 * Thứ tự hiển thị: A = từ của đề (nếu có), B = từ trong dàn ý. Hiện trên màn hình và sao chép thành bảng màu (Word / Google Docs) hoặc phiếu tự kiểm tra (che nghĩa). */
window.MEMO = (function () {
  const G = window.GIGI, C = window.CONTENT;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // (A) Từ trong dàn ý của dạng
  function groups(outline) {
    const out = (G.MEMORIZE[outline] || []).slice();
    if (outline === 'maps' && C) {
      out.push({ group: 'Từ vựng thay đổi (Body 2)', items: C.changeVocab.map(v => ({ en: v.phrase, vi: v.meaning, ex: v.example })) });
      out.push({ group: 'Từ vựng vị trí (Body 1 & Body 2)', items: C.positionVocab.map(v => ({ en: v.phrase, vi: v.meaning, ex: v.example })) });
    }
    return out;
  }
  // (B) Từ của đề: src = { paraphrase, subject_pp, vocab }
  function taskWords(src) {
    if (!src) return [];
    const rows = [], seen = new Set();
    const add = r => { const k = String(r.en).toLowerCase().trim(); if (k && !seen.has(k)) { seen.add(k); rows.push(r); } };
    (src.subject_pp || []).forEach(x => add({ en: x.subject, vi: x.meaning_vi, alt: x.ways.map(w => w.text).join(' · '), ex: '' }));
    (src.paraphrase || []).forEach(x => add({ en: x.word, vi: x.meaning_vi, alt: x.alternatives.map(a => a.phrase).join(' · '), ex: '' }));
    (src.vocab || []).forEach(v => add({ en: v.phrase, vi: v.meaning_vi || '', alt: '', ex: v.example || '' }));
    return rows;
  }
  const count = outline => groups(outline).reduce((n, g) => n + g.items.length, 0);

  /* ---------- Trên màn hình ---------- */
  // ctx: nơi gọi (write / lesson / lib:<dạng>) để nút sao chép biết lấy dữ liệu nào
  function screen(outline, src, ctx) {
    const o = G.OUTLINES[outline];
    const task = taskWords(src);
    let n = 0;
    const outlineRows = groups(outline).map(g => `<tr class="memo-g"><td colspan="4">${esc(g.group)}</td></tr>` +
      g.items.map(w => `<tr><td class="memo-n">${++n}</td><td><b>${esc(w.en)}</b></td><td>${esc(w.vi)}</td><td class="memo-ex">${esc(w.ex)}</td></tr>`).join('')).join('');
    const taskRows = task.map((w, i) => `<tr><td class="memo-n">${i + 1}</td><td><b>${esc(w.en)}</b></td><td>${esc(w.vi)}</td><td>${w.alt ? `<span class="memo-alt">${esc(w.alt)}</span>` : ''}${w.ex ? `<span class="memo-ex">${esc(w.ex)}</span>` : ''}</td></tr>`).join('');
    return `<div class="memo">
      <div class="row between memo-head"><div><h3>📒 Từ cần học thuộc${o ? ' · ' + esc(o.short) : ''}</h3>
        <p class="muted small">${task.length ? 'A. Từ của đề này · B. Từ trong dàn ý Ms. Gigi cho dạng này' : 'Từ trong dàn ý Ms. Gigi cho dạng này'} — học sinh học thuộc trước khi viết.</p></div>
        <div class="row"><button type="button" class="btn sm primary" data-memo="full" data-memo-ctx="${esc(ctx)}">📋 Sao chép bảng từ</button>
          <button type="button" class="btn sm" data-memo="quiz" data-memo-ctx="${esc(ctx)}">📝 Phiếu tự kiểm tra</button></div></div>
      ${task.length ? `<h4 class="memo-h">A. Từ của đề này (${task.length} từ)</h4>
      <div class="table-wrap"><table class="memo-t"><thead><tr><th>#</th><th>Từ trong đề</th><th>Nghĩa</th><th>Cách viết khác · ví dụ</th></tr></thead><tbody>${taskRows}</tbody></table></div>` : ''}
      <details class="memo-a" ${task.length ? '' : 'open'}><summary><h4 class="memo-h">${task.length ? 'B. ' : ''}Từ trong dàn ý Ms. Gigi · ${esc(o ? o.name : '')} (${count(outline)} từ)</h4></summary>
      <div class="table-wrap"><table class="memo-t"><thead><tr><th>#</th><th>Từ / cụm từ</th><th>Nghĩa</th><th>Ví dụ</th></tr></thead><tbody>${outlineRows}</tbody></table></div></details>
    </div>`;
  }

  /* ---------- Bản sao chép (style inline để dán Word / Docs giữ màu) ---------- */
  // quiz = phiếu tự kiểm tra: giữ từ tiếng Anh, để trống cột nghĩa cho học sinh tự ghi
  function copy(outline, src, quiz) {
    const o = G.OUTLINES[outline] || { name: '', short: '' };
    const task = taskWords(src), gs = groups(outline);
    const B = '1px solid #d5dfd0', blank = '<span style="color:#c4ccc2">…………………………</span>';
    const td = (x, st) => `<td style="border:${B};padding:6px 8px;vertical-align:top;${st || ''}">${x}</td>`;
    const th = (x, c, w) => `<th style="border:1px solid ${c};background:${c};color:#ffffff;padding:6px 8px;text-align:left;${w ? 'width:' + w : ''}">${x}</th>`;
    const table = rows => `<table style="border-collapse:collapse;width:100%;margin:0 0 14px;font-size:14px;line-height:1.5">${rows}</table>`;
    const h2 = (t, c) => `<h2 style="font-size:16px;margin:18px 0 8px;color:${c};border-bottom:3px solid ${c};padding-bottom:4px">${t}</h2>`;
    let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1d281b;max-width:860px">
      <div style="background:#2f6f45;color:#ffffff;padding:12px 16px;font-size:19px;font-weight:bold">📒 ${quiz ? 'Phiếu tự kiểm tra từ vựng' : 'Từ cần học thuộc'} · ${esc(o.short)}</div>
      <p style="margin:8px 0;color:#5b6957">Ms. Nhi Gigi · IELTS Writing Task 1${quiz ? ' — em ghi nghĩa tiếng Việt vào chỗ trống, rồi so với bảng từ để tự chấm.' : ' — học thuộc trước khi viết bài.'}</p>`;
    const plain = [`📒 ${quiz ? 'PHIẾU TỰ KIỂM TRA TỪ VỰNG' : 'TỪ CẦN HỌC THUỘC'} · ${o.short}`, 'Ms. Nhi Gigi · IELTS Writing Task 1', ''];
    if (task.length) {
      const c = '#5a3fb5';
      h += h2(`A. Từ của đề này (${task.length} từ)`, c);
      h += table(`<tr>${th('#', c, '34px')}${th('Từ trong đề', c, '28%')}${th('Nghĩa', c, '24%')}${th('Cách viết khác · ví dụ', c)}</tr>` + task.map((w, i) => {
        const bg = i % 2 ? '#ffffff' : '#f3f0fb';
        return `<tr>${td(i + 1, `background:${bg};color:#5b6957`)}${td(`<b>${esc(w.en)}</b>`, `background:${bg}`)}${td(quiz ? blank : esc(w.vi), `background:${bg}`)}${td(quiz ? blank : (w.alt ? `<b style="color:${c}">${esc(w.alt)}</b>` : '') + (w.ex ? `${w.alt ? '<br>' : ''}<i style="color:#5b6957">${esc(w.ex)}</i>` : ''), `background:${bg}`)}</tr>`;
      }).join(''));
      plain.push(`A. TỪ CỦA ĐỀ NÀY (${task.length} từ)`, ...task.map((w, i) => quiz ? `${i + 1}. ${w.en} = ……………… → ………………` : `${i + 1}. ${w.en}${w.vi ? ' = ' + w.vi : ''}${w.alt ? ' → ' + w.alt : ''}${w.ex ? '\n   VD: ' + w.ex : ''}`), '');
    }
    const c = '#2f6f45';
    h += h2(`${task.length ? 'B. ' : ''}Từ trong dàn ý Ms. Gigi · ${esc(o.name)}`, c);
    let n = 0, rows = `<tr>${th('#', c, '34px')}${th('Từ / cụm từ', c, '38%')}${th('Nghĩa', c, '26%')}${th(quiz ? 'Đặt câu với từ này' : 'Ví dụ', c)}</tr>`;
    plain.push(`${task.length ? 'B. ' : ''}TỪ TRONG DÀN Ý MS. GIGI · ${o.name}`);
    gs.forEach(g => {
      rows += `<tr><td colspan="4" style="border:${B};background:#e0eee2;padding:6px 8px;font-weight:bold;color:${c}">${esc(g.group)}</td></tr>`;
      plain.push('', `▸ ${g.group}`);
      g.items.forEach((w, i) => {
        const bg = i % 2 ? '#ffffff' : '#f6faf4';
        rows += `<tr>${td(++n, `background:${bg};color:#5b6957`)}${td(`<b>${esc(w.en)}</b>`, `background:${bg}`)}${td(quiz ? blank : esc(w.vi), `background:${bg}`)}${td(quiz ? blank : `<i style="color:#5b6957">${esc(w.ex)}</i>`, `background:${bg}`)}</tr>`;
        plain.push(quiz ? `${n}. ${w.en} = ………………` : `${n}. ${w.en} = ${w.vi}${w.ex ? '\n   VD: ' + w.ex : ''}`);
      });
    });
    h += table(rows) + '<p style="color:#8a958a;font-size:12px;margin:6px 0 0">Soạn bằng Ms. Nhi Gigi · IELTS Writing Task 1</p></div>';
    return { plain: plain.join('\n'), html: h };
  }

  return { groups, taskWords, count, screen, copy };
})();
