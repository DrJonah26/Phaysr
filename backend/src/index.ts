import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { chatRoute } from './routes/chat.js';
import { ttsRoute } from './routes/tts.js';

const app = new Hono();

const allowed = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  '*',
  cors({
    origin: allowed.includes('*') ? '*' : allowed,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/', (c) => c.text('web-widget backend up'));
app.get('/health', (c) => c.json({ ok: true }));

app.route('/chat', chatRoute);
app.route('/tts', ttsRoute);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`backend listening on http://localhost:${info.port}`);
  console.log(`allowed origins: ${allowed.join(', ')}`);
});
