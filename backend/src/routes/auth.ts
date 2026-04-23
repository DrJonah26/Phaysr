import { Hono } from 'hono';
import { ulid } from 'ulid';
import { db, type UserRow } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  getUserFromRequest,
  getSessionToken,
  requireAuth,
} from '../auth.js';

export const authRoute = new Hono();

function publicUser(u: UserRow) {
  return { id: u.id, email: u.email };
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

authRoute.post('/signup', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({} as { email?: string; password?: string }));
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!isEmail(email)) return c.json({ error: 'invalid_email' }, 400);
  if (password.length < 8) return c.json({ error: 'password_too_short' }, 400);

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return c.json({ error: 'email_taken' }, 409);

  const id = ulid();
  const hash = await hashPassword(password);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
  ).run(id, email, hash, Date.now());

  const token = createSession(id);
  setSessionCookie(c, token);

  return c.json({ user: { id, email } });
});

authRoute.post('/signin', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({} as { email?: string; password?: string }));
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) return c.json({ error: 'invalid_credentials' }, 401);

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: 'invalid_credentials' }, 401);

  const token = createSession(user.id);
  setSessionCookie(c, token);

  return c.json({ user: publicUser(user) });
});

authRoute.post('/signout', async (c) => {
  const token = getSessionToken(c);
  if (token) destroySession(token);
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoute.get('/me', (c) => {
  const user = getUserFromRequest(c);
  if (!user) return c.json({ user: null });
  return c.json({ user: publicUser(user) });
});

export { requireAuth };
