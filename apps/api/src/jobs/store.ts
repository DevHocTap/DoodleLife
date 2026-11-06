import type { ImageJob, ImageJobStatus, ImageProviderId } from '@doodlelife/shared';

/**
 * Job store cho Sprint 1 (C05).
 *
 * Bản scaffold dùng bộ nhớ trong (in-memory) để chạy được ngay mà không cần
 * DB. Bản production dùng bảng `image_jobs` trong PostgreSQL — xem
 * `docs/sql/jobs.sql` — với cùng các trường và chuyển trạng thái này.
 * Quy tắc quan trọng: khi AI lỗi, job ghi `failed` nhưng entry nhật ký
 * vẫn tồn tại (C05); job không bao giờ xóa entry.
 */
export class JobStore {
  private jobs = new Map<string, ImageJob>();

  create(input: {
    entryId: string;
    ownerId: string;
    content: string;
    prompt: string;
    provider: ImageProviderId;
    model: string;
  }): ImageJob {
    const now = new Date().toISOString();
    const job: ImageJob = {
      id: `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      status: 'queued',
      storageKey: null,
      errorCode: null,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string): ImageJob | undefined {
    return this.jobs.get(id);
  }

  update(id: string, patch: Partial<Pick<ImageJob, 'status' | 'storageKey' | 'errorCode'>>): ImageJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const next: ImageJob = { ...job, ...patch, updatedAt: new Date().toISOString() };
    this.jobs.set(id, next);
    return next;
  }

  listByOwner(ownerId: string): ImageJob[] {
    return [...this.jobs.values()].filter((j) => j.ownerId === ownerId);
  }
}

export type { ImageJobStatus };
