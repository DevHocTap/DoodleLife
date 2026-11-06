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
  cloudflareApiToken: string | undefined;
  cloudflareAccountId: string | undefined;
  cloudflareModel: string;
}

const PROVIDERS: ImageProviderId[] = ['gemini', 'openai', 'stability', 'replicate', 'cloudflare'];

export function loadEnv(env: NodeJS.ProcessEnv = process.env): Env {
  // Provider mặc định là cloudflare (miễn phí, Sếp chốt 06/11/2026);
  // Gemini là đường nâng cấp trả phí, xem docs/c01-report.md.
  const raw = (env.IMAGE_PROVIDER ?? 'cloudflare').toLowerCase();
  const provider = (PROVIDERS as string[]).includes(raw)
    ? (raw as ImageProviderId)
    : 'cloudflare';
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
    cloudflareApiToken: env.CLOUDFLARE_API_TOKEN || undefined,
    cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID || undefined,
    cloudflareModel: env.CLOUDFLARE_MODEL || '@cf/black-forest-labs/flux-1-schnell',
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
    case 'cloudflare':
      return env.cloudflareApiToken;
  }
}
