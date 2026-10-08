/* 🧩 Cấu trúc câu đã dùng trong bài — để học sinh ôn lại sau khi viết xong.
 * CATALOG: tên, công thức, cách dùng (5 cấu trúc trùng tên với bảng cấu trúc câu của Ms. Gigi).
 * detect(): nhận diện nhanh bằng mẫu câu ngay trong trình duyệt; AI (ai.js → analyzeStructures)
 * phân tích kỹ hơn và thêm bài luyện tập. */
window.STRUCTS = (function () {
  const AUX = 'is|are|was|were|be|been|being';
  const IRREG = 'built|made|done|shown|given|taken|grown|cut|put|kept|left|known|seen|found|held|brought|sold|spent|driven|chosen|drawn|thrown|worn|run|set|laid|fed|dug|frozen|broken|written|eaten|split|spread|sent|bought|paid|lost|won|hung|ground|shut';
  const PART = `(?:[a-z]+ed|${IRREG})`;
  const PREP = 'in|on|at|by|to|next|near|along|between|from|for|over|across|around|into|beside|opposite|behind|alongside|close|through|towards|throughout';
  // từ đứng trước KHÔNG phải danh từ → không phải mệnh đề quan hệ rút gọn
  const NOT_NOUN = 'is|are|was|were|be|been|being|has|have|had|which|that|who|it|they|he|she|and|or|but|also|then|not|later|subsequently|newly|recently|still|already|further|largely|mainly|partly|completely|entirely|gradually|significantly|eventually|finally|once|when|while|after|before';

  const CATALOG = [
    { id: 'reduced_rel', name_vi: 'Mệnh đề quan hệ rút gọn', name_en: 'Reduced relative clause',
      formula: 'N + V3/ed (bị động) · N + V-ing (chủ động)  =  N + which/who + be + V3 · N + which/who + V',
      use_vi: 'Bỏ “which/who + to be” để câu gọn và học thuật hơn: “a school (which was) located in the centre”, “people (who were) using buses”.',
      re: [new RegExp(`\\b(?!(?:${NOT_NOUN})\\b)(?![a-z]+ly\\b)[a-z]+\\s+(?:located|situated|positioned|placed|built|constructed|surrounded|used|made|known|called|connected|linked|designed|shown|given|found|represented|produced|consumed|owned|lying|running|leading|stretching|extending|connecting|bordered|lined|occupied)\\s+(?:${PREP})\\b`, 'i'),
        /\b(?:people|commuters|students|residents|households|those|users|workers|visitors|tourists|passengers|men|women|children|adults|employees|consumers)\s+(?!were\b|was\b)[a-z]+ing\b/i] },
    { id: 'participle', name_vi: 'Cụm V-ing sau dấu phẩy (rút gọn mệnh đề)', name_en: 'Participle clause',
      formula: 'Mệnh đề chính, V-ing + O  (= …, and it + V / which + V)',
      use_vi: 'Nối thêm kết quả hoặc số liệu vào cuối câu mà không cần “and/which”: “…, reaching a peak of 40% in 2020”.', extend: true,
      re: [/,\s+(?!which\b|while\b|whereas\b|with\b|and\b|but\b|respectively\b|during\b|according\b|including\b|following\b|accounting\b)[a-z]+ing\b/i, /,\s+followed by\b/i, /,\s+accounting for\b/i] },
    { id: 'adv_reduced', name_vi: 'Rút gọn mệnh đề trạng ngữ', name_en: 'Reduced adverbial clause',
      formula: 'before / after / when + V-ing   ·   before being + V3 (bị động)',
      use_vi: 'Hai hành động cùng chủ ngữ: bỏ chủ ngữ ở vế sau, động từ chuyển thành V-ing — hay dùng trong Process và Line graph.',
      re: [/\b(?:before|after|when|while|once)\s+(?:being\s+)?[a-z]+(?:ing|ed)\b/i] },
    { id: 'relative', name_vi: 'Mệnh đề quan hệ', name_en: 'Relative clause',
      formula: 'N, which / who / where + V …',
      use_vi: 'Thêm thông tin cho danh từ ngay trong câu, tránh viết thêm một câu ngắn: “…a residential area, which was located on both sides of a new road”.', extend: true,
      re: [/\b(?:which|who|whose|where)\b/i] },
    { id: 'passive', name_vi: 'Câu bị động', name_en: 'Passive Voice',
      formula: 'S + was/were + V3   (Process: S + is/are + V3)',
      use_vi: 'Khi vật/công trình chịu tác động, không cần nói ai làm: Maps — was built, was converted into; Process — is heated, are packed.',
      re: [new RegExp(`\\b(?:${AUX})\\s+(?:[a-z]+ly\\s+)?${PART}\\b`, 'i')] },
    { id: 'pres_perfect', name_vi: 'Thì hiện tại hoàn thành', name_en: 'Present perfect',
      formula: 'S + has/have (+ been) + V3',
      use_vi: 'Thay đổi kéo dài tới hiện tại (bản đồ “now / present”): “A car park has been built”.',
      re: [/\b(?:has|have)\s+(?:[a-z]+ly\s+)?(?:been\s+)?(?:[a-z]+ed|built|made|grown|risen|fallen|seen|become|shown)\b/i] },
    { id: 'contrast', name_vi: 'Câu đối lập', name_en: 'Contrast',
      formula: 'S + V…, while / whereas S + V…   ·   In contrast, / However, S + V',
      use_vi: 'Đặt hai đối tượng hoặc hai xu hướng ngược nhau trong cùng một câu để so sánh.', extend: true,
      re: [/\b(?:while|whereas)\b(?!\s+[a-z]+ing\b)/i, /\b(?:In contrast|By contrast|Conversely|On the other hand|However)\b/] },
    { id: 'with_np', name_vi: 'Cụm “with + danh từ”', name_en: 'With + noun phrase',
      formula: 'Mệnh đề, with + N (+ V-ing / số liệu)',
      use_vi: 'Gắn thêm chi tiết hoặc số liệu vào câu: “…, with the addition of new housing”, “…, with cars accounting for 60%”.', extend: true,
      re: [/,\s*with\s+(?:the|a|an|[a-z]+)\b/i, /\bwith the (?:addition|construction|removal|exception|introduction|conversion|demolition|expansion|redevelopment)\b/i] },
    { id: 'comparison', name_vi: 'So sánh hơn / so sánh nhất', name_en: 'Comparatives & superlatives',
      formula: 'the highest / the largest + N  ·  adj-er / more … than  ·  twice as … as  ·  compared with',
      use_vi: 'Task 1 luôn cần so sánh: chỉ ra cao nhất, thấp nhất, gấp bao nhiêu lần.',
      re: [/\bthe\s+(?:highest|lowest|largest|smallest|biggest|greatest|most|least)\b/i, /\b[a-z]+er\s+than\b/i, /\b(?:more|less|fewer)\s+(?:[a-z]+\s+)?than\b/i, /\b(?:twice|three times|four times|half)\s+(?:as|the)\b/i, /\b(?:compared (?:with|to)|in comparison (?:with|to))\b/i] },
    { id: 'nominal', name_vi: 'Danh từ hoá', name_en: 'Nominalisation',
      formula: 'a + adj + increase/decrease in + N  ·  underwent / experienced + N  ·  the addition / construction of + N',
      use_vi: 'Biến động từ thành cụm danh từ cho câu trang trọng, đa dạng hơn: “a sharp increase in…”, “underwent significant development”.',
      re: [/\b(?:a|an)\s+(?:[a-z]+\s+)?(?:increase|decrease|rise|fall|drop|decline|growth|reduction|surge|dip|fluctuation)\s+(?:in|of)\b/i, /\b(?:underwent|undergone|experienced|saw|witnessed)\s+(?:[a-z]+\s+)?(?:development|changes?|transformation|growth|increase|decrease|decline|rise|fall|expansion)\b/i, /\bthe (?:addition|construction|removal|redevelopment|conversion|demolition|expansion|introduction) of\b/i] },
    { id: 'trend', name_vi: 'Động từ xu hướng + trạng từ', name_en: 'Trend verbs & adverbs',
      formula: 'S + rose / fell / increased + adv (sharply, steadily) + from X to Y / by X',
      use_vi: 'Tả xu hướng có mức độ và số liệu đi kèm (from … to …, by …).',
      re: [/\b(?:rose|fell|increased|decreased|declined|dropped|grew|climbed|plummeted|surged|soared|dipped|plunged|recovered|peaked|fluctuated|levell?ed off|stabili[sz]ed)\b(?:\s+[a-z]+ly)?(?:\s+(?:from|to|by)\s+(?:about\s+|around\s+|approximately\s+|just\s+)?[\d.,]*\d%?)?/i] },
    { id: 'account', name_vi: 'Account for / make up (chỉ dùng với %)', name_en: 'Proportion verbs',
      formula: 'S + accounted for / made up / constituted + %',
      use_vi: 'Nói về tỷ lệ phần trăm của tổng (100%). Không dùng với số tuyệt đối.',
      re: [/\b(?:accounted|accounts?|accounting)\s+for\b/i, /\b(?:made|makes?|making)\s+up\b/i, /\bconstitut(?:ed|es?|ing)\b/i] },
    { id: 'respectively', name_vi: '“Respectively” — lần lượt là', name_en: 'Respectively',
      formula: 'A and B + V + X and Y, respectively',
      use_vi: 'Gộp số liệu của hai đối tượng vào một câu, thứ tự số khớp thứ tự đối tượng.',
      re: [/\brespectively\b/i] },
    { id: 'former_latter', name_vi: 'The former / the latter', name_en: 'Referencing',
      formula: 'the former (cái trước) / the latter (cái sau)',
      use_vi: 'Thay cho việc lặp lại danh từ vừa nhắc — tăng điểm Coherence.',
      re: [/\bthe\s+(?:former|latter)\b/i] },
    { id: 'there_be', name_vi: 'There was / were', name_en: 'There was/were',
      formula: 'There + was/were + N',
      use_vi: 'Giới thiệu sự tồn tại của công trình / số liệu.',
      re: [/\b[Tt]here\s+(?:is|are|was|were|has been|have been|had been)\b/] },
    { id: 'result', name_vi: 'Câu kết quả', name_en: 'Cause & result',
      formula: 'S + resulted in / led to + N',
      use_vi: 'Tóm lại hệ quả của các thay đổi (thường là câu cuối Body 2 dạng Maps).',
      re: [/\b(?:resulted in|resulting in|led to|leading to)\b/i] },
    { id: 'time', name_vi: 'Trạng ngữ thời gian đầu câu', name_en: 'Time Clause',
      formula: 'In + [Year], S + V   ·   By + [Year], S + V',
      use_vi: 'Mở câu bằng mốc thời gian để người đọc biết đang nói về năm nào. “By 2010” = tính đến năm 2010.',
      start: /^(?:In|By|Between|From|Over|During|After|Before|Throughout|Since)\s+(?:the\s+)?(?:\d{4}|[a-z]+\s+(?:period|decade|years|century))[^,]*,?/ },
    { id: 'addition', name_vi: 'Từ nối thêm ý / thứ tự', name_en: 'Addition',
      formula: 'Moreover, / Additionally, / In addition, S + V   ·   First, / Next, / Finally,',
      use_vi: 'Nối ý giữa các câu cho mạch lạc; Process dùng từ chỉ thứ tự.',
      start: /^(?:Additionally|Moreover|In addition|Furthermore|Firstly|First|Next|Then|After that|Subsequently|Finally|Meanwhile|Similarly|Likewise|Following this|At the next stage)\b,?/ },
  ];
  const BY_ID = Object.fromEntries(CATALOG.map(c => [c.id, c]));

  // sentences: [{ p, n, text }] → [{ id, examples: [{ p, n, text, part }] }] theo thứ tự trong CATALOG
  function detect(sentences, maxEx = 3) {
    const out = [];
    for (const c of CATALOG) {
      const ex = [];
      for (const s of sentences) {
        let m = null;
        if (c.start) m = s.text.match(c.start);
        else for (const re of c.re) { m = s.text.match(re); if (m) break; }
        if (!m || m[0].trim().length < 2) continue;
        let part = m[0];
        // mệnh đề (which…, while…, with…, , V-ing…) → tô cả cụm tới dấu câu kế tiếp (tối đa 12 từ)
        if (c.extend) {
          part = s.text.slice(m.index).replace(/^[,\s]+/, '').match(/^[^,.;:]*/)[0].split(/\s+/).slice(0, 12).join(' ');
          while (/\s(?:and|or|the|a|an|of|to|in|on|at|for|with|by)$/i.test(part)) part = part.replace(/\s+\S+$/, '');
        }
        part = part.replace(/^[,\s]+|[,\s]+$/g, '');
        if (part && s.text.includes(part)) ex.push({ p: s.p, n: s.n, text: s.text, part });
        if (ex.length >= maxEx) break;
      }
      if (ex.length) out.push({ id: c.id, examples: ex });
    }
    return out;
  }
  return { CATALOG, BY_ID, detect };
})();
