import { Hono } from 'hono';
import { ulid } from 'ulid';
import { supabase, type UserRow } from '../db.js';
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
  return {
    id: u.id,
    email: u.email,
    subscriptionStatus: u.subscription_status,
    trialStartedAt: u.trial_started_at,
  };
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

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) return c.json({ error: 'email_taken' }, 409);

  const id = ulid();
  const hash = await hashPassword(password);
  const now = Date.now();
  await supabase.from('users').insert({
    id,
    email,
    password_hash: hash,
    created_at: now,
    subscription_status: 'trial',
    trial_started_at: now,
  });

  const token = await createSession(id);
  setSessionCookie(c, token);

  return c.json({
    user: publicUser({
      id,
      email,
      password_hash: hash,
      created_at: now,
      subscription_status: 'trial',
      trial_started_at: now,
      stripe_customer_id: null,
    }),
  });
});

authRoute.post('/signin', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({} as { email?: string; password?: string }));
  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user) return c.json({ error: 'invalid_credentials' }, 401);

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: 'invalid_credentials' }, 401);

  const token = await createSession(user.id);
  setSessionCookie(c, token);

  return c.json({ user: publicUser(user as UserRow) });
});

authRoute.post('/signout', async (c) => {
  const token = getSessionToken(c);
  if (token) await destroySession(token);
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoute.get('/me', async (c) => {
  const user = await getUserFromRequest(c);
  if (!user) return c.json({ user: null });
  return c.json({ user: publicUser(user) });
});

export { requireAuth };
