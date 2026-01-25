import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../lib/db/schema';
import { SqlitePMRepository } from '../../lib/db/repository';
import type { IPMRepository, CreateBoardInput } from '../../lib/db/repository';
import { BoardService } from '../board-service';

function createTestDb(): {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
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

describe('BoardService', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let sqlite: Database.Database;
  let repo: IPMRepository;
  let service: BoardService;

  beforeEach(() => {
    const testDb = createTestDb();
    db = testDb.db;
    sqlite = testDb.sqlite;
    repo = new SqlitePMRepository(db);
    service = new BoardService(repo);
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('createBoard', () => {
    it('creates a board with minimal input', () => {
      const input: CreateBoardInput = {
        name: 'Test Board',
      };

      const board = service.createBoard(input);

      expect(board).toBeDefined();
      expect(board.id).toBeDefined();
      expect(board.name).toBe('Test Board');
      expect(board.filters).toEqual({});
      expect(board.columnConfig).toEqual([]);
    });

    it('creates a board with filters and columns', () => {
      const input: CreateBoardInput = {
        name: 'Full Board',
        filters: { types: ['task'], statuses: ['backlog', 'in_progress'] },
        columnConfig: [
          { id: 'col-1', title: 'Backlog', statusMappings: ['backlog'] },
          { id: 'col-2', title: 'In Progress', statusMappings: ['in_progress'] },
        ],
      };

      const board = service.createBoard(input);

      expect(board.name).toBe('Full Board');
      expect(board.filters).toEqual({ types: ['task'], statuses: ['backlog', 'in_progress'] });
      expect(board.columnConfig).toHaveLength(2);
      expect(board.columnConfig[0].title).toBe('Backlog');
    });
  });

  describe('listBoards', () => {
    it('returns empty array when no boards exist', () => {
      const boards = service.listBoards();
      expect(boards).toEqual([]);
    });

    it('returns all boards', () => {
      service.createBoard({ name: 'Board 1' });
      service.createBoard({ name: 'Board 2' });
      service.createBoard({ name: 'Board 3' });

      const boards = service.listBoards();

      expect(boards).toHaveLength(3);
    });
  });

  describe('getBoard', () => {
    it('returns null for non-existent board', () => {
      const result = service.getBoard('non-existent-id');
      expect(result).toBeNull();
    });

    it('returns the board when it exists', () => {
      const created = service.createBoard({ name: 'Get Test' });

      const found = service.getBoard(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Get Test');
    });

    it('returns board with parsed filters and columnConfig', () => {
      const created = service.createBoard({
        name: 'Parsed Board',
        filters: { types: ['epic'] },
        columnConfig: [{ id: 'c1', title: 'Todo', statusMappings: ['backlog'] }],
      });

      const found = service.getBoard(created.id);

      expect(found?.filters).toEqual({ types: ['epic'] });
      expect(found?.columnConfig).toEqual([{ id: 'c1', title: 'Todo', statusMappings: ['backlog'] }]);
    });
  });

  describe('updateBoard', () => {
    it('throws when board does not exist', () => {
      expect(() => service.updateBoard('non-existent', { name: 'New' })).toThrow();
    });

    it('updates board name', () => {
      const created = service.createBoard({ name: 'Original' });

      const updated = service.updateBoard(created.id, { name: 'Updated Name' });

      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('updates board filters', () => {
      const created = service.createBoard({ name: 'Filter Test' });

      const updated = service.updateBoard(created.id, {
        filters: { types: ['bug'], statuses: ['done'] },
      });

      expect(updated.filters).toEqual({ types: ['bug'], statuses: ['done'] });
    });

    it('updates board columnConfig', () => {
      const created = service.createBoard({ name: 'Column Test' });

      const updated = service.updateBoard(created.id, {
        columnConfig: [
          { id: 'new-col', title: 'New Column', statusMappings: ['backlog'] },
        ],
      });

      expect(updated.columnConfig).toHaveLength(1);
      expect(updated.columnConfig[0].title).toBe('New Column');
    });
  });

  describe('deleteBoard', () => {
    it('throws when board does not exist', () => {
      expect(() => service.deleteBoard('non-existent')).toThrow();
    });

    it('deletes the board', () => {
      const created = service.createBoard({ name: 'To Delete' });

      service.deleteBoard(created.id);

      expect(service.getBoard(created.id)).toBeNull();
    });
  });
});
