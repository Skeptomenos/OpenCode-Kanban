/**
 * Test Database Utilities
 *
 * Provides a centralized in-memory SQLite database setup for integration tests.
 * Extracted from src/services/__tests__/issue-service.test.ts to avoid duplication.
 *
 * @see ralph-wiggum/specs/360-critical-fixes.md:L120-138
 *
 * Usage:
 * ```typescript
 * import { createTestDb } from '@/lib/db/test-utils';
 *
 * let db: BetterSQLite3Database<typeof schema>;
 * let sqlite: Database.Database;
 *
 * beforeEach(() => {
 *   const testDb = createTestDb();
 *   db = testDb.db;
 *   sqlite = testDb.sqlite;
 * });
 *
 * afterEach(() => {
 *   sqlite.close();
 * });
 * ```
 */

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export interface TestDbResult {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
}

/**
 * Creates an in-memory SQLite database with the full schema for testing.
 *
 * WHY IN-MEMORY:
 * - Tests run in isolation (no leftover data between runs)
 * - Fast (no disk I/O)
 * - No cleanup needed between test suites
 *
 * SCHEMA:
 * Mirrors the production schema from connection.ts:initializeSchema
 */
export function createTestDb(): TestDbResult {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE issues (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      parent_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'backlog',
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE issue_sessions (
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      link_type TEXT,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (issue_id, session_id)
    );

    CREATE TABLE labels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE TABLE issue_labels (
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
      PRIMARY KEY (issue_id, label_id)
    );

    CREATE TABLE boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      column_config TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX idx_issues_parent ON issues(parent_id);
    CREATE INDEX idx_issues_type ON issues(type);
    CREATE INDEX idx_issues_status ON issues(status);
  `);

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

export { schema };
export type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
export type { Database } from 'better-sqlite3';
