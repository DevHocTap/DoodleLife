/** Trạng thái của một image job (C03/C05). */
export type ImageJobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export type ImageProviderId = 'gemini' | 'openai' | 'stability' | 'replicate';

export interface ImageJob {
  id: string;
  entryId: string;
  ownerId: string;
  /** Câu nhật ký gốc (tiếng Việt). */
  content: string;
  /** Prompt đầy đủ đã gửi cho provider (đã ghép doodle v1). */
  prompt: string;
  provider: ImageProviderId;
  model: string;
  status: ImageJobStatus;
  /** Khóa storage riêng tư (ví dụ `owner/entry/image.png`), không phải URL tạm. */
  storageKey: string | null;
  /** Mã lỗi chuẩn khi thất bại, null khi thành công/chưa xong. */
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImageJobRequest {
  entryId: string;
  ownerId: string;
  /** Nội dung nhật ký đã kiểm tra (1–500 ký tự). */
  content: string;
  /** Ghi đè provider, mặc định lấy từ cấu hình server. */
  provider?: ImageProviderId;
}

export interface CreateImageJobResponse {
  job: ImageJob;
}

/** Một lần chạy thử nghiệm C01: một câu mẫu qua một provider. */
export interface C01Result {
  index: number;
  sentence: string;
  provider: ImageProviderId;
  model: string;
  /** true khi provider trả về ảnh thật. */
  success: boolean;
  /** Thời gian gọi API, tính bằng giây. */
  durationSeconds: number | null;
  /** Chi phí ước tính theo bảng giá tại thời điểm chạy, USD/ảnh. null khi chưa biết. */
  estimatedCostUsd: number | null;
  /** Độ phù hợp 0–2 do người chấm: 0 lệch hẳn, 1 đúng một phần, 2 đúng ý chính. */
  relevance: number | null;
  /** Ghi chú: có chữ lạ trong ảnh không, đúng phong cách doodle không... */
  note: string;
}
