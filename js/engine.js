/* Bộ máy sinh câu gợi ý cho dạng MAPS.
 * Chỉ ghép câu từ cụm từ vựng/cấu trúc trong content.js. */
window.ENGINE = (function () {
  const DIRS = ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'];
  const DIR_ADJ = { north: 'northern', south: 'southern', east: 'eastern', west: 'western', 'north-east': 'north-eastern', 'north-west': 'north-western', 'south-east': 'south-eastern', 'south-west': 'south-western', center: 'central' };
  const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

  /* Quan hệ vị trí. dir: danh sách hướng cho phép; ref: 'req' | 'opt' | 'no' | 'map' (mặc định "the map"). */
  const RELATIONS = [
    { id: 'in_dir', group: 'Hướng (IN / TO)', label: 'in the [hướng] (of …)', dirs: DIRS, ref: 'opt', vocab: 'in_dir' },
    { id: 'to_dir', group: 'Hướng (IN / TO)', label: 'to the [hướng] of …  (nằm NGOÀI)', dirs: DIRS, ref: 'req', vocab: 'to_dir' },
    { id: 'in_part', group: 'Hướng (IN / TO)', label: 'in the [hướng] part of …  (PART → IN)', dirs: DIRS, ref: 'req' },
    { id: 'on_side', group: 'Hướng (IN / TO)', label: 'on the [hướng] side of …  (SIDE → ON)', dirs: DIRS, ref: 'req' },
    { id: 'center', group: 'Trung tâm', label: 'in the center of …', ref: 'map', vocab: 'center' },
    { id: 'middle', group: 'Trung tâm', label: 'in the middle of …', ref: 'map', vocab: 'middle' },
    { id: 'central_part', group: 'Trung tâm', label: 'in the central part of …', ref: 'map', vocab: 'central_part' },
    { id: 'next_to', group: 'Liền kề / gần', label: 'next to …', ref: 'req', vocab: 'next_to' },
    { id: 'adjacent_to', group: 'Liền kề / gần', label: 'adjacent to …', ref: 'req', vocab: 'adjacent_to' },
    { id: 'close_to', group: 'Liền kề / gần', label: 'close to …', ref: 'req', vocab: 'close_to' },
    { id: 'near', group: 'Liền kề / gần', label: 'near …', ref: 'req', vocab: 'close_to' },
    { id: 'opposite', group: 'Liền kề / gần', label: 'opposite …', ref: 'req', vocab: 'opposite' },
    { id: 'surrounded_by', group: 'Liền kề / gần', label: 'surrounded by …', ref: 'req', vocab: 'surrounded_by' },
    { id: 'along', group: 'Tuyến (đường, sông)', label: 'along …', ref: 'req', vocab: 'along' },
    { id: 'alongside', group: 'Tuyến (đường, sông)', label: 'alongside …', ref: 'req' },
    { id: 'on_bank', group: 'Tuyến (đường, sông)', label: 'on the bank of …  (ON)', ref: 'req' },
    { id: 'on_edge', group: 'Tuyến (đường, sông)', label: 'on the edge of …  (ON)', ref: 'req' },
    { id: 'outskirts', group: 'Tuyến (đường, sông)', label: 'on the outskirts of …', ref: 'req' },
    { id: 'at_corner', group: 'Giao điểm (AT)', label: 'at the corner of …', ref: 'req', vocab: 'at_corner' },
    { id: 'at_entrance', group: 'Giao điểm (AT)', label: 'at the entrance to …', ref: 'req' },
    { id: 'at_junction', group: 'Giao điểm (AT)', label: 'at the junction of …', ref: 'req' },
    { id: 'lr_side', group: 'Trên bản đồ', label: 'on the left/right side of the map', dirs: ['left', 'right'], ref: 'no', vocab: 'lr_side' },
    { id: 'lr_hand', group: 'Trên bản đồ', label: 'on the left/right-hand side of …', dirs: ['left', 'right'], ref: 'req' },
    { id: 'top_bottom', group: 'Trên bản đồ', label: 'at the top/bottom of the map', dirs: ['top', 'bottom'], ref: 'no', vocab: 'top_bottom' },
    { id: 'corner', group: 'Trên bản đồ', label: 'in the [góc] corner', dirs: CORNERS, ref: 'opt', vocab: 'corner' },
  ];
  const REL = Object.fromEntries(RELATIONS.map(r => [r.id, r]));

  // Nhóm đồng nghĩa để tự đa dạng hóa ("adjacent to" ↔ "next to", "center" ↔ "middle")
  const SYNONYMS = [
    ['next_to', 'adjacent_to', 'close_to', 'near'],
    ['center', 'middle', 'central_part'],
    ['along', 'alongside'],
    ['in_dir', 'in_part'],
  ];

  function cleanNoun(s) {
    return String(s || '').trim().replace(/^(the|a|an)\s+/i, '').replace(/[.]+$/, '');
  }
  function isPlural(noun) {
    const n = cleanNoun(noun).toLowerCase();
    const last = n.split(/\s+/).pop() || '';
    if (/(ss|us|is|ics)$/.test(last)) return false;
    return /s$/.test(last) || /^(people|trees|houses)$/.test(last);
  }
  const UNCOUNTABLE = /\b(farmland|land|woodland|parkland|grassland|wasteland|housing|accommodation|countryside|scrubland|marshland|vegetation|parking)$/i;
  function indef(noun) {
    const n = cleanNoun(noun);
    if (!n) return '';
    if (isPlural(n) || UNCOUNTABLE.test(n)) return n;
    return (/^[aeiou]/i.test(n) && !/^(uni|use|eu|one)/i.test(n) ? 'an ' : 'a ') + n;
  }
  function def(noun) {
    const n = cleanNoun(noun);
    return n ? 'the ' + n : '';
  }
  function refText(ref) {
    const r = String(ref || '').trim();
    if (!r) return '';
    if (/^(the|a|an|this|that|its|their)\s/i.test(r) || /^[A-Z]/.test(r)) return r;
    return 'the ' + r;
  }
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const lowerFirst = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  // chỉ hạ chữ hoa đầu câu khi không phải danh từ riêng
  const lowerStart = s => /^(The|A|An|New|No|There)\b/.test(s) ? lowerFirst(s) : s;
  const stripDot = s => s.replace(/[.]\s*$/, '');

  /* pos = { rel, dir, ref } → cụm vị trí tiếng Anh */
  function posText(pos) {
    if (!pos || !pos.rel) return '';
    const r = REL[pos.rel];
    if (!r) return '';
    const dir = pos.dir || (r.dirs ? r.dirs[0] : '');
    const ref = refText(pos.ref);
    const ofRef = ref ? ' of ' + ref : '';
    switch (pos.rel) {
      case 'in_dir': return 'in the ' + dir + ofRef;
      case 'to_dir': return 'to the ' + dir + (ref ? ' of ' + ref : '');
      case 'in_part': return 'in the ' + DIR_ADJ[dir] + ' part' + (ref ? ' of ' + ref : '');
      case 'on_side': return 'on the ' + DIR_ADJ[dir] + ' side' + (ref ? ' of ' + ref : '');
      case 'center': return 'in the center of ' + (ref || 'the map');
      case 'middle': return 'in the middle of ' + (ref || 'the map');
      case 'central_part': return 'in the central part of ' + (ref || 'the map');
      case 'next_to': return 'next to ' + ref;
      case 'adjacent_to': return 'adjacent to ' + ref;
      case 'close_to': return 'close to ' + ref;
      case 'near': return 'near ' + ref;
      case 'opposite': return 'opposite ' + ref;
      case 'surrounded_by': return 'surrounded by ' + (ref ? lowerFirst(cleanNoun(pos.ref)) : '');
      case 'along': return 'along ' + ref;
      case 'alongside': return 'alongside ' + ref;
      case 'on_bank': return 'on the bank of ' + ref;
      case 'on_edge': return 'on the edge of ' + ref;
      case 'outskirts': return 'on the outskirts of ' + ref;
      case 'at_corner': return 'at the corner of ' + ref;
      case 'at_entrance': return 'at the entrance to ' + ref;
      case 'at_junction': return 'at the junction of ' + ref;
      case 'lr_side': return 'on the ' + dir + ' side of the map';
      case 'lr_hand': return 'on the ' + dir + '-hand side of ' + ref;
      case 'top_bottom': return 'at the ' + dir + ' of the map';
      case 'corner': return 'in the ' + dir + ' corner' + (ref ? ' of ' + ref : '');
    }
    return '';
  }
  // Vị trí đồng nghĩa (để câu thay thế không lặp cùng cụm)
  function posAlternatives(pos) {
    if (!pos || !pos.rel) return [];
    const out = [];
    for (const g of SYNONYMS) {
      if (!g.includes(pos.rel)) continue;
      for (const alt of g) {
        if (alt === pos.rel) continue;
        if (alt === 'in_part' && !pos.ref) continue;
        out.push(posText({ ...pos, rel: alt }));
      }
    }
    return out.filter(Boolean);
  }
  // Vị trí có thể đứng đầu câu kiểu "On the right-hand side of the tree, a house can be seen."
  const frontable = pos => pos && pos.rel && pos.rel !== 'surrounded_by';
  const occupiable = pos => pos && pos.rel && !['surrounded_by', 'opposite', 'along', 'alongside'].includes(pos.rel);

  /* ---------- Thì ---------- */
  // tense: 'past' (2 năm quá khứ), 'perfect' (map 2 = hiện tại), 'future' (bản đồ dự kiến)
  function be(tense, plural) {
    if (tense === 'past') return plural ? 'were' : 'was';
    if (tense === 'perfect') return plural ? 'have been' : 'has been';
    return 'will be';
  }
  function bePresentState(tense, plural) {
    // trạng thái ở Map 2 (vd: "is located")
    if (tense === 'past') return plural ? 'were' : 'was';
    if (tense === 'perfect') return plural ? 'are' : 'is';
    return 'will be';
  }
  function verb(tense, plural, forms) {
    // forms: { past, pp, base, s }
    if (tense === 'past') return forms.past;
    if (tense === 'perfect') return (plural ? 'have ' : 'has ') + forms.pp;
    return 'will ' + forms.base;
  }
  const V = {
    remain: { past: 'remained', pp: 'remained', base: 'remain' },
    see: { past: 'saw', pp: 'seen', base: 'see' },
    undergo: { past: 'underwent', pp: 'undergone', base: 'undergo' },
    experience: { past: 'experienced', pp: 'experienced', base: 'experience' },
    occur: { past: 'occurred', pp: 'occurred', base: 'occur' },
  };

  /* ---------- Phân tích đề ---------- */
  function detectFromPrompt(text) {
    const t = String(text || '');
    const res = {};
    const years = [...t.matchAll(/\b(1[5-9]\d\d|20\d\d)\b/g)].map(m => m[1]);
    if (years.length) {
      res.year1 = years[0];
      if (years.length > 1) res.year2 = years[years.length - 1];
    }
    if (/\b(present|today|now|current(ly)?|nowadays)\b/i.test(t)) { res.year2 = res.year2 && years.length > 1 ? res.year2 : 'present'; }
    if (/\b(plan(ned)?|propos(ed|al)|future|will)\b/i.test(t)) res.tense = 'future';
    else if (res.year2 === 'present') res.tense = 'perfect';
    else if (res.year2) res.tense = 'past';
    const m = t.match(/\b(?:show|shows|illustrate|illustrates|compare|compares|depict|depicts|present|presents)\s+(?:the\s+)?(?:changes?|developments?)?\s*(?:that\s+(?:took|have\s+taken)\s+place\s+)?(?:in|of|to|at)?\s*((?:the\s+)?(?:(?:[a-z]+\s+){0,3}(?:village|town|city|island|campus|park|school|area|island|airport|museum|hospital|library|centre|center|university|college|zoo|harbour|harbor|farm|street|district|seaside|beach|coast|neighbourhood|neighborhood|region|site|building|mall|garden|port)(?:\s+of\s+[A-Z][\w-]*(?:\s+[A-Z][\w-]*)*)?|[A-Z][\w-]*(?:\s+[A-Z][\w-]*)*(?:\s+(?:town|city|village)\s+(?:centre|center)|\s+(?:town|city|village|island|centre|center))?))/);
    if (m) res.place = m[1].replace(/\s+(in|from|between|during)$/i, '').trim();
    return res;
  }

  // "village of Stokeford" → "the village of Stokeford"; "Islip" giữ nguyên
  function placeName(state) {
    let p = String(state.place || '').trim();
    if (!p) return 'the town';
    p = p.replace(/^(a|an)\s+/i, 'the ');
    if (/^the\s/i.test(p)) return 'the ' + p.slice(4);
    if (/^[a-z]/.test(p)) return 'the ' + p;
    return p;
  }

  function timeLabel(state, which) {
    const y = which === 1 ? state.year1 : state.year2;
    if (!y) return which === 1 ? 'the first year' : 'the later year';
    if (y === 'present') return 'the present day';
    return y;
  }

  /* ---------- Introduction ---------- */
  function introSentences(state) {
    const place = placeName(state);
    const y1 = timeLabel(state, 1), y2 = timeLabel(state, 2);
    const t = state.tense;
    const out = [];
    if (t === 'future') {
      out.push({ text: `The maps illustrate the proposed changes to ${place} in ${y2 === 'the later year' ? 'the future' : y2}.`, tags: ['Paraphrase đề'] });
      out.push({ text: `The two maps compare ${place} at present with its planned layout in the future.`, tags: ['Paraphrase đề'] });
      out.push({ text: `The diagrams show how ${place} will change according to the proposed plan.`, tags: ['Paraphrase đề'] });
      return out;
    }
    if (t === 'perfect') {
      out.push({ text: `The maps illustrate the changes that have taken place in ${place} since ${y1}.`, tags: ['Paraphrase đề'] });
      out.push({ text: `The two maps compare ${place} in ${y1} and ${y2}.`, tags: ['Paraphrase đề'] });
      out.push({ text: `The diagrams show how ${place} has developed from ${y1} to ${y2}.`, tags: ['Paraphrase đề'] });
      return out;
    }
    out.push({ text: `The maps illustrate the changes that took place in ${place} between ${y1} and ${y2}.`, tags: ['Paraphrase đề'] });
    out.push({ text: `The two maps compare ${place} in ${y1} and ${y2}.`, tags: ['Paraphrase đề'] });
    out.push({ text: `The diagrams show how ${place} developed from ${y1} to ${y2}.`, tags: ['Paraphrase đề'] });
    return out;
  }

  /* ---------- Danh từ hóa thay đổi (dùng cho Overview) ---------- */
  function changeNoun(c) {
    const X = cleanNoun(c.subject), Y = cleanNoun(c.target);
    switch (c.type) {
      case 'built': case 'added': return Y ? `the construction of ${isPlural(Y) ? 'new ' + Y : 'a new ' + Y}` : '';
      case 'demolished': return X ? `the demolition of ${def(X)}` : '';
      case 'removed': return X ? `the removal of ${def(X)}` : '';
      case 'replaced': return X && Y ? `the replacement of ${def(X)} by ${indef(Y)}` : '';
      case 'converted': case 'transformed': return X && Y ? `the conversion of ${def(X)} into ${indef(Y)}` : '';
      case 'expanded': return X ? `the expansion of ${def(X)}` : '';
      case 'extended': return X ? `the extension of ${def(X)}` : '';
      case 'relocated': return X ? `the relocation of ${def(X)}` : '';
      case 'modernized': return X ? `the modernization of ${def(X)}` : '';
      case 'renovated': return X ? `the renovation of ${def(X)}` : '';
      case 'reduced': return X ? `the reduction in the size of ${def(X)}` : '';
      case 'redeveloped': return X ? `the redevelopment of ${def(X)}` : '';
    }
    return '';
  }
  function joinList(arr) {
    const a = arr.filter(Boolean);
    if (a.length <= 1) return a[0] || '';
    if (a.length === 2) return a[0] + ' and ' + a[1];
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }
  function mainChanges(state) {
    const valid = state.changes.filter(c => c.type && (cleanNoun(c.subject) || cleanNoun(c.target)));
    const starred = valid.filter(c => c.main && c.type !== 'unchanged');
    return starred.length ? starred : valid.filter(c => c.type !== 'unchanged').slice(0, 3);
  }

  /* ---------- Overview ---------- */
  function overviewSentences(state) {
    const place = placeName(state);
    const t = state.tense, y1 = timeLabel(state, 1), y2 = timeLabel(state, 2);
    const period = t === 'future' ? 'under the proposed plan' : t === 'perfect' ? `since ${y1}` : `between ${y1} and ${y2}`;
    const mains = mainChanges(state);
    const nouns = mains.map(changeNoun).filter(Boolean).slice(0, 2);
    const unchanged = state.changes.filter(c => c.type === 'unchanged' && cleanNoun(c.subject));
    const added = state.changes.filter(c => ['built', 'added'].includes(c.type) && cleanNoun(c.target)).map(c => indef(c.target));
    const gone = state.changes.filter(c => ['demolished', 'removed'].includes(c.type) && cleanNoun(c.subject));
    const slots = [];

    const s1 = [];
    s1.push({
      text: `Overall, ${place} ${verb(t, false, V.experience)} significant changes ${period}` + (nouns.length ? `, the most noticeable being ${joinList(nouns)}.` : '.'),
      tags: ['experienced significant changes'],
    });
    s1.push({
      text: `Overall, ${place} ${verb(t, false, V.undergo)} development with new facilities ${period}` + (unchanged.length ? `, while ${def(unchanged[0].subject)} ${verb(t, isPlural(unchanged[0].subject), V.remain)} unchanged.` : '.'),
      tags: ['underwent development', unchanged.length ? 'Contrast' : ''].filter(Boolean),
    });
    if (added.length) {
      s1.push({
        text: `It is clear that ${place} ${verb(t, false, V.see)} the addition of ${joinList(added.slice(0, 2))}` + (gone.length ? `, while ${def(gone[0].subject)} ${be(t, isPlural(gone[0].subject))} ${gone[0].type === 'removed' ? 'removed' : 'demolished'}.` : '.'),
        tags: ['saw the addition of', gone.length ? 'Contrast' : ''].filter(Boolean),
      });
    }
    slots.push({ label: 'Câu 1 · Xu hướng chung + thay đổi nổi bật', variants: s1 });

    if (nouns.length > 2 || unchanged.length || mains.length > 2) {
      const s2 = [];
      if (unchanged.length) {
        s2.push({ text: `However, ${def(unchanged[0].subject)} ${verb(t, isPlural(unchanged[0].subject), V.remain)} unchanged.`, tags: ['remained unchanged'] });
        s2.push({ text: `No significant changes ${verb(t, true, V.occur)} in ${def(unchanged[0].subject)}.`, tags: ['No significant changes occurred in'] });
      }
      const rest = mains.slice(2).map(changeNoun).filter(Boolean);
      if (rest.length) s2.push({ text: `Moreover, ${t === 'past' ? 'there was' : t === 'perfect' ? 'there has been' : 'there will be'} ${joinList(rest)}.`, tags: ['Addition'] });
      if (s2.length) slots.push({ label: 'Câu 2 · (tuỳ chọn) Điểm giữ nguyên / bổ sung', variants: s2 });
    }
    return slots;
  }

  /* ---------- Body 1 ---------- */
  function locateVariants(f, idx, state, isFirst) {
    // Map 1: quá khứ; riêng bản đồ dự kiến thì Map 1 là hiện tại
    const now = state.tense === 'future';
    const pl = plural1(f.name);
    const was = now ? (pl ? 'are' : 'is') : (pl ? 'were' : 'was');
    const can = now ? 'can be seen' : 'could be seen';
    const occ = now ? 'is occupied by' : 'was occupied by';
    const obj = indef(f.name);
    const P = posText(f.pos);
    const y1 = now ? 'At present' : `In ${timeLabel(state, 1)}`;
    const out = [];
    if (!P) {
      out.push({ text: `${isFirst ? `${y1}, there` : 'There'} ${was} ${obj}.`, tags: ['There was/were'] });
      return out;
    }
    const lead = isFirst ? `${y1}, ` : '';
    const add = !isFirst ? 'Moreover, ' : '';
    const variants = [
      { text: `${lead || add}${(lead || add) ? obj : cap(obj)} ${was} located ${P}.`, tags: [isFirst ? 'Time Clause' : 'Addition', 'Passive Voice', 'Cách 1'] },
      { text: `${lead ? lead + 'there' : 'There'} ${was} ${obj} ${P}.`, tags: [lead ? 'Time Clause' : '', 'There was/were'].filter(Boolean) },
    ];
    if (frontable(f.pos)) variants.push({ text: `${cap(P)}, ${obj} ${can}.`, tags: ['Cách 2 (đảo vị trí lên đầu)'] });
    if (occupiable(f.pos)) variants.push({ text: `The area ${P} ${occ} ${obj}.`, tags: ['Cách 3 (occupied by)'] });
    const alts = posAlternatives(f.pos);
    if (alts.length) variants.push({ text: `${cap(obj)} ${was} situated ${alts[0]}.`, tags: ['Đa dạng hóa vị trí'] });
    // xoay vòng để mỗi câu bắt đầu bằng 1 cấu trúc khác nhau → tránh lặp
    const rot = isFirst ? 0 : idx % variants.length;
    return variants.slice(rot).concat(variants.slice(0, rot));
  }
  const plural1 = n => isPlural(n) && !UNCOUNTABLE.test(cleanNoun(n));

  function body1Sentences(state) {
    const feats = state.features.filter(f => cleanNoun(f.name));
    const now = state.tense === 'future';
    const be1 = n => now ? (plural1(n) ? 'are' : 'is') : (plural1(n) ? 'were' : 'was');
    const slots = [];
    feats.forEach((f, i) => {
      slots.push({ label: `Câu ${i + 1} · ${cleanNoun(f.name)}`, variants: locateVariants(f, i, state, i === 0) });
    });
    // Câu ghép tương phản cho 2 công trình ở 2 phía
    for (let i = 0; i + 1 < feats.length; i += 2) {
      const a = feats[i], b = feats[i + 1];
      const Pa = posText(a.pos), Pb = posText(b.pos);
      if (!Pa || !Pb) continue;
      slots.push({
        label: `Câu ghép (tuỳ chọn) · ${cleanNoun(a.name)} + ${cleanNoun(b.name)}`,
        variants: [
          { text: `${cap(indef(a.name))} ${be1(a.name)} located ${Pa}, while ${indef(b.name)} ${be1(b.name)} ${Pb}.`, tags: ['Contrast'] },
        ],
        optional: true,
      });
    }
    return slots;
  }

  /* ---------- Body 2 ---------- */
  function findFeature(state, name) {
    const n = cleanNoun(name).toLowerCase();
    return state.features.find(f => cleanNoun(f.name).toLowerCase() === n);
  }

  function changeVariants(c, state, idx) {
    const t = state.tense;
    const X = cleanNoun(c.subject), Y = cleanNoun(c.target);
    const plX = isPlural(X), plY = isPlural(Y);
    const P = posText(c.pos);
    const sp = P ? ' ' + P : '';
    const place = placeName(state);
    const out = [];
    const theX = cap(def(X));
    const oldF = X ? findFeature(state, X) : null;
    const oldP = oldF ? posText(oldF.pos) : '';
    switch (c.type) {
      case 'built':
        if (!Y) break;
        out.push({ text: `${cap(isPlural(Y) ? 'new ' + Y : 'a new ' + Y)} ${be(t, plY)} built${sp}.`, tags: ['was built', 'Passive Voice'] });
        out.push({ text: `${cap(indef(Y))} ${be(t, plY)} constructed${sp}.`, tags: ['was constructed'] });
        out.push({ text: `${cap(place)} ${verb(t, false, V.see)} the addition of ${indef(Y)}${sp}.`, tags: ['saw the addition of'] });
        if (P && frontable(c.pos)) out.push({ text: `${cap(P)}, ${isPlural(Y) ? 'new ' + Y : 'a new ' + Y} ${be(t, plY)} constructed.`, tags: ['Đảo vị trí lên đầu'] });
        break;
      case 'added':
        if (!Y) break;
        out.push({ text: `${cap(indef(Y))} ${be(t, plY)} added${sp}.`, tags: ['was added'] });
        out.push({ text: `${cap(place)} ${verb(t, false, V.see)} the addition of ${indef(Y)}${sp}.`, tags: ['saw the addition of'] });
        break;
      case 'demolished':
      case 'removed': {
        if (!X) break;
        const v1 = c.type === 'demolished' ? 'demolished' : 'removed';
        const v2 = v1 === 'demolished' ? 'removed' : 'demolished';
        const where = oldP ? ' ' + oldP : sp;
        out.push({ text: `${theX}${where} ${be(t, plX)} ${v1}.`, tags: ['was ' + v1] });
        if (Y) out.push({ text: `${theX} ${be(t, plX)} demolished to make way for ${indef(Y)}.`, tags: ['was demolished to make way for'] });
        out.push({ text: `${theX} ${be(t, plX)} ${v2}.`, tags: ['was ' + v2, 'Đa dạng hóa'] });
        break;
      }
      case 'replaced':
        if (!X || !Y) break;
        out.push({ text: `${theX}${oldP ? ' ' + oldP : ''} ${be(t, plX)} replaced by ${indef(Y)}.`, tags: ['was replaced by'] });
        out.push({ text: `${theX} ${be(t, plX)} demolished to make way for ${indef(Y)}.`, tags: ['was demolished to make way for'] });
        out.push({ text: `${theX} ${be(t, plX)} removed, and ${indef(Y)} ${be(t, plY)} built in its place.`, tags: ['was removed', 'was built'] });
        break;
      case 'converted':
      case 'transformed': {
        if (!X || !Y) break;
        const a = c.type === 'converted' ? 'converted' : 'transformed', b = a === 'converted' ? 'transformed' : 'converted';
        out.push({ text: `${theX}${oldP ? ' ' + oldP : ''} ${be(t, plX)} ${a} into ${indef(Y)}.`, tags: ['was ' + a + ' into'] });
        out.push({ text: `${theX} ${be(t, plX)} ${b} into ${indef(Y)}.`, tags: ['was ' + b + ' into', 'Đa dạng hóa'] });
        break;
      }
      case 'expanded':
        if (!X) break;
        out.push({ text: `${theX} ${be(t, plX)} expanded${sp}.`, tags: ['was expanded'] });
        out.push({ text: `${theX} ${be(t, plX)} expanded significantly${sp}.`, tags: ['was expanded'] });
        break;
      case 'extended':
        if (!X) break;
        out.push({ text: `${theX} ${be(t, plX)} extended${sp}.`, tags: ['was extended'] });
        if (oldP) out.push({ text: `${theX}, which ${plX ? 'were' : 'was'} originally ${oldP}, ${be(t, plX)} extended${sp}.`, tags: ['was extended'] });
        break;
      case 'relocated':
        if (!X) break;
        out.push({ text: `${theX} ${be(t, plX)} relocated${sp}.`, tags: ['was relocated'] });
        if (oldP) out.push({ text: `${theX}, which used to be ${oldP}, ${be(t, plX)} relocated${sp}.`, tags: ['was relocated'] });
        if (P) out.push({ text: `${theX} ${be(t, plX)} relocated, and ${plX ? 'they' : 'it'} ${bePresentState(t, plX)}${t === 'past' ? '' : ' now'} located ${P}.`, tags: ['was relocated'] });
        break;
      case 'modernized':
      case 'renovated': {
        if (!X) break;
        const a = c.type, b = a === 'modernized' ? 'renovated' : 'modernized';
        out.push({ text: `${theX}${sp} ${be(t, plX)} ${a}.`, tags: ['was ' + a] });
        out.push({ text: `${theX} ${be(t, plX)} ${b}.`, tags: ['was ' + b, 'Đa dạng hóa'] });
        break;
      }
      case 'reduced':
        if (!X) break;
        out.push({ text: `${theX} ${be(t, plX)} reduced in size.`, tags: ['was reduced'] });
        if (Y) out.push({ text: `${theX} ${be(t, plX)} reduced in size to make way for ${indef(Y)}.`, tags: ['was reduced'] });
        break;
      case 'redeveloped':
        if (!X) break;
        out.push({ text: `${theX}${sp} ${be(t, plX)} redeveloped.`, tags: ['was redeveloped'] });
        out.push({ text: `${theX} ${verb(t, plX, V.undergo)} development with new facilities.`, tags: ['underwent development'] });
        break;
      case 'unchanged':
        if (!X) break;
        out.push({ text: `${theX}${oldP ? ' ' + oldP : ''} ${verb(t, plX, V.remain)} unchanged.`, tags: ['remained unchanged'] });
        out.push({ text: `No significant changes ${verb(t, true, V.occur)} in ${def(X)}.`, tags: ['No significant changes occurred in'] });
        break;
    }
    // câu thứ 2 trở đi: thêm biến thể "Moreover," (Addition)
    if (idx > 0 && out.length) {
      out.push({ text: 'Moreover, ' + lowerStart(out[0].text), tags: ['Addition'].concat(out[0].tags) });
    }
    return out;
  }

  function body2Sentences(state) {
    const place = placeName(state);
    const t = state.tense, y2 = timeLabel(state, 2);
    const slots = [];
    const open = [];
    if (t === 'past') {
      open.push({ text: `By ${y2}, ${place} had experienced significant changes.`, tags: ['Time Clause', 'experienced significant changes'] });
      open.push({ text: `In ${y2}, ${place} underwent development with new facilities.`, tags: ['Time Clause', 'underwent development'] });
    } else if (t === 'perfect') {
      open.push({ text: `Since then, ${place} has experienced significant changes.`, tags: ['experienced significant changes'] });
      open.push({ text: `Over the period, ${place} has undergone development with new facilities.`, tags: ['underwent development'] });
    } else {
      open.push({ text: `Under the proposed plan, ${place} will experience significant changes.`, tags: ['experienced significant changes'] });
      open.push({ text: `According to the plan, ${place} will undergo development with new facilities.`, tags: ['underwent development'] });
    }
    slots.push({ label: 'Câu mở đoạn · Chuyển sang Map 2', variants: open });

    // thay đổi chính trước, rồi mới đến thay đổi phụ, "remained unchanged" cuối cùng
    const valid = state.changes.filter(c => c.type && (cleanNoun(c.subject) || cleanNoun(c.target)));
    const order = c => (c.type === 'unchanged' ? 2 : c.main ? 0 : 1);
    const sorted = valid.slice().sort((a, b) => order(a) - order(b));
    sorted.forEach((c, i) => {
      const v = changeVariants(c, state, i);
      if (!v.length) return;
      const nm = cleanNoun(c.subject) || cleanNoun(c.target);
      const tl = (TYPE_LABEL[c.type] || c.type);
      slots.push({ label: `Câu ${i + 2} · ${nm} — ${tl}${c.main ? ' ⭐' : ''}`, variants: v });
    });

    // Câu ghép Contrast: thay đổi + giữ nguyên
    const un = valid.find(c => c.type === 'unchanged');
    const ch = valid.find(c => c.type !== 'unchanged');
    if (un && ch) {
      const first = changeVariants(ch, state, 0)[0];
      if (first) {
        slots.push({
          label: 'Câu kết (tuỳ chọn) · Contrast',
          variants: [{ text: `${stripDot(first.text)}, while ${def(un.subject)} ${verb(t, isPlural(un.subject), V.remain)} unchanged.`, tags: ['Contrast', 'remained unchanged'] }],
          optional: true,
        });
      }
    }
    return slots;
  }

  const CHANGE_TYPES = [
    { id: 'built', label: 'Xây mới — was built / constructed', need: 'Y', pos: true },
    { id: 'added', label: 'Thêm (nhỏ) — was added', need: 'Y', pos: true },
    { id: 'demolished', label: 'Phá bỏ — was demolished', need: 'X', pos: true, optY: true },
    { id: 'removed', label: 'Xóa bỏ hoàn toàn — was removed', need: 'X', pos: true },
    { id: 'replaced', label: 'Thay thế — was replaced by', need: 'XY', pos: false },
    { id: 'converted', label: 'Đổi chức năng — was converted into', need: 'XY', pos: false },
    { id: 'transformed', label: 'Biến đổi lớn — was transformed into', need: 'XY', pos: false },
    { id: 'expanded', label: 'Mở rộng — was expanded', need: 'X', pos: true },
    { id: 'extended', label: 'Kéo dài (đường, cầu) — was extended', need: 'X', pos: true },
    { id: 'relocated', label: 'Di dời — was relocated', need: 'X', pos: true },
    { id: 'modernized', label: 'Hiện đại hóa — was modernized', need: 'X', pos: false },
    { id: 'renovated', label: 'Cải tạo — was renovated', need: 'X', pos: false },
    { id: 'reduced', label: 'Thu nhỏ — was reduced', need: 'X', pos: false, optY: true },
    { id: 'redeveloped', label: 'Tái phát triển khu vực — was redeveloped', need: 'X', pos: true },
    { id: 'unchanged', label: 'Giữ nguyên — remained unchanged', need: 'X', pos: false },
  ];
  const TYPE_LABEL = Object.fromEntries(CHANGE_TYPES.map(c => [c.id, c.label.split(' — ')[0]]));

  /* ---------- Kiểm tra bài ---------- */
  const SYN_HINT = {
    'was built': 'was constructed', 'were built': 'were constructed', 'next to': 'adjacent to', 'was demolished': 'was removed',
    'were demolished': 'were removed', 'converted into': 'transformed into', 'in the center of': 'in the middle of / in the central part of',
    'was added': 'saw the addition of', 'located': 'situated / could be seen / occupied by',
  };
  function check(essay, state) {
    const text = String(essay || '');
    const words = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
    const issues = [];
    if (words < 150) issues.push({ level: 'warn', msg: `Bài mới có ${words} từ — Task 1 cần tối thiểu 150 từ.` });
    else issues.push({ level: 'ok', msg: `Độ dài: ${words} từ (≥ 150).` });
    if (!/\b(overall|it is clear|in general)\b/i.test(text)) issues.push({ level: 'warn', msg: 'Chưa thấy Overview (bắt đầu bằng “Overall, …”).' });
    const patterns = [
      { re: /\b(in|at)\s+the\s+(?:[\w-]+\s+)?(?:side|bank|edge|left-hand side|right-hand side)\b/gi, msg: 'Quy tắc “Side/Bank/Edge” → dùng ON', fix: m => m.replace(/^(in|at)/i, 'on') },
      { re: /\b(on|at)\s+the\s+(?:[\w-]+\s+)?part\b/gi, msg: 'Quy tắc “Part” → dùng IN', fix: m => m.replace(/^(on|at)/i, 'in') },
      { re: /\b(on|at)\s+the\s+(?:center|centre|middle)\b/gi, msg: 'Nhóm IN: Center, Middle, Corner, Part, Area', fix: m => m.replace(/^(on|at)/i, 'in') },
      { re: /\b(in|on)\s+the\s+(?:top|bottom|entrance|intersection|junction)\b(?!-)/gi, msg: 'Nhóm AT: Top, Bottom, Entrance, Intersection, Junction', fix: m => m.replace(/^(in|on)/i, 'at') },
      { re: /\bto\s+the\s+(?:north|south|east|west)(?:-(?:east|west))?\s+(?:part|side|area)\b/gi, msg: 'Part/Side/Area không đi với TO', fix: m => m },
    ];
    for (const p of patterns) {
      const found = text.match(p.re);
      if (found) [...new Set(found)].forEach(f => issues.push({ level: 'err', msg: `${p.msg}: “${f}” → “${p.fix(f)}”` }));
    }
    // Lặp từ
    const lower = text.toLowerCase();
    for (const k of Object.keys(SYN_HINT)) {
      const n = lower.split(k).length - 1;
      if (n >= 3) issues.push({ level: 'warn', msg: `“${k}” lặp ${n} lần → thay bớt bằng “${SYN_HINT[k]}” (Đa dạng hóa).` });
    }
    // Thì
    if (state.tense === 'past' && /\b(has|have) been\b/i.test(text)) issues.push({ level: 'warn', msg: 'Đề dùng 2 năm trong quá khứ → nên dùng quá khứ đơn (was built), tránh “has been”.' });
    if (state.tense === 'perfect' && !/\b(has|have) been\b/i.test(text)) issues.push({ level: 'info', msg: 'Map 2 là hiện tại → thay đổi nên dùng hiện tại hoàn thành (has been built / has been replaced by).' });
    if (state.tense === 'future' && !/\bwill\b/i.test(text)) issues.push({ level: 'warn', msg: 'Bản đồ dự kiến → dùng “will be built / will be replaced by”.' });
    // Số thay đổi chính
    const mains = state.changes.filter(c => c.main).length;
    if (mains > 4) issues.push({ level: 'info', msg: `Bạn đánh dấu ${mains} thay đổi chính — mẹo: chỉ chọn 3-4 thay đổi chính.` });
    // Đa dạng cấu trúc
    const used = [];
    if (/\bthere (was|were|is|are|has been|will be)\b/i.test(text)) used.push('There was/were');
    if (/\bwhile\b/i.test(text)) used.push('Contrast');
    if (/\bmoreover\b/i.test(text)) used.push('Addition');
    if (/\bin (1[5-9]\d\d|20\d\d),/i.test(text)) used.push('Time Clause');
    if (/\b(was|were|been|be) [a-z]+ed\b/i.test(text)) used.push('Passive Voice');
    const missing = ['Passive Voice', 'There was/were', 'Time Clause', 'Contrast', 'Addition'].filter(s => !used.includes(s));
    if (missing.length && words > 40) issues.push({ level: 'info', msg: 'Chưa dùng cấu trúc: ' + missing.join(', ') + '.' });
    return { words, issues, used };
  }

  /* Tô đậm các cụm từ vựng trong dàn ý */
  function highlightTerms() {
    const terms = [];
    for (const v of CONTENT.changeVocab) {
      terms.push(v.phrase);
      terms.push(v.phrase.replace(/^was /, 'were '), v.phrase.replace(/^was /, 'has been '), v.phrase.replace(/^was /, 'have been '), v.phrase.replace(/^was /, 'will be '));
    }
    terms.push('has undergone development', 'will undergo development', 'has experienced significant changes', 'had experienced significant changes', 'will experience significant changes',
      'has seen the addition of', 'will see the addition of', 'has remained unchanged', 'will remain unchanged', 'remained unchanged',
      'demolished to make way for', 'No significant changes', 'could be seen', 'was occupied by', 'located', 'situated', 'Moreover', 'while', 'There was', 'There were', 'there was', 'there were');
    for (const r of RELATIONS) {
      const base = r.label.replace(/\s*\(.*$/, '').replace(/[…]/g, '').replace(/\[.*?\]/g, '').trim();
      if (base.length > 3) terms.push(base);
    }
    terms.push('to the north', 'to the south', 'to the east', 'to the west', 'in the north', 'in the south', 'in the east', 'in the west', 'on the outskirts of', 'alongside');
    return [...new Set(terms.filter(Boolean))].sort((a, b) => b.length - a.length);
  }

  return {
    RELATIONS, REL, DIRS, CHANGE_TYPES, posText, cleanNoun, isPlural, detectFromPrompt,
    introSentences, overviewSentences, body1Sentences, body2Sentences, check, highlightTerms,
  };
})();
