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

Xem `docs/c01-report.md` — so sánh 4 nhà cung cấp, khuyến nghị và phương
án dự phòng. Lưu ý: `gpt-image-1` đã tắt ngày 23/10/2026 và Imagen 4 đã tắt
trên Gemini API ngày 17/08/2026; code dùng model kế nhiệm
(`gpt-image-2`, Gemini 3 Pro/Flash Image).

**Ảnh thật CHƯA được tạo trong lần scaffold này vì chưa có API key.**
Chạy thử 20 câu cần key của provider đã chọn (xem `docs/c01-report.md`).
Model Gemini mặc định là `gemini-nano-banana-2.1` (Google khuyên dùng cho
dự án mới; `gemini-3.1-flash-image` đã deprecated).

## Bảo mật

- Không bao giờ commit `.env` hay API key. Key chỉ đọc từ biến môi trường.
- API không trả raw error hay key ra ngoài; mọi lỗi đều qua mã lỗi chuẩn
  trong `packages/shared` (`ApiErrorCode`).
