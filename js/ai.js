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

  // Từ vựng & cấu trúc trong dàn ý của giáo viên → AI ưu tiên dùng (bắt buộc với Maps)
  function outlineNotes(type) {
    const structures = C.sentenceStructures.map(s => `${s.name} (${s.formula})`).join('; ');
    let t = `Sentence structures to use: ${structures}. Tip: Time + Object + Action + Position.`;
    if (type === 'maps' || type === 'auto') {
      t += `\nIF THE TASK IS A MAP, use the teacher's vocabulary below (vary synonyms, do not repeat the same phrase):
- Change verbs: ${C.changeVocab.map(v => v.phrase).join(', ')}.
- Extra structures: ${C.writingStructures.map(g => g.items.join(', ')).join('; ')}.
- Position phrases: ${C.positionVocab.map(v => v.phrase).join(', ')}.
- Rules: "in the north of X" = inside X, "to the north of X" = outside X; "side" takes ON; "part" takes IN; IN: center, middle, corner, part, area; AT: top, bottom, entrance, intersection, junction; ON: side, bank, edge, left/right-hand side.
- Body 1 describes the first map (positions); Body 2 describes the changes (change verbs + positions). Choose only the 3-4 main changes.`;
    }
    return t;
  }

  const SHAPE = `{
  "task_type": "maps" | "process" | "line" | "bar" | "pie" | "table" | "mixed",
  "subject": "the exact subject in English, e.g. 'water consumption in the USA and China'",
  "topic_vi": "one Vietnamese sentence: what the task shows",
  "prompt_text": "the task question exactly as written if visible, else ''",
  "steps": [  // exactly 4 items in this order: Introduction, Overview, Body 1, Body 2
    {
      "title": "Vietnamese title of what this paragraph does for THIS task",
      "guide_vi": "Vietnamese guidance (2-4 sentences): what to write, which data to pick, how to group, traps",
      "vocab": [ { "phrase": "English phrase", "meaning_vi": "nghĩa tiếng Việt" } ],   // 5-8 items for THIS task and paragraph
      "options": [ "full paragraph option 1", "option 2", "option 3" ]              // 3 alternative paragraphs
    }
  ]
}`;

  const RULES = `You are a professional IELTS Writing Task 1 examiner and teacher for Vietnamese learners.
Golden rule: NO generic template writing. Read the task (text and/or image) carefully and use the EXACT subjects,
countries, categories, places, units and years from it in every option. Never write "the given chart" or placeholders like X/Y.
Quote real figures from the visual (approximate with "about/around" if unclear). Never invent data that is not shown.
Paragraph lengths: Introduction = 1 sentence (paraphrase, never copy the prompt). Overview = 2 sentences starting with "Overall,", no figures.
Body 1 and Body 2 = 3-5 sentences each, grouping the data logically, with accurate figures and comparisons.
Use the correct tense (past for past years, present perfect up to now, future for plans/projections, present simple passive for processes).
Each of the 3 options must use different structures and vocabulary, but all must be accurate.
All guidance and meanings in Vietnamese; all options in English.`;

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

  function buildPrompt({ text, type, band, visual }) {
    return `${RULES}

Task type selected by the user: ${TYPE_HINT[type] || TYPE_HINT.auto}
Target level: ${BAND[band] || BAND['7.0']}
${outlineNotes(type)}

${taskBlock(text, visual)}
Reply with ONLY one JSON object in this shape:
${SHAPE}`;
  }

  const NAMES = ['Introduction', 'Overview', 'Body 1', 'Body 2'];
  function buildRegenPrompt({ text, band, visual, analysis, stepIndex, chosen }) {
    const prev = chosen.map((p, i) => (p ? `${NAMES[i]}: ${p}` : '')).filter(Boolean).join('\n');
    const old = (analysis.steps[stepIndex].options || []).join('\n- ');
    return `${RULES}

Task type: ${analysis.task_type}. Subject: ${analysis.subject}.
Target level: ${BAND[band] || BAND['7.0']}
${outlineNotes(analysis.task_type === 'maps' ? 'maps' : 'charts')}

${taskBlock(text || analysis.prompt_text, visual)}
Paragraphs the student has already chosen:
${prev || '(none yet)'}

Write 3 NEW options for the ${NAMES[stepIndex]} paragraph that fit with the chosen paragraphs and do not repeat their data.
Do not reuse these earlier options:
- ${old}

Reply with ONLY one JSON object: { "options": ["...", "...", "..."] }`;
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

  function validate(r) {
    if (!r || !Array.isArray(r.steps) || r.steps.length < 4) throw new Error('AI trả về dữ liệu không đầy đủ. Bấm thử lại.');
    r.steps = r.steps.slice(0, 4).map(s => ({
      title: String(s.title || ''), guide_vi: String(s.guide_vi || ''),
      vocab: Array.isArray(s.vocab) ? s.vocab.filter(v => v && v.phrase) : [],
      options: Array.isArray(s.options) ? s.options.map(String).filter(Boolean) : [],
    }));
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
  async function analyze({ text, type, band, visual, signal }) {
    return validate(await ask(buildPrompt({ text, type, band, visual }), null, signal));
  }
  async function regenerate({ text, band, visual, analysis, stepIndex, chosen, signal }) {
    const r = await ask(buildRegenPrompt({ text, band, visual, analysis, stepIndex, chosen }), null, signal);
    if (!r || !Array.isArray(r.options) || !r.options.length) throw new Error('AI chưa tạo được gợi ý mới. Thử lại.');
    return r.options.map(String);
  }

  return { readImage, ocr, analyze, regenerate, available, getKey, setKey };
})();
