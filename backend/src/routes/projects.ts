import { Hono } from 'hono';
import { ulid } from 'ulid';
import { randomBytes } from 'node:crypto';
import { db, type ProjectRow, type UserRow } from '../db.js';
import { requireAuth } from '../auth.js';

export const projectsRoute = new Hono<{ Variables: { user: UserRow } }>();

projectsRoute.use('*', requireAuth);

function generateApiKey(): string {
  return 'phs_live_' + randomBytes(16).toString('hex');
}

function publicProject(p: ProjectRow) {
  return {
    id: p.id,
    apiKey: p.api_key,
    siteName: p.site_name,
    color: p.color,
    context: p.context ?? '',
    contextUrl: p.context_url ?? '',
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

projectsRoute.get('/', (c) => {
  const user = c.get('user');
  const rows = db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
    .all(user.id) as ProjectRow[];
  return c.json({ projects: rows.map(publicProject) });
});

projectsRoute.post('/', async (c) => {
  const user = c.get('user');
  type Body = { siteName?: string; color?: string; context?: string; contextUrl?: string };
  const body = await c.req.json<Body>().catch(() => ({} as Body));

  const siteName = (body.siteName ?? '').trim();
  if (!siteName) return c.json({ error: 'site_name_required' }, 400);

  const color = (body.color ?? '#f05c2a').trim();
  const context = (body.context ?? '').trim() || null;
  const contextUrl = (body.contextUrl ?? '').trim() || null;

  const id = ulid();
  const apiKey = generateApiKey();
  const now = Date.now();

  db.prepare(
    `INSERT INTO projects (id, user_id, api_key, site_name, color, context, context_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, user.id, apiKey, siteName, color, context, contextUrl, now, now);

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow;
  return c.json({ project: publicProject(row) });
});

projectsRoute.patch('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const existing = db
    .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .get(id, user.id) as ProjectRow | undefined;
  if (!existing) return c.json({ error: 'not_found' }, 404);

  type Body = { siteName?: string; color?: string; context?: string; contextUrl?: string };
  const body = await c.req.json<Body>().catch(() => ({} as Body));

  const siteName = body.siteName !== undefined ? body.siteName.trim() || existing.site_name : existing.site_name;
  const color = body.color !== undefined ? body.color.trim() || existing.color : existing.color;
  const context = body.context !== undefined ? (body.context.trim() || null) : existing.context;
  const contextUrl = body.contextUrl !== undefined ? (body.contextUrl.trim() || null) : existing.context_url;

  db.prepare(
    `UPDATE projects SET site_name = ?, color = ?, context = ?, context_url = ?, updated_at = ? WHERE id = ?`,
  ).run(siteName, color, context, contextUrl, Date.now(), id);

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow;
  return c.json({ project: publicProject(row) });
});

export function findProjectByApiKey(apiKey: string): ProjectRow | null {
  const row = db.prepare('SELECT * FROM projects WHERE api_key = ?').get(apiKey) as
    | ProjectRow
    | undefined;
  return row ?? null;
}
