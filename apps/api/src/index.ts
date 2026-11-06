import 'dotenv/config';
import { createApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const app = createApp(env);
app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`DoodleLife API listening on http://localhost:${env.port} (provider: ${env.provider})`);
});
