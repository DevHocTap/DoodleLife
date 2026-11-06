# C01 — Báo cáo thử nghiệm API tạo ảnh và chọn nhà cung cấp

Ngày kiểm tra giá/tài liệu: **06/11/2026** (Asia/Saigon). Giá có thể thay đổi;
kiểm tra lại trang giá chính thức của provider trước khi chốt ngân sách.

> **Hiệu đính ngày 06/11/2026:** Jarvis kiểm chứng lại sau khi viết bản đầu —
> `gemini-3.1-flash-image` (Nano Banana 2) đã bị Google deprecated, Google
> khuyên dự án mới dùng `gemini-nano-banana-2.1` thay thế. Mặc định trong
> `.env.example` đã đổi sang `gemini-nano-banana-2.1`; giá ~$0.07/ảnh của
> bản cũ không áp dụng cho model mới — kiểm tra lại giá của 2.1 trước khi
> chạy thử 20 câu.
>
> **Hiệu đính 2, tối 06/11/2026 — đổi provider chính sang Cloudflare:**
> Sếp quyết định **không setup billing**. Jarvis kiểm chứng lại bằng tìm
> kiếm: Gemini API ghi free tier cho image output là **"Not available"**
> với mọi model ảnh, kể cả `gemini-nano-banana-2.1`; project free có
> limit 0 cho image output nên lỗi 429 ở lần chạy 1 **không hết khi chờ**
> — đây chính là nguyên nhân, không phải key sai hay hết quota ngày.
> Provider chính đổi sang **Cloudflare Workers AI, model FLUX.1 schnell
> (`@cf/black-forest-labs/flux-1-schnell`)**, miễn phí 10.000 neurons/ngày
> (khoảng 100–200 ảnh 1024×1024/ngày trong hạn mức đó), không cần thẻ.
> Gemini giữ làm đường nâng cấp trả phí ($0.0336/ảnh 1K cho
> `gemini-nano-banana-2.1`, nạp trước tối thiểu $5). Vì FLUX bám prompt
> tiếng Anh tốt nhất, thử nghiệm C01 với Cloudflare dùng bản dịch tiếng
> Anh của 20 câu (`C01_SENTENCES_EN`); trong luồng sản phẩm, nhật ký
> tiếng Việt cần bước dịch Việt → Anh trước khi gọi Cloudflare (chưa có
> trong Sprint 1 — sẽ làm ở C03/C05, có thể dùng Gemini text API vốn có
> free tier để dịch).

## Trạng thái quan trọng: ảnh thật CHƯA được tạo

**Trong lần làm này, KHÔNG có ảnh thật nào được tạo**, vì chưa có API key
nào của bất kỳ provider nào. Harness `apps/api/scripts/c01-experiment.ts`
đã viết xong và sẽ thoát với mã 2 + thông báo rõ biến key nào còn thiếu
khi chạy mà không có key — nó không tự gọi API trả phí và không tạo ảnh giả
làm minh chứng thật.

Để chạy thử 20 câu thật, cần **một** trong các key sau (chỉ cần key của
provider đã chọn):
- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (khuyến nghị — miễn phí),
  lấy ở dashboard Cloudflare → trang Workers AI → Use REST API →
  Create a Workers AI API Token; hoặc
- `GEMINI_API_KEY` (cần billing), hoặc
- `OPENAI_API_KEY`, hoặc `STABILITY_API_KEY`, hoặc `REPLICATE_API_TOKEN`.

Cách chạy sau khi có key (xem thêm trong `apps/api/scripts/c01-experiment.ts`):

```bash
cd apps/api
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<id> npm run c01 -- --provider cloudflare --out results/c01-cloudflare.json
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

## Bảng so sánh provider (giá kiểm tra 06/11/2026)

Giá dưới đây là giá công bố tại thời điểm kiểm tra; chi phí thật cho 20 ảnh
tính theo công thức trong bảng. "Chi phí 20 ảnh" chưa tính phí input/thử lại.

| Provider / model | Giá/ảnh (kiểm tra 06/11/2026) | Chi phí ước tính 20 ảnh | Chạy nền / async | Prompt tiếng Việt | Nguồn |
| --- | --- | --- | --- | --- | --- |
| **Cloudflare Workers AI FLUX.1 schnell** (`@cf/black-forest-labs/flux-1-schnell`) — **provider chính từ tối 06/11/2026** | **$0** trong 10.000 neurons/ngày miễn phí (~100–200 ảnh 1024×1024/ngày; FLUX schnell ~57,6 neurons/ảnh ở 4 bước). Vượt hạn mức trên gói Free thì request lỗi chứ không tự tính phí. | **$0** | Sync (API trả ảnh base64 ngay); tự xếp job trong DB của mình | Cần dịch sang tiếng Anh trước — thử nghiệm C01 dùng bản dịch `C01_SENTENCES_EN` | developers.cloudflare.com/workers-ai (pricing, REST API), bảng so sánh free tier 10/10/2026 |
| **Google Gemini 3.1 Flash Image** (`gemini-3.1-flash-image`, Nano Banana 2) | ~**$0.07**/ảnh 1K (Runway Dev: 7 credits = $0.07; bản Lite $0.04) | ~**$1.40** | Sync (API trả ngay); tự xếp job trong DB của mình | **Tốt — Gemini 3 Pro/Flash Image liệt kê vi-VN trong nhóm ngôn ngữ hiệu năng tốt nhất** (Google Cloud docs) | dev.runwayml.com, cloud.google.com/vertex-ai (limitations) |
| **Google Gemini 3 Pro Image** (`gemini-3-pro-image`, Nano Banana Pro) | **$0.134**/ảnh 1K–2K, $0.24/ảnh 4K ($120/1M output tokens; batch $0.067) | ~**$2.68** | Sync; tự xếp job trong DB | **Tốt — vi-VN được liệt kê**; mạnh nhất về bám prompt + chỉnh sửa nhiều bước | ai.google.dev / Gemini API pricing qua argolink.io, 8frame.co (đọc 09–18/10/2026) |
| **OpenAI `gpt-image-2`** | Token: output $30/1M; ước tính **$0.006 low / $0.053 medium / $0.211 high** mỗi ảnh 1024×1024 (chỉ tính output; input $5/1M text, $8/1M image thêm vào). Batch giảm 50%. | ~**$1.06** ở medium (chưa tính input) | Sync; Batch API async (tối đa 24h) giảm 50% | Tốt (LLM đa ngôn ngữ), nhưng giá theo token nên khó dự toán chính xác khi chưa chạy | developers.openai.com (pricing), blog.laozhang.ai (03/10/2026) |
| **Stability SD3 / SD3.5** | Credit: 1 credit = $0.01. SD3.5 Flash **$0.025**, Core $0.03, SD3.5 Medium $0.035, Large Turbo $0.04, Large $0.065, Ultra $0.08. Tài khoản mới có 25 credit miễn phí. | **$0.50** (Flash) – **$1.30** (Large) | Sync REST; không có async/webhook chính thức — tự xếp job trong DB | Trung bình — diffusion model, prompt tiếng Anh bám tốt nhất; prompt tiếng Việt nên dịch sang tiếng Anh trước (thêm bước, có thể lệch ý) | platform.stability.ai/pricing (kiểm tra 26/09–08/10/2026) |
| **Replicate FLUX** | Per-output: Schnell **$0.003**/ảnh ($3/1000), Dev **$0.025**/ảnh, 1.1 Pro **$0.04**/ảnh. Model khác tính theo giây GPU (H100 $0.001525/s). Không có free tier. | **$0.06** (Schnell) – **$0.50** (Dev) | **Async native tốt nhất**: predictions API (`starting → processing → succeeded/failed`), `Prefer: wait` tối đa 60s, polling hoặc webhook. **Lưu ý: output URL chỉ sống ~1 giờ — phải tải về storage ngay (C04).** | Trung bình — như Stability, prompt tiếng Anh bám tốt nhất; tiếng Việt cần dịch trước | replicate.com/pricing (kiểm tra 23/09–28/10/2026), docs Replicate predictions |

## Khuyến nghị (cập nhật tối 06/11/2026)

### Provider chính: Cloudflare Workers AI — FLUX.1 schnell

Lý do, theo thứ tự quan trọng với DoodleLife:

1. **Miễn phí thật cho đồ án, không cần billing.** 10.000 neurons/ngày
   đủ khoảng 100–200 ảnh/ngày — 20 câu thử nghiệm hết $0, và cả sản
   phẩm chạy demo cũng nằm trong hạn mức. Đây là điều kiện Sếp đặt ra
   (không setup billing), và là điểm Gemini không đáp ứng được: tạo ảnh
   qua Gemini API không có free tier.
2. **Nhanh, API đơn giản (sync, trả ảnh base64 ngay).** Phù hợp với cơ
   chế job trong DB của Sprint 1: API gọi sync trong worker, job ghi
   trạng thái, không cần webhook server ngay từ đầu. FLUX.1 schnell ở
   4 bước cho ảnh trong khoảng vài giây.
3. **Giấy phép sạch.** FLUX.1 schnell là model mở (Apache 2.0), đầu ra
   dùng được cho sản phẩm.
4. **Cái giá phải trả: cần dịch prompt sang tiếng Anh.** FLUX là
   diffusion model bám prompt tiếng Anh tốt nhất. Thử nghiệm C01 dùng
   bản dịch `C01_SENTENCES_EN`; trong luồng sản phẩm cần bước dịch
   Việt → Anh (có thể dùng Gemini text API vốn có free tier để dịch —
   chỉ image output của Gemini mới không có free tier, text thì có).
   Bước dịch có thể làm lệch ý nên phải chấm độ phù hợp 0–2 trên 20 ảnh
   thật rồi mới chốt.

### Phương án dự phòng

1. **Dự phòng cấp 1 (nâng cấp trả phí): Gemini `gemini-nano-banana-2.1`**
   — $0.0336/ảnh 1K, nạp trước tối thiểu $5 (~148 ảnh). Dùng khi FLUX
   cho sticker lệch phong cách hoặc bám prompt kém trên 20 câu mẫu, và
   chỉ khi nhóm đồng ý bật billing. Lợi thế: hiểu tiếng Việt trực tiếp,
   không cần bước dịch.
2. **Dự phòng cấp 2 (khác nhà, async native): Replicate FLUX Schnell/Dev**
   — $0.003/$0.025/ảnh. Dùng khi cần async/webhook thật. Nhược điểm:
   phải dịch prompt sang tiếng Anh trước và phải tải ảnh về storage ngay
   trong 1 giờ (output URL hết hạn).
3. **Dự phòng cấp 3: Stability SD3.5 Flash** — $0.025/ảnh, 25 credit miễn
   phí ban đầu. Rẻ, nhưng cũng cần dịch prompt và không có async native.

### Không chọn làm chính (và vì sao)

- **Gemini làm chính**: chất lượng và tiếng Việt đều tốt, nhưng tạo ảnh
  qua API không có free tier — Sếp đã quyết không setup billing nên
  Gemini chỉ còn là đường nâng cấp trả phí.
- **OpenAI `gpt-image-2`**: chất lượng cao, nhưng giá theo token nên chi
  phí mỗi ảnh dao động $0.006–$0.211 tùy quality và khó dự toán trước khi
  chạy; không có free tier. Giữ làm dự phòng cấp 4 nếu nhóm đã có sẵn
  key OpenAI.
- **Imagen 4 / `gpt-image-1`**: đã tắt, không dùng.

## Giới hạn thử nghiệm (cần xác minh khi chạy thật)

- Cloudflare Workers AI: 10.000 neurons/ngày miễn phí trên cả gói Free
  và Paid, reset 00:00 UTC; vượt hạn mức trên gói Free thì request lỗi
  chứ không tự tính phí. FLUX.1 schnell ~57,6 neurons/ảnh 1024×1024 ở
  4 bước theo bảng giá — con số thực tế đo được sẽ ghi lại khi chạy.
- Gemini API: không có free tier cho image output qua API (chỉ AI Studio
  web UI miễn phí có giới hạn); cần billing enabled. Rate limit theo
  project — ghi lại khi chạy.
- Replicate: giới hạn tạo prediction 600 req/phút; output xóa sau 1 giờ.
- Stability: credit mua theo gói $10; tài khoản mới 25 credit miễn phí.
- OpenAI: Batch API giảm 50% nhưng chờ tối đa 24h — không dùng cho
  luồng tạo sticker tương tác, chỉ dùng cho thử nghiệm hàng loạt nếu cần.

## Cần gì để hoàn thành C01 thật

1. Token + Account ID của provider chính: `CLOUDFLARE_API_TOKEN` và
   `CLOUDFLARE_ACCOUNT_ID` (lấy free ở dashboard Cloudflare → trang
   Workers AI → Use REST API → Create a Workers AI API Token).
2. Chạy `npm run c01 -- --provider cloudflare` trong `apps/api` (20 câu,
   $0 ước tính). Chạy thử 1–2 câu trước (`--limit 2`), rồi mới chạy cả 20.
3. Người chấm xem 20 ảnh thật, điền `relevance` (0–2) và ghi chú lệch ý /
   chữ lạ / sai phong cách vào file kết quả, rồi cập nhật bảng này với
   tỷ lệ thành công, thời gian trung bình và chi phí thực tế.
4. Nếu FLUX không đạt, chạy lại cùng 20 câu với Gemini
   (`GEMINI_API_KEY` + billing, `GEMINI_MODEL=gemini-nano-banana-2.1`)
   rồi so sánh trước khi chốt — nhưng chỉ khi nhóm đồng ý bật billing.

## Kết quả chạy thật lần 1 — 06/11/2026 16:48 (+07)

- Provider/model: Gemini `gemini-nano-banana-2.1`, 20 câu mẫu trong `packages/shared/src/c01-sentences.ts`.
- Kết quả: **0/20 ảnh thành công. Tất cả đều lỗi HTTP 429.**
  Câu 1 mất 63,6 giây rồi lỗi 429; các câu 2–20 lỗi ngay sau 0,1–0,3 giây.
  Chi phí: $0,00 (không có ảnh nào được tạo). File kết quả:
  `apps/api/results/c01-gemini.json` + `.csv` (không có ảnh nào trong `results/gemini/`).
- Kiểm tra thêm: key hợp lệ — gọi danh sách model của Gemini API trả về
  61 model, trong đó có `models/gemini-nano-banana-2.1`. Vậy lỗi 429 không
  phải do sai key hay sai tên model.
- **Nguyên nhân đã xác định tối 06/11/2026:** Gemini API không có free
  tier cho image output — project free có limit 0 nên 429 không hết khi
  chờ. Sếp quyết định không setup billing, vì vậy provider chính đổi
  sang Cloudflare Workers AI (xem Hiệu đính 2 ở đầu báo cáo). Không chạy
  lại Gemini khi chưa bật billing.

## Kết quả chạy thật lần 2 — 06/11/2026 19:03–19:05 (+07) ✅

- Provider/model: Cloudflare Workers AI `@cf/black-forest-labs/flux-1-schnell`
  (FLUX.1 schnell), 20 câu mẫu — bản dịch tiếng Anh `C01_SENTENCES_EN`
  của 20 câu gốc trong `packages/shared/src/c01-sentences.ts`.
- Kết quả: **20/20 ảnh thành công, chi phí $0,00.** Thời gian trung bình
  **6,62 giây/ảnh** (nhanh nhất 1,3 giây, chậm nhất 20,7 giây — câu 12).
  Ảnh thật 1024×1024 JPEG trong `results/cloudflare/c01-01.jpg` …
  `c01-20.jpg`. File kết quả: `apps/api/results/c01-cloudflare.json` + `.csv`
  (cột `relevance` vẫn null — chờ người chấm điền tay).
- Sửa lỗi trước khi chạy đủ 20 câu: 2 câu thử đầu bị HTTP 400 vì adapter
  gửi thêm tham số `num_steps` mà schema của FLUX không nhận ("unevaluated
  properties '/num_steps'") — đã sửa thành chỉ gửi `prompt` và giữ nguyên
  model ID dạng `@cf/...` trong URL (không encode), chạy lại 2/2 rồi mới
  chạy cả 20 câu. Bài học: với Workers AI, chỉ gửi đúng field mà trang
  model của Cloudflare liệt kê.
- Kiểm tra sơ bộ phong cách (Jarvis xem 6/20 ảnh: 01, 02, 05, 09, 12, 19):
  phong cách doodle giữ vững — nét viền dày, màu phẳng đúng bảng 6 màu,
  nền kem, **không có chữ thật trong ảnh nào**. Lệch ý cần ghi nhận cho C02:
  c01-09 (em bé tập đi) vẽ thêm 2–3 trẻ em thừa; c01-12 (học bài khuya)
  nền không đồng màu mà có mảng trời đêm xám; c01-19 (lạc đường ở phố cổ)
  có tiệm sách cũ nhưng thiếu người đang lạc đường, và có một biển hiệu
  với nét ngoằn ngoèo (không phải chữ thật). Đây là nhận xét sơ bộ —
  **Sếp vẫn cần xem đủ 20 ảnh và điền `relevance` 0–2 vào file kết quả.**
- **Kết luận C01: chốt Cloudflare Workers AI FLUX.1 schnell làm provider
  chính** — 20/20 ảnh thật, $0, thời gian chấp nhận được cho luồng sticker
  (trung bình ~7 giây/ảnh, chạy nền trong job DB). Gemini giữ làm đường
  nâng cấp trả phí khi cần bám prompt tiếng Việt trực tiếp hoặc chất lượng
  cao hơn. Việc còn lại của C01: Sếp chấm `relevance` 0–2 cho 20 ảnh, và
  một thành viên khác trong nhóm review PR.
