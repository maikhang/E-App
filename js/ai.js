/* Đọc đề từ ảnh:
 *  - AI (Claude, cần API key của bạn): đọc cả chữ lẫn nội dung bản đồ → tự điền bước Phân tích.
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
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['prompt_text', 'place', 'year1', 'year2', 'tense', 'features', 'changes'],
    properties: {
      prompt_text: { type: 'string', description: 'The task question text exactly as written (empty if not visible).' },
      place: { type: 'string', description: 'Place name with article, e.g. "the village of Chorleywood".' },
      year1: { type: 'string' },
      year2: { type: 'string', description: 'Year of the second map, or "present".' },
      tense: { type: 'string', enum: ['past', 'perfect', 'future'] },
      features: {
        type: 'array',
        description: 'Key features of MAP 1 with their positions (max 6).',
        items: { type: 'object', additionalProperties: false, required: ['name', 'pos'], properties: { name: { type: 'string' }, pos: posSchema } },
      },
      changes: {
        type: 'array',
        description: 'Changes visible on MAP 2 (max 8). Mark the 3-4 most significant with main=true.',
        items: {
          type: 'object', additionalProperties: false, required: ['type', 'subject', 'target', 'pos', 'main'],
          properties: {
            type: { type: 'string', enum: ENGINE.CHANGE_TYPES.map(c => c.id) },
            subject: { type: 'string', description: 'Old feature (from map 1) without article; empty for built/added.' },
            target: { type: 'string', description: 'New feature without article; empty if not applicable.' },
            pos: posSchema,
            main: { type: 'boolean' },
          },
        },
      },
    },
  };

  const SYSTEM = `You help Vietnamese students prepare IELTS Writing Task 1 MAP answers.
Read the task (text and/or image) and extract structured notes:
- features: the important buildings/areas on the FIRST map and where they are.
- changes: what changed on the SECOND map. Use exactly one change type per item:
  built (new large building), added (small/extra facility), demolished, removed, replaced (X -> Y in the same place),
  converted (same building, new function), transformed (big area change, e.g. farmland -> housing), expanded (bigger area),
  extended (roads, railways, bridges made longer), relocated (moved; pos = new position), modernized, renovated,
  reduced (smaller), redeveloped (whole area rebuilt), unchanged (appears on both maps unchanged).
- Positions use these relation ids: ${ENGINE.RELATIONS.map(r => `${r.id} = "${r.label}"`).join('; ')}.
  "in_dir" = inside the area; "to_dir" = outside the reference, towards that direction.
- Use simple English nouns without articles ("school", "car park", "houses").
- tense: "past" if both maps are in the past, "perfect" if the second map is the present day, "future" if it is a plan/proposal.
If the image is not a map task, return empty arrays and whatever text you can read.`;

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
  async function analyze({ text, image }) {
    const apiKey = getKey();
    if (!apiKey) throw new Error('Chưa có API key. Bấm ⚙️ Cài đặt để nhập Anthropic API key.');
    const Anthropic = await loadSdk();
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    const content = [];
    if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
    content.push({ type: 'text', text: (text ? 'Task text:\n' + text + '\n\n' : '') + 'Extract the notes for this IELTS Task 1 map question.' });

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

  return { analyze, ocr, getKey, setKey, MODEL };
})();
