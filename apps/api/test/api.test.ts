import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server } from 'node:http';
import { createApp } from '../src/app.js';

async function withServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  const app = createApp();
  const server: Server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  try {
    return await fn(port);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('GET /health trả ok', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { ok: boolean; service: string };
    assert.equal(body.ok, true);
    assert.equal(body.service, 'doodlelife-api');
  });
});

test('POST /api/image-jobs: thiếu nội dung thì trả 400 INVALID_CONTENT', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/image-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: 'e1', ownerId: 'u1', content: '   ' }),
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, 'INVALID_CONTENT');
  });
});

test('POST /api/image-jobs: nội dung hợp lệ thì trả 202 và job queued', async () => {
  await withServer(async (port) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/image-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entryId: 'e1',
        ownerId: 'u1',
        content: 'Sáng nay tôi đạp xe qua cầu, gió mát.',
      }),
    });
    assert.equal(res.status, 202);
    const body = (await res.json()) as { job: { status: string; provider: string } };
    assert.equal(body.job.status, 'queued');
    assert.ok(body.job.provider);
  });
});
