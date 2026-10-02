# Task 1 Writing Coach

Web app gợi ý **từng câu** cho IELTS Writing Task 1, bám đúng dàn ý & từ vựng của bạn. Bắt đầu với dạng **Maps** (các dạng khác: sắp có).

## Chạy
Mở `index.html` bằng trình duyệt (không cần cài đặt). Hoặc `python3 -m http.server` rồi vào `http://localhost:8000`.

## Quy trình trong app (theo dàn ý)
0. **Đề bài** – gõ/dán đề, hoặc dán ảnh (Ctrl+V / kéo thả / chọn ảnh). App tự nhận địa điểm, năm, thì.
1. **Phân tích bản đồ (3')** – Map 1: công trình + vị trí; Map 2: thay đổi; đánh dấu ⭐ 3-4 thay đổi chính.
2. **Introduction** → 3. **Overview** → 4. **Body 1 (Map 1)** → 5. **Body 2 (thay đổi)** – mỗi mục có khung *Trước khi viết* (công thức, cấu trúc, từ vựng, lưu ý) rồi gợi ý từng câu, bấm “＋ Dùng” để ghép vào bài.
6. **Kiểm tra (2')** – đếm từ, lỗi giới từ IN/AT/ON/TO, lặp từ, thì, cấu trúc chưa dùng.

📚 **Thư viện**: toàn bộ bảng từ vựng A/B, cấu trúc viết, bảng cấu trúc câu, lưu ý và mẹo.

## Đọc ảnh đề
- **OCR** (miễn phí, Tesseract.js): đọc chữ của đề.
- **AI** (Claude, cần Anthropic API key nhập ở ⚙️, chỉ lưu trong trình duyệt): đọc cả bản đồ và tự điền bước Phân tích.

## Cấu trúc mã
- `js/content.js` – dàn ý, từ vựng, cấu trúc (nguồn duy nhất cho mọi câu gợi ý)
- `js/engine.js` – sinh câu theo thì (was built / has been built / will be built), kiểm tra bài
- `js/ai.js` – AI & OCR đọc ảnh
- `js/app.js` – giao diện
