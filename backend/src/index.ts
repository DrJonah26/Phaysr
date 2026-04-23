import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { chatRoute } from './routes/chat.js';
import { ttsRoute } from './routes/tts.js';
import { authRoute } from './routes/auth.js';
import { projectsRoute } from './routes/projects.js';
import './db.js';

const app = new Hono();

const allowed = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim());

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      if (allowed.includes('*')) return origin;
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.get('/', (c) => c.text('web-widget backend up'));
app.get('/health', (c) => c.json({ ok: true }));

app.route('/auth', authRoute);
app.route('/projects', projectsRoute);
app.route('/chat', chatRoute);
app.route('/tts', ttsRoute);

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`backend listening on http://localhost:${info.port}`);
  console.log(`allowed origins: ${allowed.join(', ')}`);
});
