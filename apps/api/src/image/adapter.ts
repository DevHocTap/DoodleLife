import {
  ApiErrorCode,
  buildDoodlePrompt,
  checkDoodlePrompt,
  type ImageProviderId,
} from '@doodlelife/shared';
import { apiKeyFor, type Env } from '../env.js';

/**
 * Adapter gọi API tạo ảnh (C03).
 *
 * Nguyên tắc:
 * - Prompt và model tách khỏi UI; prompt dùng doodle v1.
 * - Key chỉ đọc từ env, không hardcode, không log, không trả ra ngoài.
 * - Lỗi provider được map về mã lỗi chuẩn; raw error không lộ ra ngoài.
 * - Adapter này là bản Sprint 1: gọi đồng bộ (sync) cho Gemini/OpenAI/
 *   Stability; Replicate dùng polling theo đúng API async của nó.
 *   Tác vụ nền (job queue) nằm ở src/jobs, C05 sẽ nối vào.
 */

export interface GenerateInput {
  /** Nội dung nhật ký đã kiểm tra (1–500 ký tự). */
  content: string;
  provider: ImageProviderId;
  model: string;
}

export interface GenerateResult {
  /** Ảnh PNG/JPEG dạng Buffer. Caller lưu vào storage, không trả trực tiếp. */
  image: Buffer;
  mimeType: string;
  provider: ImageProviderId;
  model: string;
}

export class AdapterError extends Error {
  constructor(
    public readonly code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode],
    message: string,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export function validateContent(content: unknown): string {
  if (typeof content !== 'string') {
    throw new AdapterError(ApiErrorCode.INVALID_CONTENT, 'Nội dung nhật ký phải là chuỗi.');
  }
  const text = content.trim();
  if (text.length < 1 || text.length > 500) {
    throw new AdapterError(
      ApiErrorCode.INVALID_CONTENT,
      'Nội dung nhật ký phải từ 1 đến 500 ký tự.',
    );
  }
  return text;
}

function requireKey(env: Env, provider: ImageProviderId): string {
  const key = apiKeyFor(env, provider);
  if (!key) {
    throw new AdapterError(
      ApiErrorCode.PROVIDER_NOT_CONFIGURED,
      `Chưa cấu hình API key cho provider ${provider}. Xem apps/api/.env.example.`,
    );
  }
  return key;
}

function checkedPrompt(content: string): string {
  const prompt = buildDoodlePrompt(content);
  const check = checkDoodlePrompt(prompt);
  if (!check.ok) {
    throw new AdapterError(
      ApiErrorCode.INVALID_CONTENT,
      `Prompt không đạt chuẩn doodle v1: ${check.problems.join('; ')}`,
    );
  }
  return prompt;
}

/** Map HTTP status của provider về mã lỗi chuẩn (không lộ body gốc). */
function mapHttpError(status: number): (typeof ApiErrorCode)[keyof typeof ApiErrorCode] {
  if (status === 401 || status === 403) return ApiErrorCode.PROVIDER_REJECTED;
  if (status === 400 || status === 422 || status === 429) return ApiErrorCode.PROVIDER_REJECTED;
  return ApiErrorCode.PROVIDER_UNAVAILABLE;
}

async function generateWithGemini(env: Env, input: GenerateInput): Promise<GenerateResult> {
  const key = requireKey(env, 'gemini');
  const prompt = checkedPrompt(input.content);
  // Gemini API: generateContent với model image, trả inlineData base64.
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(key)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });
  } catch {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Không kết nối được tới Gemini API.');
  }
  if (!res.ok) {
    throw new AdapterError(mapHttpError(res.status), `Gemini API trả lỗi HTTP ${res.status}.`);
  }
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }>;
  };
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part?.inlineData) {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Gemini API không trả về ảnh.');
  }
  return {
    image: Buffer.from(part.inlineData.data, 'base64'),
    mimeType: part.inlineData.mimeType || 'image/png',
    provider: 'gemini',
    model: input.model,
  };
}

async function generateWithOpenAI(env: Env, input: GenerateInput): Promise<GenerateResult> {
  const key = requireKey(env, 'openai');
  const prompt = checkedPrompt(input.content);
  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: input.model, prompt, size: '1024x1024', quality: 'medium' }),
    });
  } catch {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Không kết nối được tới OpenAI API.');
  }
  if (!res.ok) {
    throw new AdapterError(mapHttpError(res.status), `OpenAI API trả lỗi HTTP ${res.status}.`);
  }
  const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'OpenAI API không trả về ảnh.');
  }
  return { image: Buffer.from(b64, 'base64'), mimeType: 'image/png', provider: 'openai', model: input.model };
}

async function generateWithStability(env: Env, input: GenerateInput): Promise<GenerateResult> {
  const key = requireKey(env, 'stability');
  const prompt = checkedPrompt(input.content);
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('output_format', 'png');
  let res: Response;
  try {
    res = await fetch(
      `https://api.stability.ai/v2beta/stable-image/generate/${encodeURIComponent(input.model)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${key}`, Accept: 'image/*' }, body: form },
    );
  } catch {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Không kết nối được tới Stability API.');
  }
  if (!res.ok) {
    throw new AdapterError(mapHttpError(res.status), `Stability API trả lỗi HTTP ${res.status}.`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return { image: buf, mimeType: 'image/png', provider: 'stability', model: input.model };
}

async function generateWithReplicate(env: Env, input: GenerateInput): Promise<GenerateResult> {
  const key = requireKey(env, 'replicate');
  const prompt = checkedPrompt(input.content);
  const headers = { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  let res: Response;
  try {
    res = await fetch(`https://api.replicate.com/v1/models/${input.model}/predictions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ input: { prompt } }),
    });
  } catch {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Không kết nối được tới Replicate API.');
  }
  if (!res.ok) {
    throw new AdapterError(mapHttpError(res.status), `Replicate API trả lỗi HTTP ${res.status}.`);
  }
  // Replicate là async mặc định: poll cho tới khi succeeded/failed.
  // Output URL của Replicate chỉ sống ~1 giờ nên caller phải tải ngay (C04).
  let pred = (await res.json()) as { id: string; status: string; urls?: { get: string }; output?: unknown };
  const deadline = Date.now() + 5 * 60 * 1000;
  while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
    if (Date.now() > deadline) {
      throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Replicate prediction quá thời gian chờ.');
    }
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(pred.urls?.get ?? `https://api.replicate.com/v1/predictions/${pred.id}`, { headers });
    if (!poll.ok) {
      throw new AdapterError(mapHttpError(poll.status), `Replicate API trả lỗi HTTP ${poll.status}.`);
    }
    pred = (await poll.json()) as typeof pred;
  }
  if (pred.status !== 'succeeded') {
    throw new AdapterError(ApiErrorCode.PROVIDER_REJECTED, 'Replicate prediction thất bại.');
  }
  const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  if (typeof out !== 'string') {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Replicate không trả về URL ảnh.');
  }
  const img = await fetch(out);
  if (!img.ok) {
    throw new AdapterError(ApiErrorCode.PROVIDER_UNAVAILABLE, 'Không tải được ảnh từ Replicate.');
  }
  return {
    image: Buffer.from(await img.arrayBuffer()),
    mimeType: 'image/png',
    provider: 'replicate',
    model: input.model,
  };
}

/** Điểm vào duy nhất: gọi provider đã chọn, trả ảnh hoặc ném AdapterError (mã chuẩn). */
export async function generateImage(env: Env, input: GenerateInput): Promise<GenerateResult> {
  const content = validateContent(input.content);
  const checked: GenerateInput = { ...input, content };
  switch (input.provider) {
    case 'gemini':
      return generateWithGemini(env, checked);
    case 'openai':
      return generateWithOpenAI(env, checked);
    case 'stability':
      return generateWithStability(env, checked);
    case 'replicate':
      return generateWithReplicate(env, checked);
  }
}
