import { Router, type Request, type Response } from 'express';
import {
  ApiErrorCode,
  apiErrorBody,
  API_ERROR_HTTP_STATUS,
  buildDoodlePrompt,
  type CreateImageJobRequest,
} from '@doodlelife/shared';
import { AdapterError, validateContent } from '../image/adapter.js';
import type { JobStore } from '../jobs/store.js';
import type { Env } from '../env.js';

/**
 * POST /api/image-jobs (C03/C05).
 * Nhận nội dung nhật ký đã kiểm tra, tạo job và trả 202.
 * Chưa chạy generation đồng bộ ở endpoint này: job được xếp hàng để
 * worker xử lý nền (theo cơ chế đã xác minh ở C01). Khi chưa cấu hình
 * provider thì trả 501 PROVIDER_NOT_CONFIGURED thay vì lỗi lộn xộn.
 */
export function imageJobsRouter(env: Env, store: JobStore): Router {
  const router = Router();

  router.post('/', (req: Request, res: Response) => {
    const body = req.body as Partial<CreateImageJobRequest>;
    try {
      const content = validateContent(body.content);
      if (typeof body.entryId !== 'string' || !body.entryId.trim()) {
        res.status(400).json(apiErrorBody(ApiErrorCode.INVALID_CONTENT, 'Thiếu entryId.'));
        return;
      }
      if (typeof body.ownerId !== 'string' || !body.ownerId.trim()) {
        res.status(400).json(apiErrorBody(ApiErrorCode.INVALID_CONTENT, 'Thiếu ownerId.'));
        return;
      }
      const provider = body.provider ?? env.provider;
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
      // Lưu ý Sprint 1: provider cloudflare nhận cảnh tiếng Anh (xem
      // adapter). Nhật ký tiếng Việt ở đây cần bước dịch Việt → Anh
      // trước khi worker gọi Cloudflare — bước này sẽ làm ở C03/C05.
      const job = store.create({
        entryId: body.entryId.trim(),
        ownerId: body.ownerId.trim(),
        content,
        prompt: buildDoodlePrompt(content),
        provider,
        model,
      });
      res.status(202).json({ job });
    } catch (err) {
      if (err instanceof AdapterError) {
        const status = API_ERROR_HTTP_STATUS[err.code];
        res.status(status).json(apiErrorBody(err.code, err.message));
        return;
      }
      res.status(500).json(apiErrorBody(ApiErrorCode.INTERNAL, 'Lỗi nội bộ.'));
    }
  });

  router.get('/:id', (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const job = store.get(id);
    if (!job) {
      res.status(404).json(apiErrorBody(ApiErrorCode.JOB_NOT_FOUND, 'Không tìm thấy job.'));
      return;
    }
    res.json({ job });
  });

  return router;
}
