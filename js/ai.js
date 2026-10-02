/* Đọc & phân tích mọi đề Task 1 (maps, line, bar, pie, table, process, mixed):
 *  - AI (Claude): trong claude.ai dùng tài khoản người xem; mở file riêng thì cần API key.
 *  - OCR (Tesseract.js, miễn phí, chạy trong trình duyệt): chỉ đọc chữ của đề bài. */
window.AI = (function () {
  const MODEL = 'claude-opus-5-5';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk/+esm';
  const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

  const posSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['rel', 'dir', 'ref'],
    properties: {
      rel: { type: 'string', enum: ENGINE.RELATIONS.map(r => r.id).concat(['']) },
      dir: { type: 'string', description: 'north|south|east|west|north-east|north-west|south-east|south-west, left|right, top|bottom, top-left|top-right|bottom-left|bottom-right, or empty' },
      ref: { type: 'string', description: 'Reference object WITHOUT article, e.g. "river", "town", "main road"; empty if none' },
    },
  };
  const str = (description) => (description ? { type: 'string', description } : { type: 'string' });
  const strArr = (description) => ({ type: 'array', description, items: { type: 'string' } });
  const slotSchema = {
    type: 'array',
    items: {
      type: 'object', additionalProperties: false, required: ['label', 'variants'],
      properties: {
        label: str('Vietnamese label: sentence number + its job, e.g. "Câu 2 · Xu hướng của nhóm tăng"'),
        variants: {
          type: 'array',
          description: '2-3 alternative English sentences for this slot, each using a different structure.',
          items: {
            type: 'object', additionalProperties: false, required: ['text', 'structure'],
            properties: { text: str(), structure: str('Structure / key phrase used, e.g. "Contrast (while)", "Passive Voice", "rose sharply"') },
          },
        },
      },
    },
  };
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['task_type', 'prompt_text', 'topic_vi', 'place', 'year1', 'year2', 'tense', 'features', 'changes',
      'key_features', 'overview_points', 'body1_focus', 'body2_focus', 'data_notes', 'sections', 'vocabulary', 'teacher_notes', 'common_mistakes'],
    properties: {
      task_type: { type: 'string', enum: ['maps', 'line', 'bar', 'pie', 'table', 'process', 'mixed'] },
      prompt_text: str('The task question text exactly as written (empty if not visible).'),
      topic_vi: str('One Vietnamese sentence: what the visual shows.'),
      place: str('MAPS ONLY: place name with article, e.g. "the village of Chorleywood". Empty otherwise.'),
      year1: str('First year / start of the period, or empty.'),
      year2: str('Last year / end of the period, "present", or empty.'),
      tense: { type: 'string', enum: ['past', 'perfect', 'future', 'present'] },
      features: {
        type: 'array',
        description: 'MAPS ONLY: key features of MAP 1 with their positions (max 6). Empty for other types.',
        items: { type: 'object', additionalProperties: false, required: ['name', 'pos'], properties: { name: str(), pos: posSchema } },
      },
      changes: {
        type: 'array',
        description: 'MAPS ONLY: changes visible on MAP 2 (max 8); mark the 3-4 most significant with main=true. Empty for other types.',
        items: {
          type: 'object', additionalProperties: false, required: ['type', 'subject', 'target', 'pos', 'main'],
          properties: {
            type: { type: 'string', enum: ENGINE.CHANGE_TYPES.map(c => c.id) },
            subject: str('Old feature (from map 1) without article; empty for built/added.'),
            target: str('New feature without article; empty if not applicable.'),
            pos: posSchema,
            main: { type: 'boolean' },
          },
        },
      },
      key_features: strArr('Vietnamese: the 3-5 most important things a student must notice (with the real figures).'),
      overview_points: strArr('English notes: the 2 main points for the Overview (no figures).'),
      body1_focus: str('Vietnamese: what Body 1 covers and why this grouping.'),
      body2_focus: str('Vietnamese: what Body 2 covers.'),
      data_notes: strArr('English: specific data to quote (highest, lowest, start/end values, stages), each one short.'),
      sections: {
        type: 'object', additionalProperties: false, required: ['intro', 'overview', 'body1', 'body2'],
        description: 'Sentence-by-sentence suggestions. For MAPS return empty arrays (the app builds map sentences itself).',
        properties: { intro: slotSchema, overview: slotSchema, body1: slotSchema, body2: slotSchema },
      },
      vocabulary: {
        type: 'array', description: '8-14 phrases useful for THIS task.',
        items: { type: 'object', additionalProperties: false, required: ['phrase', 'meaning_vi', 'example'], properties: { phrase: str(), meaning_vi: str(), example: str() } },
      },
      teacher_notes: strArr('Vietnamese: 3-5 teaching notes (how to group data, what to compare, traps in this visual).'),
      common_mistakes: strArr('Vietnamese: 3-5 mistakes students typically make on this task, each with the correct form.'),
    },
  };

  const BAND_GUIDE = {
    '5.5': 'Band 5.5-6 learners: short, clear sentences; common vocabulary; at most one clause per sentence.',
    '6.5': 'Band 6.5-7 learners: mix simple and complex sentences; precise trend/comparison vocabulary; accurate figures.',
    '7.5': 'Band 7.5+ learners: varied complex structures, nominalisation, precise collocations, concise and natural.',
  };

  const SYSTEM = `You are an IELTS Writing Task 1 teaching assistant for Vietnamese teachers and students.
Read the task (text and/or image), identify its type, and prepare a lesson-ready analysis.

Outline every answer must follow (4 paragraphs):
1. Introduction: one sentence paraphrasing the prompt (illustrate/compare, between X and Y; never copy it).
2. Overview: 1-2 sentences starting with "Overall," giving the 2 main features, with NO figures.
3. Body 1 and 4. Body 2: the details, grouped logically (e.g. rising vs falling items, highest vs lowest, first map vs changes, first half vs second half of a process). 3-5 sentences each, quoting accurate figures.
Prefer these sentence structures and name them in "structure": Passive Voice (S + was/were + V3), There was/were + N, Time Clause (In + [Year], S + V), Contrast (S + V..., while...), Addition (Moreover, S + V).
Use the right tense: past for past years, present perfect when the end point is now, future for plans/projections, present simple (mostly passive) for processes and timeless diagrams.
Never invent data: if a value is unclear, approximate with "about/around" and say so in teacher_notes.

For MAPS tasks: fill place/year1/year2/tense/features/changes and leave "sections" arrays empty.
- features: the important buildings/areas on the FIRST map and where they are.
- changes: one type per item: built (new large building), added (small/extra facility), demolished, removed, replaced (X -> Y same place),
  converted (same building, new function), transformed (big area change), expanded (bigger area), extended (roads/railways made longer),
  relocated (moved; pos = new position), modernized, renovated, reduced, redeveloped (whole area rebuilt), unchanged.
- Positions use these relation ids: ${ENGINE.RELATIONS.map(r => `${r.id} = "${r.label}"`).join('; ')}.
  "in_dir" = inside the area; "to_dir" = outside the reference, towards that direction.
- Use simple English nouns without articles ("school", "car park", "houses").
For every other type: leave features/changes empty and fill "sections" with 1 intro slot, 1-2 overview slots, and 3-5 slots for each body paragraph.
All explanations (labels, key_features, focus, notes, mistakes, meaning_vi) in Vietnamese; all model sentences in English.`;

  function getKey() {
    try { return localStorage.getItem('e-app.apiKey') || ''; } catch (e) { return ''; }
  }
  function setKey(k) {
    try { k ? localStorage.setItem('e-app.apiKey', k) : localStorage.removeItem('e-app.apiKey'); } catch (e) { /* bỏ qua */ }
  }

  let sdkPromise = null;
  function loadSdk() {
    if (!sdkPromise) sdkPromise = import(SDK_URL).then(m => m.default || m.Anthropic);
    return sdkPromise;
  }

  /* image: { mediaType, base64 } | null */
  async function analyze({ text, image, band }) {
    const sample = await getSample();
    if (sample) return analyzeWithSample(sample, { text, image, band });
    const apiKey = getKey();
    if (!apiKey) throw new Error('Chưa có API key. Bấm ⚙️ Cài đặt để nhập Anthropic API key.');
    const Anthropic = await loadSdk();
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const content = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
    content.push({ type: 'text', text: 'Target level: ' + (BAND_GUIDE[band] || BAND_GUIDE['6.5']) + '\n\n' + (text ? 'Task text:\n' + text + '\n\n' : '') + 'Analyse this IELTS Writing Task 1 question.' });

    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
      // nếu bị bộ lọc an toàn từ chối, server tự chuyển sang model dự phòng
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
    if (response.stop_reason === 'refusal') throw new Error('AI từ chối xử lý ảnh này. Hãy nhập tay ở bước Phân tích.');
    if (response.stop_reason === 'max_tokens') throw new Error('Kết quả AI bị cắt ngắn. Thử lại với ảnh rõ hơn.');
    const block = response.content.find(b => b.type === 'text');
    if (!block) throw new Error('AI không trả về kết quả.');
    return JSON.parse(block.text);
  }

  /* Khi mở trong claude.ai (Artifact): gọi Claude bằng tài khoản người xem, không cần API key. */
  let samplePromise = null;
  function getSample() {
    if (!samplePromise) {
      samplePromise = (window.claude && typeof window.claude.use === 'function')
        ? window.claude.use('sample').catch(() => null)
        : Promise.resolve(null);
    }
    return samplePromise;
  }
  async function sampleCaps() {
    const s = await getSample();
    if (!s) return null;
    const lim = await s.limits().catch(() => null);
    return { images: !!(lim && lim.images) };
  }
  function dataUrlToBlob(url) {
    const [head, b64] = url.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type });
  }
  const SAMPLE_ERRORS = {
    not_granted: 'Bạn chưa cho phép trang dùng Claude. Tải lại trang và bấm Cho phép.',
    rate_limited: 'Đang gửi quá nhiều yêu cầu. Đợi một lát rồi thử lại.',
    images_unavailable: 'Chế độ xem này không gửi được ảnh. Hãy gõ đề vào ô văn bản.',
    image_rejected: 'Ảnh không đọc được. Hãy thử ảnh PNG/JPG khác.',
  };
  async function analyzeWithSample(sample, { text, image, band }) {
    const prompt = SYSTEM + '\n\n' + 'Target level: ' + (BAND_GUIDE[band] || BAND_GUIDE['6.5']) + '\n\n' + (text ? 'Task text:\n' + text + '\n\n' : '') +
      (image ? 'The attached image is the task (question text and/or the two maps).\n' : '') +
      'Reply with ONLY one JSON object matching this JSON Schema:\n' + JSON.stringify(schema);
    try {
      return await sample.json(prompt, Object.assign({ modelTier: 'default' }, image ? { images: dataUrlToBlob(image.dataUrl) } : {}));
    } catch (e) {
      throw new Error(SAMPLE_ERRORS[e && e.code] || (e && e.message) || 'AI không đọc được đề.');
    }
  }

  let tessPromise = null;
  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!tessPromise) {
      tessPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = TESSERACT_URL;
        s.onload = () => resolve(window.Tesseract);
        s.onerror = () => { tessPromise = null; reject(new Error('Không tải được thư viện OCR (cần mạng).')); };
        document.head.appendChild(s);
      });
    }
    return tessPromise;
  }
  async function ocr(dataUrl, onProgress) {
    const T = await loadTesseract();
    const res = await T.recognize(dataUrl, 'eng', { logger: m => m.status === 'recognizing text' && onProgress && onProgress(m.progress) });
    return (res.data && res.data.text || '').replace(/\s+\n/g, '\n').trim();
  }

  return { analyze, ocr, getKey, setKey, sampleCaps, MODEL };
})();
