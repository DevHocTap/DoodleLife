/**
 * Harness thử nghiệm C01 — chạy 20 câu tiếng Việt mẫu qua 1 provider.
 *
 * Cách dùng:
 *   GEMINI_API_KEY=... npm run c01 -- --provider gemini --out results/c01-gemini.json
 *   OPENAI_API_KEY=... npm run c01 -- --provider openai
 *   STABILITY_API_KEY=... npm run c01 -- --provider stability
 *   REPLICATE_API_TOKEN=... npm run c01 -- --provider replicate
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npm run c01 -- --provider cloudflare
 *
 * Provider mặc định là cloudflare (miễn phí, Sếp chốt 06/11/2026).
 * Với cloudflare, harness dùng bản dịch tiếng Anh của 20 câu
 * (C01_SENTENCES_EN) vì FLUX bám prompt tiếng Anh tốt nhất; 20 câu
 * tiếng Việt gốc vẫn ghi trong file kết quả để chấm đối chiếu.
 *
 * Quy tắc an toàn:
 * - Key chỉ đọc từ biến môi trường, không hardcode, không in ra log.
 * - Nếu thiếu key của provider đã chọn, script báo rõ cần biến nào và
 *   thoát với mã 2 — KHÔNG tự gọi API trả phí, không tạo ảnh giả.
 * - Kết quả ghi ra JSON + CSV: câu, provider, model, thành công, thời gian,
 *   chi phí ước tính, ghi chú. Ảnh thật (nếu có) lưu vào results/<provider>/.
 * - Chi phí ước tính lấy từ bảng giá trong docs/c01-report.md tại thời
 *   điểm chạy; đây là ước tính, hóa đơn thực tế theo provider mới là chuẩn.
 */
import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { C01_SENTENCES, C01_SENTENCES_EN, type C01Result, type ImageProviderId } from '@doodlelife/shared';
import { generateImage } from '../src/image/adapter.js';
import { loadEnv } from '../src/env.js';

/** Chi phí ước tính USD/ảnh theo docs/c01-report.md (kiểm tra 06/11/2026). */
const ESTIMATED_COST_USD: Record<string, number> = {
  'gemini:gemini-3.1-flash-image': 0.07,
  'gemini:gemini-3-pro-image': 0.134,
  'openai:gpt-image-2': 0.053, // medium 1024x1024, chỉ tính output
  'stability:sd3.5-flash': 0.025,
  'stability:sd3-large': 0.065,
  'replicate:black-forest-labs/flux-schnell': 0.003,
  'replicate:black-forest-labs/flux-dev': 0.025,
  // Cloudflare Workers AI: 10.000 neurons/ngày miễn phí, ~100–200 ảnh
  // FLUX.1 schnell 1024×1024/ngày trong hạn mức đó — chi phí $0.
  'cloudflare:@cf/black-forest-labs/flux-1-schnell': 0,
};

const KEY_ENV: Record<ImageProviderId, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  stability: 'STABILITY_API_KEY',
  replicate: 'REPLICATE_API_TOKEN',
  cloudflare: 'CLOUDFLARE_API_TOKEN',
};

function parseArgs(argv: string[]): { provider: ImageProviderId; out: string; limit: number } {
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const provider = get('--provider', 'cloudflare') as ImageProviderId;
  if (!['gemini', 'openai', 'stability', 'replicate', 'cloudflare'].includes(provider)) {
    throw new Error(`Provider không hợp lệ: ${provider}. Chọn gemini | openai | stability | replicate | cloudflare.`);
  }
  return {
    provider,
    out: get('--out', `results/c01-${provider}.json`),
    limit: Number(get('--limit', String(C01_SENTENCES.length))),
  };
}

function toCsv(results: C01Result[]): string {
  const esc = (v: string | number | null): string => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = results.map((r) =>
    [r.index, esc(r.sentence), r.provider, r.model, r.success, r.durationSeconds, r.estimatedCostUsd, r.relevance, esc(r.note)].join(','),
  );
  return ['index,sentence,provider,model,success,durationSeconds,estimatedCostUsd,relevance,note', ...rows].join('\n');
}

async function main(): Promise<void> {
  const { provider, out, limit } = parseArgs(process.argv.slice(2));
  const env = loadEnv();
  const keyVar = KEY_ENV[provider];
  if (!process.env[keyVar]) {
    console.error(
      `C01 chưa chạy được: thiếu biến môi trường ${keyVar} cho provider ${provider}.\n` +
        `Hãy export ${keyVar}=<key của bạn> rồi chạy lại. Script không tự gọi API trả phí khi thiếu key.`,
    );
    process.exit(2);
  }
  if (provider === 'cloudflare' && !process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.error(
      'C01 chưa chạy được: thiếu biến môi trường CLOUDFLARE_ACCOUNT_ID cho provider cloudflare.\n' +
        'Lấy Account ID ở dashboard Cloudflare → trang Workers AI → Use REST API.',
    );
    process.exit(2);
  }
  const model =
    provider === 'gemini'
      ? env.geminiModel
      : provider === 'openai'
        ? env.openaiModel
        : provider === 'stability'
          ? env.stabilityModel
          : provider === 'replicate'
            ? env.replicateModel
            : env.cloudflareModel;
  const costKey = `${provider}:${model}`;
  const estimatedCost = ESTIMATED_COST_USD[costKey] ?? null;
  if (estimatedCost === null) {
    console.warn(`Chưa có chi phí ước tính cho ${costKey}; cột estimatedCostUsd sẽ để null.`);
  }

  const outDir = join(process.cwd(), 'results', provider);
  await mkdir(outDir, { recursive: true });
  const results: C01Result[] = [];
  const sentences = C01_SENTENCES.slice(0, limit);
  // Cloudflare FLUX nhận cảnh tiếng Anh; file kết quả vẫn ghi câu gốc
  // tiếng Việt để người chấm đối chiếu ý.
  const scenes = provider === 'cloudflare' ? C01_SENTENCES_EN.slice(0, limit) : sentences;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const started = Date.now();
    try {
      const res = await generateImage(env, { content: scenes[i], provider, model });
      const seconds = (Date.now() - started) / 1000;
      await writeFile(join(outDir, `c01-${String(i + 1).padStart(2, '0')}.png`), res.image);
      results.push({
        index: i + 1,
        sentence,
        provider,
        model,
        success: true,
        durationSeconds: Math.round(seconds * 100) / 100,
        estimatedCostUsd: estimatedCost,
        relevance: null, // người chấm điền tay sau khi xem ảnh
        note: `Ảnh thật lưu ở results/${provider}/c01-${String(i + 1).padStart(2, '0')}.png. Cần chấm độ phù hợp 0-2 và phong cách doodle.${provider === 'cloudflare' ? ' Prompt gửi đi là bản dịch tiếng Anh của câu này.' : ''}`,
      });
      console.log(`[${i + 1}/${sentences.length}] OK ${seconds.toFixed(1)}s`);
    } catch (err) {
      const seconds = (Date.now() - started) / 1000;
      const message = err instanceof Error ? err.message : 'Lỗi không rõ';
      results.push({
        index: i + 1,
        sentence,
        provider,
        model,
        success: false,
        durationSeconds: Math.round(seconds * 100) / 100,
        estimatedCostUsd: null,
        relevance: null,
        note: `Lỗi (đã rút gọn, không chứa key/raw error): ${message}`,
      });
      console.log(`[${i + 1}/${sentences.length}] FAIL ${seconds.toFixed(1)}s — ${message}`);
    }
  }

  const ok = results.filter((r) => r.success).length;
  const totalCost = results
    .filter((r) => r.success && r.estimatedCostUsd !== null)
    .reduce((s, r) => s + (r.estimatedCostUsd ?? 0), 0);
  await mkdir(join(process.cwd(), 'results'), { recursive: true });
  await writeFile(join(process.cwd(), out), JSON.stringify({ provider, model, results }, null, 2));
  await writeFile(join(process.cwd(), out.replace(/\.json$/, '.csv')), toCsv(results));
  console.log(`\nC01 xong: ${ok}/${results.length} ảnh thành công. Chi phí ước tính: $${totalCost.toFixed(2)}. Kết quả: ${out}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
