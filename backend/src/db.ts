import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DB_PATH = resolve(process.cwd(), 'data', 'phaysr.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY,
  email               TEXT UNIQUE NOT NULL,
  password_hash       TEXT NOT NULL,
  created_at          INTEGER NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'inactive'
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS projects (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key        TEXT UNIQUE NOT NULL,
  site_name      TEXT NOT NULL,
  color          TEXT NOT NULL DEFAULT '#f05c2a',
  context        TEXT,
  context_url    TEXT,
  allowed_domain TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);
`);

// Migrations for existing DBs
try { db.exec(`ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'inactive'`); } catch { /* exists */ }
try { db.exec(`ALTER TABLE projects ADD COLUMN allowed_domain TEXT`); } catch { /* exists */ }

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  subscription_status: 'active' | 'inactive';
}

export interface ProjectRow {
  id: string;
  user_id: string;
  api_key: string;
  site_name: string;
  color: string;
  context: string | null;
  context_url: string | null;
  allowed_domain: string | null;
  created_at: number;
  updated_at: number;
}
