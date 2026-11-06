import assert from 'node:assert/strict';
import test from 'node:test';
import { C01_SENTENCES } from '../src/c01-sentences.js';
import {
  buildDoodlePrompt,
  checkDoodlePrompt,
  DOODLE_PROMPT_VERSION,
  DOODLE_V1_PALETTE,
  DOODLE_V1_STYLE,
} from '../src/prompts/doodle-v1.js';
import { ApiErrorCode } from '../src/errors.js';

test('doodle v1: prompt luôn chứa nét viền dày, bảng màu cố định, nền đồng màu', () => {
  const check = checkDoodlePrompt(DOODLE_V1_STYLE);
  assert.equal(check.ok, true, check.problems.join('; '));
  assert.ok(DOODLE_V1_STYLE.toLowerCase().includes('thick'));
  assert.ok(DOODLE_V1_STYLE.toLowerCase().includes('solid'));
  assert.equal(DOODLE_V1_PALETTE.length, 6);
  assert.equal(DOODLE_PROMPT_VERSION, 'doodle-v1');
});

test('doodle v1: prompt không yêu cầu chữ trong ảnh', () => {
  const check = checkDoodlePrompt(DOODLE_V1_STYLE);
  assert.equal(check.ok, true);
  assert.ok(DOODLE_V1_STYLE.toLowerCase().includes('no text'));
  assert.ok(!/render text|draw text|write text/i.test(DOODLE_V1_STYLE));
});

test('doodle v1: 20 câu mẫu đều ghép được prompt hợp lệ, không chứa yêu cầu chữ', () => {
  assert.equal(C01_SENTENCES.length, 20);
  for (const sentence of C01_SENTENCES) {
    const prompt = buildDoodlePrompt(sentence);
    const check = checkDoodlePrompt(prompt);
    assert.equal(check.ok, true, `câu "${sentence}" -> ${check.problems.join('; ')}`);
    assert.ok(prompt.includes(sentence.trim().slice(0, 20)));
  }
});

test('mã lỗi chuẩn: không có mã nào để lộ secret', () => {
  const codes = Object.values(ApiErrorCode);
  assert.ok(codes.includes('PROVIDER_NOT_CONFIGURED'));
  assert.ok(codes.includes('PROVIDER_REJECTED'));
  assert.ok(!codes.some((c) => /key|secret|token/i.test(c)));
});
