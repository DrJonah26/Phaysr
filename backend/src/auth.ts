import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { supabase, type UserRow } from './db.js';

const SESSION_COOKIE = 'phaysr_sid';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await supabase.from('sessions').insert({ token, user_id: userId, expires_at: expiresAt });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await supabase.from('sessions').delete().eq('token', token);
}

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export async function getUserFromRequest(c: Context): Promise<UserRow | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;

  const { data } = await supabase
    .from('sessions')
    .select('users(*)')
    .eq('token', token)
    .gt('expires_at', Date.now())
    .single();

  return (data?.users as unknown as UserRow) ?? null;
}

export function getSessionToken(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE);
}

export const requireAuth: MiddlewareHandler<{ Variables: { user: UserRow } }> = async (c, next) => {
  const user = await getUserFromRequest(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);
  c.set('user', user);
  await next();
};
