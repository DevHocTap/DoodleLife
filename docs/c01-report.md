# C01 — Báo cáo thử nghiệm API tạo ảnh và chọn nhà cung cấp

Ngày kiểm tra giá/tài liệu: **06/11/2026** (Asia/Saigon). Giá có thể thay đổi;
kiểm tra lại trang giá chính thức của provider trước khi chốt ngân sách.

> **Hiệu đính ngày 06/11/2026:** Jarvis kiểm chứng lại sau khi viết bản đầu —
> `gemini-3.1-flash-image` (Nano Banana 2) đã bị Google deprecated, Google
> khuyên dự án mới dùng `gemini-nano-banana-2.1` thay thế. Mặc định trong
> `.env.example` đã đổi sang `gemini-nano-banana-2.1`; giá ~$0.07/ảnh của
> bản cũ không áp dụng cho model mới — kiểm tra lại giá của 2.1 trước khi
> chạy thử 20 câu.

## Trạng thái quan trọng: ảnh thật CHƯA được tạo

**Trong lần làm này, KHÔNG có ảnh thật nào được tạo**, vì chưa có API key
nào của bất kỳ provider nào. Harness `apps/api/scripts/c01-experiment.ts`
đã viết xong và sẽ thoát với mã 2 + thông báo rõ biến key nào còn thiếu
khi chạy mà không có key — nó không tự gọi API trả phí và không tạo ảnh giả
làm minh chứng thật.

Để chạy thử 20 câu thật, cần **một** trong các key sau (chỉ cần key của
provider đã chọn):
- `GEMINI_API_KEY` (khuyến nghị), hoặc
- `OPENAI_API_KEY`, hoặc `STABILITY_API_KEY`, hoặc `REPLICATE_API_TOKEN`.

Cách chạy sau khi có key (xem thêm trong `apps/api/scripts/c01-experiment.ts`):

```bash
cd apps/api
GEMINI_API_KEY=<key> npm run c01 -- --provider gemini --out results/c01-gemini.json
```

Kết quả sẽ ghi ra `results/c01-<provider>.json` + `.csv` và ảnh thật vào
`results/<provider>/c01-XX.png`. Người chấm điền cột `relevance` (0–2) và
ghi chú phong cách doodle sau khi xem ảnh.

## Cảnh báo về tên model trong đề bài gốc

Đề bài C01–C05 ghi `gpt-image-1` và `Imagen`. Cả hai tên đó đều đã lỗi thời:

| Tên trong đề bài | Trạng thái thực tế (06/11/2026) | Dùng thay bằng |
| --- | --- | --- |
| OpenAI `gpt-image-1` | Đã tắt ngày **23/10/2026** (OpenAI, developers.openai.com) | `gpt-image-2` (hiện tại), `gpt-image-2.5` Sunburst/Flare (flagship mới, 08/09/2026) |
| Google Imagen 4 | Đã tắt trên Gemini API ngày **17/08/2026**, deprecated trên Vertex AI 24/03/2026; Google chuyển sang dòng Gemini-native | Gemini 3 Pro Image (`gemini-3-pro-image`, Nano Banana Pro) hoặc Gemini 3.1 Flash Image (`gemini-3.1-flash-image`, Nano Banana 2) |

Code trong repo đã dùng model kế nhiệm, không dùng tên model đã tắt.

## Bảng so sánh 4 provider (giá kiểm tra 06/11/2026)

Giá dưới đây là giá công bố tại thời điểm kiểm tra; chi phí thật cho 20 ảnh
tính theo công thức trong bảng. "Chi phí 20 ảnh" chưa tính phí input/thử lại.

| Provider / model | Giá/ảnh (kiểm tra 06/11/2026) | Chi phí ước tính 20 ảnh | Chạy nền / async | Prompt tiếng Việt | Nguồn |
| --- | --- | --- | --- | --- | --- |
| **Google Gemini 3.1 Flash Image** (`gemini-3.1-flash-image`, Nano Banana 2) | ~**$0.07**/ảnh 1K (Runway Dev: 7 credits = $0.07; bản Lite $0.04) | ~**$1.40** | Sync (API trả ngay); tự xếp job trong DB của mình | **Tốt — Gemini 3 Pro/Flash Image liệt kê vi-VN trong nhóm ngôn ngữ hiệu năng tốt nhất** (Google Cloud docs) | dev.runwayml.com, cloud.google.com/vertex-ai (limitations) |
| **Google Gemini 3 Pro Image** (`gemini-3-pro-image`, Nano Banana Pro) | **$0.134**/ảnh 1K–2K, $0.24/ảnh 4K ($120/1M output tokens; batch $0.067) | ~**$2.68** | Sync; tự xếp job trong DB | **Tốt — vi-VN được liệt kê**; mạnh nhất về bám prompt + chỉnh sửa nhiều bước | ai.google.dev / Gemini API pricing qua argolink.io, 8frame.co (đọc 09–18/10/2026) |
| **OpenAI `gpt-image-2`** | Token: output $30/1M; ước tính **$0.006 low / $0.053 medium / $0.211 high** mỗi ảnh 1024×1024 (chỉ tính output; input $5/1M text, $8/1M image thêm vào). Batch giảm 50%. | ~**$1.06** ở medium (chưa tính input) | Sync; Batch API async (tối đa 24h) giảm 50% | Tốt (LLM đa ngôn ngữ), nhưng giá theo token nên khó dự toán chính xác khi chưa chạy | developers.openai.com (pricing), blog.laozhang.ai (03/10/2026) |
| **Stability SD3 / SD3.5** | Credit: 1 credit = $0.01. SD3.5 Flash **$0.025**, Core $0.03, SD3.5 Medium $0.035, Large Turbo $0.04, Large $0.065, Ultra $0.08. Tài khoản mới có 25 credit miễn phí. | **$0.50** (Flash) – **$1.30** (Large) | Sync REST; không có async/webhook chính thức — tự xếp job trong DB | Trung bình — diffusion model, prompt tiếng Anh bám tốt nhất; prompt tiếng Việt nên dịch sang tiếng Anh trước (thêm bước, có thể lệch ý) | platform.stability.ai/pricing (kiểm tra 26/09–08/10/2026) |
| **Replicate FLUX** | Per-output: Schnell **$0.003**/ảnh ($3/1000), Dev **$0.025**/ảnh, 1.1 Pro **$0.04**/ảnh. Model khác tính theo giây GPU (H100 $0.001525/s). Không có free tier. | **$0.06** (Schnell) – **$0.50** (Dev) | **Async native tốt nhất**: predictions API (`starting → processing → succeeded/failed`), `Prefer: wait` tối đa 60s, polling hoặc webhook. **Lưu ý: output URL chỉ sống ~1 giờ — phải tải về storage ngay (C04).** | Trung bình — như Stability, prompt tiếng Anh bám tốt nhất; tiếng Việt cần dịch trước | replicate.com/pricing (kiểm tra 23/09–28/10/2026), docs Replicate predictions |

## Khuyến nghị

### Provider chính: Google Gemini 3.1 Flash Image (Nano Banana 2)

Lý do, theo thứ tự quan trọng với DoodleLife:

1. **Hiểu tiếng Việt trực tiếp.** Nhật ký của người dùng viết bằng tiếng
   Việt. Google liệt kê vi-VN trong nhóm ngôn ngữ hiệu năng tốt nhất của
   Gemini 3 Pro/Flash Image; Imagen (chỉ hỗ trợ đầy đủ tiếng Anh) thì
   không làm được điều này. Các provider còn lại đều là diffusion model
   bám prompt tiếng Anh tốt nhất — dùng chúng nghĩa là phải thêm bước
   dịch Việt → Anh, vừa tốn thêm chi phí/latency vừa có thể làm lệch ý
   của câu nhật ký.
2. **Rẻ đủ cho thử nghiệm và cho sản phẩm.** ~$0.07/ảnh → 20 câu thử hết
   ~$1.40; 1.000 sticker/tháng ~$70, chấp nhận được cho đồ án.
3. **Nhanh, API đơn giản (sync).** Phù hợp với cơ chế job trong DB của
   Sprint 1: API gọi sync trong worker, job ghi trạng thái, không cần
   webhook server ngay từ đầu.
4. **Có đường nâng cấp cùng nhà.** Nếu Flash Image chưa đủ chất lượng
   phong cách, nâng lên Gemini 3 Pro Image ($0.134/ảnh) mà không đổi
   code — chỉ đổi `GEMINI_MODEL`. Đây cũng là provider dự phòng cấp 1.

### Phương án dự phòng

1. **Dự phòng cấp 1 (cùng nhà): Gemini 3 Pro Image** — $0.134/ảnh 1K–2K.
   Dùng khi Flash Image cho sticker lệch phong cách hoặc bám prompt kém
   trên 20 câu mẫu.
2. **Dự phòng cấp 2 (khác nhà, async native): Replicate FLUX Schnell/Dev**
   — $0.003/$0.025/ảnh. Dùng khi cần async/webhook thật hoặc khi Gemini
   lỗi/quota. Nhược điểm: phải dịch prompt sang tiếng Anh trước và phải
   tải ảnh về storage ngay trong 1 giờ (output URL hết hạn).
3. **Dự phòng cấp 3: Stability SD3.5 Flash** — $0.025/ảnh, 25 credit miễn
   phí ban đầu. Rẻ, nhưng cũng cần dịch prompt và không có async native.

### Không chọn làm chính (và vì sao)

- **OpenAI `gpt-image-2`**: chất lượng cao, nhưng giá theo token nên chi
  phí mỗi ảnh dao động $0.006–$0.211 tùy quality và khó dự toán trước khi
  chạy; không có lợi thế tiếng Việt rõ rệt so với Gemini mà giá medium
  (~$0.053 + input) cũng không rẻ hơn Flash Image là bao. Giữ làm dự
  phòng cấp 4 nếu nhóm đã có sẵn key OpenAI.
- **Imagen 4 / `gpt-image-1`**: đã tắt, không dùng.

## Giới hạn thử nghiệm (cần xác minh khi chạy thật)

- Gemini API: không có free tier cho image output qua API (chỉ AI Studio
  web UI miễn phí có giới hạn); cần billing enabled. Rate limit theo
  project — ghi lại khi chạy.
- Replicate: giới hạn tạo prediction 600 req/phút; output xóa sau 1 giờ.
- Stability: credit mua theo gói $10; tài khoản mới 25 credit miễn phí.
- OpenAI: Batch API giảm 50% nhưng chờ tối đa 24h — không dùng cho
  luồng tạo sticker tương tác, chỉ dùng cho thử nghiệm hàng loạt nếu cần.

## Cần gì để hoàn thành C01 thật

1. Một API key của provider chính: `GEMINI_API_KEY` (khuyến nghị).
2. Chạy `npm run c01 -- --provider gemini` trong `apps/api` (20 câu,
   ~$1.40 ước tính).
3. Người chấm xem 20 ảnh thật, điền `relevance` (0–2) và ghi chú lệch ý /
   chữ lạ / sai phong cách vào file kết quả, rồi cập nhật bảng này với
   tỷ lệ thành công, thời gian trung bình và chi phí thực tế.
4. Nếu Flash Image không đạt, chạy lại cùng 20 câu với Nano Banana Pro
   (`GEMINI_MODEL=gemini-3-pro-image`) rồi so sánh trước khi chốt.

## Kết quả chạy thật lần 1 — 06/11/2026 16:48 (+07)

- Provider/model: Gemini `gemini-nano-banana-2.1`, 20 câu mẫu trong `packages/shared/src/c01-sentences.ts`.
- Kết quả: **0/20 ảnh thành công. Tất cả đều lỗi HTTP 429.**
  Câu 1 mất 63,6 giây rồi lỗi 429; các câu 2–20 lỗi ngay sau 0,1–0,3 giây.
  Chi phí: $0,00 (không có ảnh nào được tạo). File kết quả:
  `apps/api/results/c01-gemini.json` + `.csv` (không có ảnh nào trong `results/gemini/`).
- Kiểm tra thêm: key hợp lệ — gọi danh sách model của Gemini API trả về
  61 model, trong đó có `models/gemini-nano-banana-2.1`. Vậy lỗi 429 không
  phải do sai key hay sai tên model, mà do hết quota / bị giới hạn tốc độ
  cho image generation trên key/project này (thường là chưa bật billing
  cho image output, hoặc quota ngày đã hết).
- Đã dừng, không thử lại liên tục. Cần kiểm tra ở Google AI Studio /
  Google Cloud: billing đã bật chưa, quota image generation còn không,
  rồi mới chạy lại. Chạy lại chỉ nên thử 1–2 câu trước, không chạy cả 20
  câu ngay.
