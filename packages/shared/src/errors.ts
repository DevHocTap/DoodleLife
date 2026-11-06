/**
 * Mã lỗi chuẩn cho toàn bộ DoodleLife (C03).
 * API chỉ trả các mã này kèm message an toàn, KHÔNG bao giờ trả
 * raw error của provider hay API key ra ngoài.
 */
export const ApiErrorCode = {
  /** Nội dung nhật ký không hợp lệ (rỗng, quá dài, chứa nội dung cấm). */
  INVALID_CONTENT: 'INVALID_CONTENT',
  /** Thiếu cấu hình provider (chưa có API key). */
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  /** Provider từ chối yêu cầu (lỗi 4xx, kiểm duyệt, quota...). */
  PROVIDER_REJECTED: 'PROVIDER_REJECTED',
  /** Provider lỗi phía server hoặc timeout. */
  PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
  /** Job không tồn tại. */
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  /** Lỗi nội bộ không xác định. */
  INTERNAL: 'INTERNAL',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** HTTP status tương ứng cho mỗi mã lỗi chuẩn. */
export const API_ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  INVALID_CONTENT: 400,
  PROVIDER_NOT_CONFIGURED: 501,
  PROVIDER_REJECTED: 502,
  PROVIDER_UNAVAILABLE: 502,
  JOB_NOT_FOUND: 404,
  INTERNAL: 500,
};

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    /** Message an toàn, không chứa secret hay raw error của provider. */
    message: string;
  };
}

export function apiErrorBody(code: ApiErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}
