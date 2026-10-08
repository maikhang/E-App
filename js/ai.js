/* AI đọc đề & tạo gợi ý bám sát đề cho IELTS Writing Task 1.
 *  - Mở trong claude.ai: dùng Claude của người xem (capability `sample`), không cần API key.
 *  - Mở file riêng: cần Anthropic API key (lưu trong trình duyệt). */
window.AI = (function () {
  const C = window.CONTENT;
  const MODEL = 'claude-opus-5-5';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm';

  const TYPE_HINT = {
    maps: 'MAPS (two or more maps / plans of a place).',
    process: 'PROCESS (natural or manufacturing process, life cycle, diagram of how something works).',
    charts: 'CHARTS & TABLES (line graph, bar chart, pie chart, table, or a mix of them).',
    auto: 'Unknown — detect the type yourself.',
  };
  const BAND = {
    '6.0': 'Band 6.0: clear, accurate sentences; common academic vocabulary; some complex sentences.',
    '7.0': 'Band 7.0+: varied complex structures, precise collocations, accurate data, natural academic style.',
    '8.0': 'Band 8.0+: sophisticated yet natural; precise, concise, flexible grammar, nominalisation, no memorised phrases.',
  };

  const G = window.GIGI;
  // Dạng đề người dùng chọn → các dàn ý Ms. Gigi có thể áp dụng
  const OUTLINE_CANDIDATES = {
    maps: ['maps', 'floorplan'],
    process: ['process_man', 'process_nat'],
    charts: ['trend', 'compare'],
    auto: ['trend', 'compare', 'maps', 'floorplan', 'process_man', 'process_nat'],
  };

  // Từ vựng Maps trong dàn ý (bảng A/B) — bắt buộc khi đề là bản đồ
  function mapsVocab() {
    return `MAPS VOCABULARY (teacher's tables — use these, vary synonyms):
- Change: ${C.changeVocab.map(v => v.phrase).join(', ')}; ${C.writingStructures.map(g => g.items.join(', ')).join('; ')}.
- Position: ${C.positionVocab.map(v => v.phrase).join(', ')}; is located in, is situated in, lies in, stands next to, can be found in, is positioned between, sits along, lies to the north of, in close proximity to, on the outskirts of, extends across, at the far end of the map.`;
  }
  function outlineNotes(ids) {
    const structures = C.sentenceStructures.map(s => `${s.name} (${s.formula})`).join('; ');
    return `THE TEACHER'S OUTLINE (Ms. Gigi) — EVERY paragraph MUST follow it:
${G.generalBlock()}
Basic sentence structures: ${structures}.

${G.promptBlock(ids)}
${ids.some(i => i === 'maps' || i === 'floorplan') ? '\n' + mapsVocab() : ''}`;
  }

  const SHAPE = `{
  "task_type": "maps" | "process" | "line" | "bar" | "pie" | "table" | "mixed",
  "outline": "trend" | "compare" | "maps" | "floorplan" | "process_man" | "process_nat",   // which Ms. Gigi outline you followed
  "subject": "the exact subject in English, e.g. 'water consumption in the USA and China'",
  "topic_vi": "one Vietnamese sentence: what the task shows",
  "prompt_text": "the task question exactly as written if visible, else ''",
  "steps": [  // exactly 4 items in this order: Introduction, Overview, Body 1, Body 2
    {
      "title": "Vietnamese title of what this paragraph does for THIS task",
      "guide_vi": "Vietnamese guidance (2-4 sentences): which Ms. Gigi frame to use, which data to pick and in what order, traps",
      "vocab": [ { "phrase": "English phrase", "meaning_vi": "nghĩa tiếng Việt" } ],   // 5-8 items for THIS task and paragraph
      "sentences": [   // the paragraph as a SENTENCE PLAN: one slot per sentence, in order
        { "f": [1],                       // frame number(s) of THIS paragraph that the sentence uses; several numbers when the frames are alternatives (e.g. Introduction K1/K2)
          "status": "fit" | "replaced",   // "replaced" = the teacher's frame does not suit this task, so a better sentence pattern is used instead
          "why_vi": "",                   // when replaced: WHY her frame does not fit this task (Vietnamese, 1 sentence)
          "alt_frame": "",                // when replaced: the pattern actually used, with [brackets] like her frames
          "focus_vi": "what this sentence says, e.g. 'Số liệu năm 2000 của 3 phương tiện'",
          "options": [ { "f": 1, "text": "one sentence" }, { "f": 1, "text": "..." }, { "f": 2, "text": "..." } ]   // exactly 3 options for THIS ONE sentence
        }
      ],
      "skipped": [ { "f": 3, "why_vi": "why this frame of the paragraph is not used for this task" } ]   // frames not used at all (e.g. "(2 biểu đồ)" frames for a single chart)
    }
  ],
  "paraphrase": [   // 8-14 entries: the key words of THIS prompt and how to paraphrase them, for students to learn
    { "word": "commuters", "meaning_vi": "người đi làm hằng ngày",
      "alternatives": [ { "phrase": "people travelling to work", "meaning_vi": "người di chuyển đi làm" }, { "phrase": "car users", "meaning_vi": "người dùng ô tô", "note_vi": "chỉ dùng khi nói riêng nhóm đi ô tô" } ] }
  ]
}`;

  const RULES = `You are an IELTS Writing Task 1 examiner helping a Vietnamese teacher, Ms. Gigi, whose students must write EXACTLY in her outline.
1. First decide which of her outlines fits the task (see "Use when"), then write all 4 paragraphs with that outline.
   Students build each paragraph ONE SENTENCE AT A TIME, so give each paragraph as a sentence plan ("sentences"): one slot per sentence, in her frames' order.
   - Each slot has exactly 3 options for that ONE sentence (never a whole paragraph). Options of a slot say the same content in different wording, so every option of the next slot reads naturally after ANY option of this slot (no repeated data, logical linkers).
   - Keep each frame's fixed words EXACTLY (e.g. "In 1995, the layout of the town included several key features."); only replace the [brackets] with the task's real content and choose among the "/" alternatives the frame offers; tag every option with its frame number "f".
   - Some frames of a paragraph are alternatives for the same sentence (e.g. Introduction K1/K2, Overview K1/K2 for maps): put them in ONE slot ("f": [1, 2]) and offer options from each.
   - A frame may be reused in another slot for more data. Frames marked "(2 biểu đồ)" / "(Nếu cùng xu hướng)" are used only in that situation; list unused frames in "skipped" with the reason.
   - If one of her frames does not suit this task (e.g. "was surrounded by" when nothing on the map is surrounded, "the opposite was true for" when all lines rose), do NOT force it: set "status": "replaced", explain why in "why_vi", give the pattern you use instead in "alt_frame", and write the options from that pattern.
2. NO generic template writing: use the EXACT subjects, countries, categories, places, units and years from the task. Never write "the given chart" or placeholders like X/Y or [..].
3. Quote real figures from the visual (approximate with "about/around/approximately" if unclear). Never invent data that is not shown.
4. Respect her grammar rules: subject nouns kept whole (no "trọc lốc" subjects); account for/make up/constitute only for percentages; "witness" never with Percentage/Number/Figure as subject; maps tense = past (present perfect only if the second map is "now"/"present"); processes = present simple passive.
5. Introduction = 1 sentence (paraphrase, never copy the prompt). Overview = 1-2 sentences, no figures, starts with "Overall,". Body paragraphs 3-5 sentences with accurate figures and comparisons.
6. All guidance and meanings in Vietnamese; all options in English. Keep guide_vi short (1-2 sentences): which data this paragraph covers.
7. "paraphrase": list the important words of THIS prompt (the chart verb, the subject, every category/group/place/item, people, units, time phrases) with 2-4 paraphrases each that keep the same meaning (like her synonym table: Sales → Revenue; Visitors → Arrivals; Population → The number of inhabitants). Give Vietnamese meaning for the word and every alternative; add note_vi when an alternative is narrower or only fits some sentences (e.g. "car users" only for commuters who drive).`;

  // Đề gửi cho AI luôn là chữ: câu đề + nội dung hình đã đọc từ ảnh (bởi AI hoặc OCR)
  function taskBlock(text, visual) {
    let t = text ? 'Task text:\n"""' + text + '"""\n' : '';
    if (visual && visual.text) {
      t += visual.source === 'ocr'
        ? '\nOCR text of the task image (may contain recognition errors; the figures/drawing could not be seen — use only what is clearly given, and say in guide_vi if data is missing):\n"""' + visual.text + '"""\n'
        : '\nContent of the task visual, transcribed from the image:\n"""' + visual.text + '"""\n';
    }
    return t;
  }

  const READ_PROMPT = `The attached image is an IELTS Writing Task 1 question (it may show the question text, a chart, table, map or process diagram).
Read it very carefully and transcribe everything a student needs to write the answer.
Reply with ONLY one JSON object:
{
  "task_type": "maps" | "process" | "line" | "bar" | "pie" | "table" | "mixed",
  "prompt_text": "the question text exactly as written in the image, or '' if there is none",
  "visual_data": "complete English transcription of the visual: title, axis labels, units, legend; every category/series with every value and year (estimate from the axis with 'about' when needed); for maps: each map's year and every feature with its position and what changed; for processes: every stage in order with its labels"
}`;

  function buildPrompt({ text, type, band, visual, detected }) {
    return `${RULES}

Task type selected by the user: ${TYPE_HINT[type] || TYPE_HINT.auto}${detected ? ' (image reader detected: ' + detected + ')' : ''}
Target level: ${BAND[band] || BAND['7.0']}

${outlineNotes(OUTLINE_CANDIDATES[type] || OUTLINE_CANDIDATES.auto)}

${taskBlock(text, visual)}
Reply with ONLY one JSON object in this shape:
${SHAPE}`;
  }

  const NAMES = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
  // Gợi ý lại MỘT câu, dựa trên các câu học sinh đã chọn
  function buildSentencePrompt({ text, band, visual, analysis, stepIndex, slotIndex, picks }) {
    const outline = analysis.outline || G.outlineFor(analysis.task_type);
    const st = analysis.steps[stepIndex], slot = st.sentences[slotIndex];
    const done = picks.map((ps, i) => (ps || []).filter(Boolean).map(p => p.text).join(' ')).map((t, i) => (t && i !== stepIndex ? `${NAMES[i]}: ${t}` : '')).filter(Boolean).join('\n');
    const cur = (picks[stepIndex] || []).slice(0, slotIndex).map((p, k) => (p ? `  Sentence ${k + 1}: ${p.text}` : `  Sentence ${k + 1}: (not written yet)`)).join('\n');
    const later = st.sentences.slice(slotIndex + 1).map((x, k) => `  Sentence ${slotIndex + k + 2} (frame ${x.f.join('/')}) will cover: ${x.focus_vi}`).join('\n');
    return `${RULES}

Task type: ${analysis.task_type}. Subject: ${analysis.subject}.
Target level: ${BAND[band] || BAND['7.0']}

${outlineNotes([outline])}

${taskBlock(text || analysis.prompt_text, visual)}
Other paragraphs already written by the student:
${done || '(none yet)'}

The student is writing the ${NAMES[stepIndex]} paragraph one sentence at a time. Sentences chosen so far in this paragraph:
${cur || '  (this is the first sentence)'}

Write sentence ${slotIndex + 1} of the ${NAMES[stepIndex]} paragraph. Planned frame: ${slot.f.length ? 'F' + slot.f.join(' or F') : 'any suitable frame'}${slot.status === 'replaced' ? ` (replaced earlier because: ${slot.why_vi}; pattern: ${slot.alt_frame})` : ''}. Planned content: ${slot.focus_vi || '(choose)'}.
It must follow naturally from the sentences chosen above (continue their ideas, do not repeat their data, use a suitable linker) and leave room for the later sentences:
${later || '  (this is the last sentence of the paragraph)'}
Do not reuse these earlier options:
${slot.options.map(o => '- ' + o.text).join('\n')}

Reply with ONLY one JSON object for this ONE sentence slot:
{ "f": [frame numbers], "status": "fit" | "replaced", "why_vi": "", "alt_frame": "", "focus_vi": "...", "options": [ { "f": 1, "text": "one sentence" }, { "f": 1, "text": "..." }, { "f": 1, "text": "..." } ] }`;
  }

  /* ---------- Backends ---------- */
  let samplePromise = null;
  function getSample() {
    if (!samplePromise) {
      samplePromise = (window.claude && typeof window.claude.use === 'function')
        ? window.claude.use('sample').catch(() => null)
        : Promise.resolve(null);
    }
    return samplePromise;
  }
  async function available() {
    const s = await getSample();
    if (s) {
      const lim = await s.limits().catch(() => null);
      return { via: 'claude', images: !!(lim && lim.images) };
    }
    return { via: 'key', images: true };
  }

  function getKey() { try { return localStorage.getItem('e-app.apiKey') || ''; } catch (e) { return ''; } }
  function setKey(k) { try { k ? localStorage.setItem('e-app.apiKey', k) : localStorage.removeItem('e-app.apiKey'); } catch (e) { /* bỏ qua */ } }

  function dataUrlToBlob(url) {
    const [head, b64] = url.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }

  const SAMPLE_ERRORS = {
    not_granted: 'Bạn chưa cho phép trang dùng Claude. Tải lại trang, bấm lại nút và chọn Cho phép.',
    rate_limited: 'Đang gửi quá nhiều yêu cầu. Đợi một lát rồi thử lại.',
    images_unavailable: 'Chế độ xem này không gửi được ảnh. Hãy gõ đề vào ô văn bản.',
    image_rejected: 'Ảnh không đọc được. Hãy thử ảnh PNG/JPG khác.',
    cancelled: 'Đã dừng.',
  };

  function parseJson(text) {
    const t = String(text || '').replace(/```json|```/g, '').trim();
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    return JSON.parse(a >= 0 ? t.slice(a, b + 1) : t);
  }

  async function ask(prompt, image, signal) {
    const sample = await getSample();
    if (sample) {
      try {
        const opts = { modelTier: 'default', signal };
        if (image) opts.images = dataUrlToBlob(image.dataUrl);
        return await sample.json(prompt, opts);
      } catch (e) {
        const err = new Error(SAMPLE_ERRORS[e && e.code] || (e && e.message) || 'AI không trả lời được. Thử lại.');
        err.code = e && e.code;
        throw err;
      }
    }
    const apiKey = getKey();
    if (!apiKey) { const e = new Error('Cần Anthropic API key để dùng AI khi mở file ngoài claude.ai. Bấm ⚙️ để nhập.'); e.code = 'no_key'; throw e; }
    const mod = await import(SDK_URL);
    const Anthropic = mod.default || mod.Anthropic;
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const content = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
    content.push({ type: 'text', text: prompt });
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      messages: [{ role: 'user', content }],
      output_config: { effort: 'medium' },
      // nếu bị bộ lọc an toàn từ chối, server tự chuyển sang model dự phòng
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    }, { signal });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw new Error('AI từ chối xử lý đề này.');
    if (msg.stop_reason === 'max_tokens') throw new Error('Kết quả AI bị cắt ngắn. Thử lại.');
    const block = msg.content.find(b => b.type === 'text');
    if (!block) throw new Error('AI không trả về kết quả.');
    return parseJson(block.text);
  }

  // Một gợi ý: chuỗi, hoặc danh sách câu [{f, text}] → { text, parts }
  function normOption(o) {
    if (typeof o === 'string') return { text: o.trim(), parts: null };
    if (Array.isArray(o)) {
      const parts = o.map(x => (typeof x === 'string' ? { f: 0, text: x } : { f: +x.f || 0, text: String(x.text || '') }))
        .map(x => ({ f: x.f, text: x.text.trim() })).filter(x => x.text);
      return { text: parts.map(x => x.text).join(' '), parts };
    }
    if (o && o.text) return { text: String(o.text), parts: null };
    return { text: '', parts: null };
  }
  function normParaphrase(list) {
    return (Array.isArray(list) ? list : []).filter(x => x && x.word).map(x => ({
      word: String(x.word), meaning_vi: String(x.meaning_vi || ''),
      alternatives: (Array.isArray(x.alternatives) ? x.alternatives : []).filter(a => a && a.phrase)
        .map(a => ({ phrase: String(a.phrase), meaning_vi: String(a.meaning_vi || ''), note_vi: String(a.note_vi || '') })),
    }));
  }

  // Một chỗ câu (slot) trong dàn ý đoạn
  function normSlot(x) {
    if (!x) return null;
    const f = (Array.isArray(x.f) ? x.f : [x.f]).map(n => +n).filter(n => n > 0);
    const options = (Array.isArray(x.options) ? x.options : []).map(o => (typeof o === 'string' ? { f: f[0] || 0, text: o } : { f: +o.f || f[0] || 0, text: String(o.text || '') }))
      .map(o => ({ f: o.f, text: o.text.trim() })).filter(o => o.text);
    if (!options.length) return null;
    return { f, status: x.status === 'replaced' ? 'replaced' : 'fit', why_vi: String(x.why_vi || ''), alt_frame: String(x.alt_frame || ''), focus_vi: String(x.focus_vi || ''), options: options.slice(0, 4) };
  }
  // Dữ liệu cũ (gợi ý cả đoạn) → kế hoạch từng câu
  function slotsFromOptions(st) {
    const parts = (st.parts || []).filter(Boolean);
    if (!parts.length) return (st.options || []).length ? [normSlot({ f: [], options: st.options })] : [];
    const n = Math.max(...parts.map(p => p.length));
    const out = [];
    for (let k = 0; k < n; k++) {
      const opts = parts.map(p => p[k]).filter(Boolean);
      out.push(normSlot({ f: [...new Set(opts.map(o => o.f))], options: opts }));
    }
    return out.filter(Boolean);
  }

  function validate(r) {
    if (!r || !Array.isArray(r.steps) || r.steps.length < 4) throw new Error('AI trả về dữ liệu không đầy đủ. Bấm thử lại.');
    r.steps = r.steps.slice(0, 4).map(s => ({
      title: String(s.title || ''), guide_vi: String(s.guide_vi || ''),
      vocab: Array.isArray(s.vocab) ? s.vocab.filter(v => v && v.phrase) : [],
      sentences: Array.isArray(s.sentences) && s.sentences.length ? s.sentences.map(normSlot).filter(Boolean) : slotsFromOptions(s),
      skipped: (Array.isArray(s.skipped) ? s.skipped : []).filter(k => k && k.f).map(k => ({ f: +k.f, why_vi: String(k.why_vi || '') })),
    }));
    if (r.steps.some(s => !s.sentences.length)) throw new Error('AI trả về gợi ý chưa đầy đủ. Bấm thử lại.');
    r.paraphrase = normParaphrase(r.paraphrase);
    return r;
  }

  /* Bước 1: AI đọc ảnh đề → chữ (câu đề + toàn bộ số liệu/nội dung hình) */
  async function readImage({ image, signal }) {
    const r = await ask(READ_PROMPT, image, signal);
    const text = String((r && r.visual_data) || '').trim();
    if (!text && !(r && r.prompt_text)) throw new Error('AI không đọc được nội dung ảnh. Thử ảnh rõ hơn hoặc gõ đề vào ô văn bản.');
    return { task_type: r.task_type || '', prompt_text: String(r.prompt_text || '').trim(), visual: { source: 'ai', text } };
  }

  /* Dự phòng: OCR ngay trong trình duyệt (Tesseract.js, file đóng gói trong vendor/tesseract) */
  let tessPromise = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tessPromise) {
      tessPromise = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'vendor/tesseract/tesseract.min.js';
        sc.onload = () => resolve(window.Tesseract);
        sc.onerror = () => { tessPromise = null; reject(new Error('Không tải được bộ đọc chữ (OCR).')); };
        document.head.appendChild(sc);
      });
    }
    return tessPromise;
  }
  /* Dữ liệu tiếng Anh lưu dạng base64 (.txt) vì trang chỉ được đăng file văn bản/script.
   * Giải mã rồi ghi vào bộ đệm IndexedDB mà Tesseract đọc (idb-keyval: keyval-store/keyval, khoá ./eng.traineddata). */
  async function primeLangCache(base) {
    const b64 = await (await fetch(base + 'eng.traineddata.gz.b64.txt')).text();
    const bin = atob(b64.trim());
    const data = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('keyval-store');
      req.onupgradeneeded = () => req.result.createObjectStore('keyval');
      req.onerror = () => reject(new Error('Trình duyệt chặn bộ nhớ IndexedDB nên không chạy được OCR.'));
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('keyval', 'readwrite');
        tx.objectStore('keyval').put(data, './eng.traineddata');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(new Error('Không ghi được dữ liệu OCR.')); };
      };
    });
  }
  async function ocr(image, onProgress) {
    const T = await loadTesseract();
    const base = new URL('vendor/tesseract/', location.href).href;
    await primeLangCache(base);
    const worker = await T.createWorker('eng', 1, {
      workerPath: base + 'worker.min.js', corePath: base, langPath: base, workerBlobURL: false, cacheMethod: 'readOnly',
      logger: m => { if (m.status === 'recognizing text' && onProgress) onProgress(m.progress); },
    });
    try {
      const res = await worker.recognize(image.dataUrl);
      const text = String((res.data && res.data.text) || '').replace(/[ \t]+\n/g, '\n').trim();
      if (!text) throw new Error('Không thấy chữ trong ảnh. Hãy gõ đề vào ô văn bản.');
      return { source: 'ocr', text };
    } finally { worker.terminate(); }
  }

  /* Bước 2: tạo gợi ý 4 đoạn từ chữ */
  async function analyze({ text, type, band, visual, detected, signal }) {
    const r = validate(await ask(buildPrompt({ text, type, band, visual, detected }), null, signal));
    r.outline = G.outlineFor(r.task_type, r.outline);
    return r;
  }
  async function regenSentence({ text, band, visual, analysis, stepIndex, slotIndex, picks, signal }) {
    const r = normSlot(await ask(buildSentencePrompt({ text, band, visual, analysis, stepIndex, slotIndex, picks }), null, signal));
    if (!r) throw new Error('AI chưa tạo được gợi ý mới. Thử lại.');
    return r;
  }

  /* ---------- Bài giảng & bài tập làm quen biểu đồ ---------- */
  const EX_TYPES = {
    mcq: 'Đọc biểu đồ — trắc nghiệm về số liệu (cao nhất/thấp nhất, xu hướng, so sánh)',
    tf: 'Đúng / Sai / Không có thông tin về biểu đồ',
    match: 'Nối từ trong đề với từ paraphrase',
    gap: 'Điền từ vào câu theo khung Ms. Gigi (có ngân hàng từ)',
    order: 'Sắp xếp cụm từ thành câu đúng khung',
    write: 'Viết câu theo khung cho từng đoạn (có bài mẫu)',
  };
  const LESSON_SHAPE = `{
  "task_type": "maps" | "process" | "line" | "bar" | "pie" | "table" | "mixed",
  "outline": "trend" | "compare" | "maps" | "floorplan" | "process_man" | "process_nat",
  "subject": "exact subject in English",
  "topic_vi": "one Vietnamese sentence: what the visual shows",
  "prompt_text": "the task question if visible, else ''",
  "lesson": {
    "objectives_vi": ["2-3 lesson objectives in Vietnamese"],
    "reading_steps": [ { "q_vi": "guided question to read the visual (Vietnamese)", "a": "answer (Vietnamese, with the real figures)" } ],   // 5-7 questions: what it shows, units, time/categories, highest, lowest, main trend/change, special point
    "key_features": ["3-5 key features in Vietnamese with real figures"],
    "plan": [ { "step": "intro" | "overview" | "body1" | "body2", "focus_vi": "what this paragraph covers and which data (Vietnamese)", "model": [ { "f": 1, "text": "model sentence written from frame F1" } ] } ],   // exactly 4 items in order
    "vocab": [ { "phrase": "...", "meaning_vi": "...", "example": "example sentence about THIS visual" } ],   // 8-12 items
    "mistakes_vi": ["3-4 common mistakes on this visual and the correct form"]
  },
  "paraphrase": [ { "word": "...", "meaning_vi": "...", "alternatives": [ { "phrase": "...", "meaning_vi": "...", "note_vi": "" } ] } ],   // 8-12 key words of the prompt
  "exercises": [   // one object per requested type, in the order requested
    { "type": "mcq", "title_vi": "...", "instruction_vi": "...", "items": [ { "q": "question in English", "options": ["...", "...", "..."], "answer": 0, "explain_vi": "..." } ] },
    { "type": "tf", "title_vi": "...", "instruction_vi": "...", "items": [ { "statement": "English statement about the visual", "answer": "T" | "F" | "NG", "explain_vi": "..." } ] },
    { "type": "match", "title_vi": "...", "instruction_vi": "...", "items": [ { "left": "word from the prompt", "right": "its paraphrase", "meaning_vi": "..." } ] },
    { "type": "gap", "title_vi": "...", "instruction_vi": "...", "bank": ["every answer plus 2-3 distractors"], "items": [ { "sentence": "sentence about THIS visual with each blank written as ____", "answers": ["answer for blank 1", "..."], "explain_vi": "..." } ] },
    { "type": "order", "title_vi": "...", "instruction_vi": "...", "items": [ { "frame": "K1 · Introduction", "chunks": ["chunks", "in the CORRECT order", "3-8 chunks"], "explain_vi": "..." } ] },
    { "type": "write", "title_vi": "...", "instruction_vi": "...", "items": [ { "para": "Introduction" | "Overview" | "Body 1" | "Body 2", "frame": "the exact Ms. Gigi frame to use", "task_vi": "what to write about (Vietnamese)", "hint_vi": "which data/words to use", "model": "model sentence" } ] }
  ]
}`;
  function buildLessonPrompt({ text, type, band, visual, detected, types, count }) {
    const wanted = types.map((t, i) => `${i + 1}. "${t}": ${EX_TYPES[t]}`).join('\n');
    return `You are an IELTS Writing Task 1 teacher assistant for Ms. Gigi, a Vietnamese teacher.
Build a short LESSON and small scaffolded EXERCISES that help her students get familiar with THIS visual and with each sentence of her outline BEFORE they write the full essay.

Rules:
- Use only the real content of the task (exact subjects, categories, places, years, units, figures). Never invent data; approximate with "about" when values are read from an axis.
- Follow the teacher's outline below. Every model sentence and every exercise sentence must be written from her numbered frames (F1, F2...) for the right paragraph, keeping the frames' fixed words; tag model sentences with the frame number.
- Respect her grammar rules (account for only with %, no bare "trọc lốc" subjects, "witness" not with Percentage/Number/Figure, maps = past tense, process = present simple passive).
- Exercises go from easy to hard: understanding the visual → vocabulary → sentence building → writing. Each type has exactly ${count} items (match: ${Math.max(count, 6)} pairs; write: one item per paragraph, 4 items).
- gap: blanks focus on her key phrases (trend verbs, comparison phrases, prepositions, frame words); "answers" must appear in "bank".
- order: chunks are short phrases (not single letters), given in the CORRECT order — the app shuffles them.
- mcq: exactly one correct option; "answer" is its 0-based index. tf: use NG only when the visual really does not say.
- instruction_vi must work both on screen and on a printed worksheet (say "chọn / điền / sắp xếp / nối / viết", never "bấm").
- All instructions, explanations and meanings in Vietnamese; all English content in natural academic English at ${BAND[band] || BAND['7.0']}

Exercise types requested (in this order):
${wanted}

Task type selected by the teacher: ${TYPE_HINT[type] || TYPE_HINT.auto}${detected ? ' (image reader detected: ' + detected + ')' : ''}

${outlineNotes(OUTLINE_CANDIDATES[type] || OUTLINE_CANDIDATES.auto)}

${taskBlock(text, visual)}
Reply with ONLY one JSON object in this shape:
${LESSON_SHAPE}`;
  }
  function validateLesson(r, types) {
    if (!r || !r.lesson || !Array.isArray(r.exercises)) throw new Error('AI trả về bài giảng chưa đầy đủ. Bấm thử lại.');
    const L = r.lesson;
    const arr = x => (Array.isArray(x) ? x : []);
    L.objectives_vi = arr(L.objectives_vi).map(String);
    L.reading_steps = arr(L.reading_steps).filter(x => x && x.q_vi).map(x => ({ q_vi: String(x.q_vi), a: String(x.a || '') }));
    L.key_features = arr(L.key_features).map(String);
    L.plan = arr(L.plan).slice(0, 4).map((x, i) => ({ step: G.STEP_KEYS[i], focus_vi: String((x && x.focus_vi) || ''), model: normOption(x && x.model).parts || [] }));
    L.vocab = arr(L.vocab).filter(v => v && v.phrase);
    L.mistakes_vi = arr(L.mistakes_vi).map(String);
    r.paraphrase = normParaphrase(r.paraphrase);
    r.exercises = r.exercises.filter(e => e && EX_TYPES[e.type] && Array.isArray(e.items) && e.items.length).map(e => {
      if (e.type === 'mcq') e.items = e.items.filter(it => Array.isArray(it.options) && it.options.length > 1).map(it => ({ ...it, answer: Math.min(Math.max(+it.answer || 0, 0), it.options.length - 1) }));
      if (e.type === 'gap') {
        e.items = e.items.filter(it => it.sentence && Array.isArray(it.answers));
        e.bank = [...new Set(arr(e.bank).concat(e.items.flatMap(it => it.answers)).map(String))];
      }
      if (e.type === 'order') e.items = e.items.filter(it => Array.isArray(it.chunks) && it.chunks.length > 1);
      if (e.type === 'tf') e.items = e.items.map(it => ({ ...it, answer: ['T', 'F', 'NG'].includes(it.answer) ? it.answer : (it.answer === true ? 'T' : 'F') }));
      return e;
    }).filter(e => e.items.length);
    if (!r.exercises.length) throw new Error('AI chưa tạo được bài tập. Bấm thử lại.');
    r.outline = G.outlineFor(r.task_type, r.outline);
    return r;
  }
  async function makeLesson({ text, type, band, visual, detected, types, count, signal }) {
    const r = await ask(buildLessonPrompt({ text, type, band, visual, detected, types, count }), null, signal);
    return validateLesson(r, types);
  }

  return { readImage, ocr, analyze, regenSentence, upgradeSteps: steps => steps.map(s => (s.sentences ? s : Object.assign({}, s, { sentences: slotsFromOptions(s), skipped: [] }))), makeLesson, EX_TYPES, available, getKey, setKey };
})();
