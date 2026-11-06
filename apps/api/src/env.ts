import type { ImageProviderId } from '@doodlelife/shared';

/** Đọc cấu hình từ biến môi trường. Không hardcode key ở đây. */
export interface Env {
  port: number;
  provider: ImageProviderId;
  geminiApiKey: string | undefined;
  geminiModel: string;
  openaiApiKey: string | undefined;
  openaiModel: string;
  stabilityApiKey: string | undefined;
  stabilityModel: string;
  replicateToken: string | undefined;
  replicateModel: string;
}

const PROVIDERS: ImageProviderId[] = ['gemini', 'openai', 'stability', 'replicate'];

export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const raw = (env.IMAGE_PROVIDER ?? 'gemini').toLowerCase();
  const provider = (PROVIDERS as string[]).includes(raw)
    ? (raw as ImageProviderId)
    : 'gemini';
  return {
    port: Number(env.PORT ?? 3001),
    provider,
    geminiApiKey: env.GEMINI_API_KEY || undefined,
    geminiModel: env.GEMINI_MODEL || 'gemini-nano-banana-2.1',
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    openaiModel: env.OPENAI_MODEL || 'gpt-image-2',
    stabilityApiKey: env.STABILITY_API_KEY || undefined,
    stabilityModel: env.STABILITY_MODEL || 'sd3.5-flash',
    replicateToken: env.REPLICATE_API_TOKEN || undefined,
    replicateModel: env.REPLICATE_MODEL || 'black-forest-labs/flux-schnell',
  };
}

/** Key (nếu có) cho provider đã chọn, dùng để kiểm tra cấu hình trước khi gọi. */
export function apiKeyFor(env: Env, provider: ImageProviderId): string | undefined {
  switch (provider) {
    case 'gemini':
      return env.geminiApiKey;
    case 'openai':
      return env.openaiApiKey;
    case 'stability':
      return env.stabilityApiKey;
    case 'replicate':
      return env.replicateToken;
  }
}
