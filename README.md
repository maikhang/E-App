# Ms. Nhi Gigi – IELTS Writing Task 1

Web app luyện viết IELTS Writing Task 1: dán đề (chữ hoặc ảnh) → AI đọc đề → gợi ý **từng đoạn bám sát đề** để chọn hoặc tự sửa → bài hoàn chỉnh.

## Luồng sử dụng
1. **Đề bài** – chọn dạng (Maps / Process / Charts & Tables / Tự nhận dạng), dán đề hoặc ảnh đề (Ctrl+V, kéo thả, chọn ảnh), chọn trình độ (Band 6.0 / 7.0+ / 8.0+).
2. **AI đọc đề** – trích xuất chủ thể, số liệu, mốc thời gian.
3. **Viết 4 đoạn** – Introduction → Overview → Body 1 → Body 2. Mỗi đoạn có hướng dẫn tiếng Việt, từ vựng riêng cho đề, 3 đoạn gợi ý để chọn, nút “↻ Gợi ý khác”, ô tự sửa. Ảnh đề luôn hiện bên cạnh để đối chiếu.
4. **Bài hoàn chỉnh** – đếm từ, sửa lại từng đoạn, sao chép cả bài.

📚 **Kho từ vựng**: quy tắc chống viết chung chung, từ vựng riêng của đề đang làm, và toàn bộ dàn ý Maps (bảng A/B, cấu trúc viết, cấu trúc câu, lưu ý IN/AT/ON/TO, mẹo). Với đề Maps, AI bắt buộc dùng bộ từ vựng này.

“Xem bài mẫu” mở một bài Maps có sẵn (đề minh hoạ) để xem app hoạt động mà không cần AI.

## Dàn ý Ms. Gigi
`js/gigi.js` chứa toàn bộ dàn ý từ tài liệu *IELTS WRITING Ms. Gigi*: 6 dạng (Line/Bar xu hướng, Bar/Pie/Table so sánh, Maps, Floor plan, Process nhân tạo, Process tự nhiên) với khung câu Introduction/Overview/Body 1/Body 2, quy tắc, từ vựng và bài mẫu, cùng các quy tắc chung (chủ thể, quy tắc “trọc lốc”, từ đồng nghĩa, so sánh 3 mức độ, nâng cấp Band 7+).
- AI chọn đúng dàn ý cho đề và viết gợi ý 1 bám sát khung câu; gợi ý 2–3 dùng các cấu trúc khác trong dàn ý.
- Mỗi đoạn hiện “📐 Khung dàn ý Ms. Gigi” (lấy thẳng từ file, không phụ thuộc AI).
- Đoạn văn được kiểm tra theo quy tắc của cô (account for chỉ dùng cho %, witness, Body 1 Maps không nói thay đổi, Process dùng bị động hiện tại, side→ON, part→IN…).
- Nút “📚 Dàn ý Ms. Gigi” mở thư viện theo từng dạng.

## AI
- Dán ảnh đề (không cần gõ chữ) vẫn dùng được AI: bước 1 AI đọc ảnh thành chữ (câu đề + toàn bộ số liệu/nội dung hình, hiện ở mục “AI đọc được từ ảnh” để kiểm tra), bước 2 tạo gợi ý. Nếu chế độ xem không gửi được ảnh, app tự đọc chữ trong ảnh bằng OCR (Tesseract.js đóng gói trong `vendor/tesseract`).
- Mở trong claude.ai: dùng tài khoản Claude của người xem, không cần API key.
- Mở file `index.html` riêng: cần Anthropic API key (⚙️), chỉ lưu trong trình duyệt.

## Mã nguồn
`index.html` là một file duy nhất (đã gộp CSS + JS), mở trực tiếp là chạy.
Sửa trong `src/index.html`, `css/`, `js/` rồi chạy `python3 build.py` để tạo lại `index.html` và `dist/task1-coach.html` (bản đăng claude.ai).

- `js/content.js` – dàn ý & từ vựng Maps, bài mẫu
- `js/ai.js` – gọi AI đọc đề và tạo gợi ý
- `js/app.js` – giao diện
