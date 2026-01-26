/**
 * Database Connection Singleton
 * @see specs/01-foundation.md:L25-28
 * @see specs/phase2-plan.md:L230-235
 */

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * Extended globalThis type for singleton database connections.
 *
 * WHY THIS PATTERN EXISTS:
 * Next.js in development mode uses Fast Refresh (HMR), which re-executes module
 * code on every file change. Without caching connections on globalThis, each
 * hot reload would create a new SQLite connection, eventually exhausting file
 * descriptors or causing "database is locked" errors.
 *
 * The pattern:
 * 1. Store connections on globalThis (survives module re-execution)
 * 2. Only cache in development mode (production creates fresh connections)
 * 3. Check for existing connection before creating new one
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#storing-data-in-global-singletons
 */
type GlobalWithDb = typeof globalThis & {
  __kanbanDb?: BetterSQLite3Database<typeof schema>;
  __kanbanSqlite?: Database.Database;
};

function getDatabasePath(): string {
  const envPath = process.env.DATABASE_PATH ?? './data/kanban.db';
  return resolve(process.cwd(), envPath);
}

function ensureDatabaseDirectory(dbPath: string): void {
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function initializeSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      parent_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      sort_order REAL NOT NULL DEFAULT 0,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issue_sessions (
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      link_type TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (issue_id, session_id)
    );

    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS issue_labels (
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (issue_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      column_config TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_issues_parent ON issues(parent_id);
    CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
  `);
}

function createConnection(dbPath: string): Database.Database {
  ensureDatabaseDirectory(dbPath);

  const sqlite = new Database(dbPath);

  // SQLite requires explicit FK enforcement (disabled by default)
  sqlite.pragma('foreign_keys = ON');

  // WAL mode enables concurrent reads during writes
  sqlite.pragma('journal_mode = WAL');

  initializeSchema(sqlite);

  return sqlite;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  const globalWithDb = globalThis as GlobalWithDb;

  if (globalWithDb.__kanbanDb) {
    return globalWithDb.__kanbanDb;
  }

  const dbPath = getDatabasePath();
  const sqlite = createConnection(dbPath);
  const db = drizzle(sqlite, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalWithDb.__kanbanDb = db;
    globalWithDb.__kanbanSqlite = sqlite;
  }

  return db;
}

export function getSqlite(): Database.Database {
  const globalWithDb = globalThis as GlobalWithDb;

  if (globalWithDb.__kanbanSqlite) {
    return globalWithDb.__kanbanSqlite;
  }

  getDb();

  if (!globalWithDb.__kanbanSqlite) {
    throw new Error('Failed to initialize SQLite connection');
  }

  return globalWithDb.__kanbanSqlite;
}

export function closeDb(): void {
  const globalWithDb = globalThis as GlobalWithDb;

  if (globalWithDb.__kanbanSqlite) {
    globalWithDb.__kanbanSqlite.close();
    globalWithDb.__kanbanSqlite = undefined;
    globalWithDb.__kanbanDb = undefined;
  }
}


