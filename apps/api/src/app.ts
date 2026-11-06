import express, { type Express } from 'express';
import { loadEnv } from './env.js';
import { JobStore } from './jobs/store.js';
import { imageJobsRouter } from './routes/image-jobs.js';

/** Tạo Express app (không listen) — dùng chung cho server thật và test. */
export function createApp(env = loadEnv()): Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  const store = new JobStore();

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'doodlelife-api', provider: env.provider });
  });

  app.use('/api/image-jobs', imageJobsRouter(env, store));
  return app;
}
