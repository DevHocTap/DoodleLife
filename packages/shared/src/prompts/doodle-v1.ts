/**
 * Doodle prompt v1 (C02) — chuẩn hóa phong cách sticker DoodleLife.
 *
 * Yêu cầu nghiệm thu C02:
 * - Nét viền dày (thick outline)
 * - Bảng màu cố định
 * - KHÔNG yêu cầu chữ trong ảnh (không render text)
 * - Nền đồng màu được chấp nhận; không phụ thuộc tách nền
 *
 * Prompt đầy đủ luôn được ghép từ câu nhật ký + phần style cố định này,
 * tách khỏi UI (C03). Muốn đổi phong cách thì tạo version mới (v2),
 * không sửa v1 để kết quả cũ còn đối chiếu được.
 */

export const DOODLE_PROMPT_VERSION = 'doodle-v1' as const;

/** Bảng màu cố định của doodle v1 (6 màu). */
export const DOODLE_V1_PALETTE = [
  '#FFD23F', // vàng nắng
  '#FF6B6B', // đỏ san hô
  '#4ECDC4', // xanh ngọc
  '#6C9EE8', // xanh dương
  '#FF9F43', // cam
  '#2D2A32', // than chì (màu viền)
] as const;

/** Nền đồng màu mặc định của sticker. */
export const DOODLE_V1_BACKGROUND = '#FFF6E5'; // kem ấm

/**
 * Phần style cố định, bằng tiếng Anh để provider hiểu ổn định.
 * KHÔNG chứa yêu cầu render chữ.
 */
export const DOODLE_V1_STYLE = [
  'Cute hand-drawn doodle sticker illustration,',
  'thick bold black outline, flat colors, simple shapes,',
  'playful and warm, minimal details,',
  'using only this fixed palette: warm yellow #FFD23F, coral red #FF6B6B,',
  'teal #4ECDC4, soft blue #6C9EE8, orange #FF9F43, charcoal #2D2A32,',
  'on a solid warm cream background #FFF6E5,',
  'no text, no letters, no words, no watermark,',
  'single centered subject, clean composition.',
].join(' ');

/**
 * Ghép prompt đầy đủ từ câu nhật ký tiếng Việt.
 * Câu nhật ký được dịch ý sang tiếng Anh trong phần mô tả cảnh để
 * provider bám ý tốt hơn; phần style giữ nguyên tiếng Anh.
 * Lưu ý: Gemini 3 Pro/Flash Image hỗ trợ tiếng Việt (vi-VN) trực tiếp,
 * nên với provider Gemini có thể gửi câu gốc; hàm này vẫn giữ bản
 * tiếng Anh làm fallback chung cho mọi provider.
 */
export function buildDoodlePrompt(content: string): string {
  const scene = content.trim().replace(/\s+/g, ' ');
  return `${DOODLE_V1_STYLE} Scene: ${scene}`;
}

/**
 * Kiểm tra một prompt có thỏa chuẩn doodle v1 không.
 * Dùng trong test và trong adapter trước khi gọi provider.
 */
export function checkDoodlePrompt(prompt: string): { ok: boolean; problems: string[] } {
  const lower = prompt.toLowerCase();
  const problems: string[] = [];
  if (!lower.includes('thick')) problems.push('thiếu nét viền dày (thick outline)');
  if (!lower.includes('no text')) problems.push('thiếu yêu cầu không có chữ (no text)');
  if (!lower.includes('#ffd23f') || !lower.includes('#4ecdc4')) {
    problems.push('thiếu bảng màu cố định');
  }
  if (!lower.includes('solid')) problems.push('thiếu yêu cầu nền đồng màu');
  // Prompt v1 không được yêu cầu render chữ dưới bất kỳ dạng nào.
  if (/\b(render|draw|write|include|add)\b[^.]{0,40}\btext\b/.test(lower)) {
    problems.push('prompt yêu cầu chữ trong ảnh, vi phạm v1');
  }
  return { ok: problems.length === 0, problems };
}
