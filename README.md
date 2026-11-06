# DoodleLife — Nền tảng nhật ký trực quan tích hợp AI

Nhóm 2 · [FJS-MD7] Final Capstone Project · Sprint 1 (05/11–11/11/2026)

DoodleLife là ứng dụng web giúp người dùng lưu giữ và nhìn lại những trải
nghiệm thường ngày thông qua nhật ký trực quan. Từ các đoạn ghi chép ngắn,
hệ thống dùng AI để tạo sticker theo phong cách doodle và sắp xếp chúng trên
dòng thời gian tương tác. Ứng dụng hỗ trợ tổng hợp nhật ký theo mốc thời gian
thành ảnh kỷ niệm để tải xuống và chia sẻ; người dùng kiểm soát nội dung xuất
hiện trong ảnh, nhật ký và hình ảnh cá nhân được lưu trữ riêng tư.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS (`apps/web`)
- Backend: Node.js + Express + TypeScript (`apps/api`)
- DB: PostgreSQL (Supabase)
- Storage: Supabase Storage, bucket riêng tư + signed URL có thời hạn
- Tác vụ nền: bảng `image_jobs` trong DB cho Sprint 1 (xem `docs/sql/jobs.sql`),
  nâng lên BullMQ/Redis sau nếu cần
- CI: GitHub Actions (`.github/workflows/ci.yml`)

## Chạy local

```bash
npm install
cp apps/api/.env.example apps/api/.env   # điền key khi cần, KHÔNG commit file .env
npm run dev          # chạy cả web (5173) và api (3001)
npm run typecheck    # kiểm tra kiểu toàn monorepo
npm run test         # chạy test
npm run build        # build web + api + shared
```

- Web: http://localhost:5173
- API health: http://localhost:3001/health

## Cấu trúc

```
apps/web/            # React + Vite: viết nhật ký, timeline, xem sticker
apps/api/            # Express + TS: auth, entries, image jobs, storage
  src/image/         # adapter gọi API tạo ảnh (C03)
  src/jobs/          # job store + schema bảng jobs (C05)
  scripts/           # c01-experiment.ts — harness thử nghiệm C01
packages/shared/     # types, prompt doodle v1 (C02), mã lỗi chuẩn
docs/                # c01-report.md, sql/jobs.sql
```

## API tạo ảnh (C01)

Xem `docs/c01-report.md` — so sánh các nhà cung cấp, khuyến nghị và phương
án dự phòng. Lưu ý: `gpt-image-1` đã tắt ngày 23/10/2026 và Imagen 4 đã tắt
trên Gemini API ngày 17/08/2026; code dùng model kế nhiệm
(`gpt-image-2`, Gemini 3 Pro/Flash Image).

**Provider chính từ 06/11/2026 là Cloudflare Workers AI (FLUX.1 schnell),
miễn phí 10.000 neurons/ngày** — Gemini đổi sang đường nâng cấp trả phí vì
tạo ảnh qua Gemini API không có free tier (chạy thử lần 1 trả 0/20, toàn
lỗi 429 do project free có limit 0). Chạy thử 20 câu với Cloudflare cần
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (lấy free ở dashboard
Cloudflare → trang Workers AI → Use REST API), xem `docs/c01-report.md`.
Model Gemini mặc định vẫn là `gemini-nano-banana-2.1` (Google khuyên dùng
cho dự án mới; `gemini-3.1-flash-image` đã deprecated).

**Ảnh thật CHƯA được tạo vì chưa có key/token của provider nào.**
Chạy thử 20 câu cần token của provider đã chọn (xem `docs/c01-report.md`).

## Bảo mật

- Không bao giờ commit `.env` hay API key. Key chỉ đọc từ biến môi trường.
- API không trả raw error hay key ra ngoài; mọi lỗi đều qua mã lỗi chuẩn
  trong `packages/shared` (`ApiErrorCode`).
