import { Hono } from 'hono';
import { ulid } from 'ulid';
import { randomBytes } from 'node:crypto';
import { supabase, type ProjectRow, type UserRow } from '../db.js';
import { requireAuth } from '../auth.js';

export const projectsRoute = new Hono<{ Variables: { user: UserRow } }>();

projectsRoute.use('*', requireAuth);

function generateApiKey(): string {
  return 'phs_live_' + randomBytes(16).toString('hex');
}

function normalizeDomain(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return s || null;
}

function publicProject(p: ProjectRow) {
  return {
    id: p.id,
    apiKey: p.api_key,
    siteName: p.site_name,
    color: p.color,
    context: p.context ?? '',
    contextUrl: p.context_url ?? '',
    allowedDomain: p.allowed_domain ?? '',
    allowedPaths: p.allowed_paths ?? '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

projectsRoute.get('/', async (c) => {
  const user = c.get('user');
  const { data: rows } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return c.json({ projects: (rows ?? []).map(publicProject) });
});

projectsRoute.post('/', async (c) => {
  const user = c.get('user');
  type Body = { siteName?: string; color?: string; context?: string; contextUrl?: string; allowedDomain?: string; allowedPaths?: string };
  const body = await c.req.json<Body>().catch(() => ({} as Body));

  const siteName = (body.siteName ?? '').trim();
  if (!siteName) return c.json({ error: 'site_name_required' }, 400);

  const color = (body.color ?? '#f05c2a').trim();
  const context = (body.context ?? '').trim() || null;
  const contextUrl = (body.contextUrl ?? '').trim() || null;
  const allowedDomain = normalizeDomain(body.allowedDomain ?? '');
  const allowedPaths = (body.allowedPaths ?? '').trim() || null;

  const id = ulid();
  const apiKey = generateApiKey();
  const now = Date.now();

  await supabase.from('projects').insert({
    id,
    user_id: user.id,
    api_key: apiKey,
    site_name: siteName,
    color,
    context,
    context_url: contextUrl,
    allowed_domain: allowedDomain,
    allowed_paths: allowedPaths,
    created_at: now,
    updated_at: now,
  });

  const { data: row } = await supabase.from('projects').select('*').eq('id', id).single();
  return c.json({ project: publicProject(row as ProjectRow) });
});

projectsRoute.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const { data: existing } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!existing) return c.json({ error: 'not_found' }, 404);

  type Body = { siteName?: string; color?: string; context?: string; contextUrl?: string; allowedDomain?: string; allowedPaths?: string };
  const body = await c.req.json<Body>().catch(() => ({} as Body));

  const siteName = body.siteName !== undefined ? body.siteName.trim() || existing.site_name : existing.site_name;
  const color = body.color !== undefined ? body.color.trim() || existing.color : existing.color;
  const context = body.context !== undefined ? (body.context.trim() || null) : existing.context;
  const contextUrl = body.contextUrl !== undefined ? (body.contextUrl.trim() || null) : existing.context_url;
  const allowedDomain = body.allowedDomain !== undefined ? normalizeDomain(body.allowedDomain) : existing.allowed_domain;
  const allowedPaths = body.allowedPaths !== undefined ? (body.allowedPaths.trim() || null) : existing.allowed_paths;

  await supabase.from('projects').update({
    site_name: siteName,
    color,
    context,
    context_url: contextUrl,
    allowed_domain: allowedDomain,
    allowed_paths: allowedPaths,
    updated_at: Date.now(),
  }).eq('id', id);

  const { data: row } = await supabase.from('projects').select('*').eq('id', id).single();
  return c.json({ project: publicProject(row as ProjectRow) });
});

export async function findProjectByApiKey(apiKey: string): Promise<ProjectRow | null> {
  const { data } = await supabase.from('projects').select('*').eq('api_key', apiKey).single();
  return (data as ProjectRow) ?? null;
}
