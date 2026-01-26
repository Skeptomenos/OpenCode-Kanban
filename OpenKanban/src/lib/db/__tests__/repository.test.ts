/**
 * PM Repository Tests (TDD Red Phase)
 * @see specs/02-repository.md:L35-44
 *
 * Tests for Issue CRUD operations, hierarchy, and cascade delete.
 * Uses in-memory SQLite for isolation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { z } from 'zod';
import * as schema from '../schema';
import { SqlitePMRepository } from '../repository';
import type { IPMRepository, CreateIssueInput } from '../repository';
import { ISSUE_STATUSES } from '@/lib/constants/statuses';

/**
 * Creates an in-memory SQLite database with schema for testing.
 * Each test gets a fresh database instance.
 */
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
      sort_order REAL NOT NULL DEFAULT 0,
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

describe('SqlitePMRepository', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let sqlite: Database.Database;
  let repo: IPMRepository;

  beforeEach(() => {
    const testDb = createTestDb();
    db = testDb.db;
    sqlite = testDb.sqlite;
    repo = new SqlitePMRepository(db);
  });

  afterEach(() => {
    sqlite.close();
  });

  // ===========================================================================
  // Issue CRUD Tests
  // ===========================================================================

  describe('createIssue', () => {
    it('creates an issue with required fields', () => {
      const input: CreateIssueInput = {
        type: 'task',
        title: 'Test Task',
      };

      const issue = repo.createIssue(input);

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      expect(issue.type).toBe('task');
      expect(issue.title).toBe('Test Task');
      expect(issue.status).toBe('backlog');
      expect(issue.parentId).toBeNull();
      expect(issue.description).toBeNull();
      expect(issue.createdAt).toBeGreaterThan(0);
      expect(issue.updatedAt).toBeGreaterThan(0);
    });

    it('creates an issue with optional fields', () => {
      const input: CreateIssueInput = {
        type: 'epic',
        title: 'Test Epic',
        description: 'Epic description',
        status: ISSUE_STATUSES.IN_PROGRESS,
        metadata: { priority: 'high', assignee: 'user123' },
      };

      const issue = repo.createIssue(input);

      expect(issue.type).toBe('epic');
      expect(issue.title).toBe('Test Epic');
      expect(issue.description).toBe('Epic description');
      expect(issue.status).toBe(ISSUE_STATUSES.IN_PROGRESS);
      expect(issue.metadata).toBe(JSON.stringify({ priority: 'high', assignee: 'user123' }));
    });

    it('generates unique IDs for each issue', () => {
      const issue1 = repo.createIssue({ type: 'task', title: 'Task 1' });
      const issue2 = repo.createIssue({ type: 'task', title: 'Task 2' });

      expect(issue1.id).not.toBe(issue2.id);
    });
  });

  describe('getIssue', () => {
    it('returns null for non-existent issue', () => {
      const result = repo.getIssue('non-existent-id');
      expect(result).toBeNull();
    });

    it('returns the issue when it exists', () => {
      const created = repo.createIssue({ type: 'task', title: 'My Task' });
      const found = repo.getIssue(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('My Task');
    });
  });

  describe('listIssues', () => {
    it('returns empty array when no issues exist', () => {
      const issues = repo.listIssues();
      expect(issues).toEqual([]);
    });

    it('returns all issues when no filter applied', () => {
      repo.createIssue({ type: 'project', title: 'Project 1' });
      repo.createIssue({ type: 'task', title: 'Task 1' });
      repo.createIssue({ type: 'epic', title: 'Epic 1' });

      const issues = repo.listIssues();
      expect(issues).toHaveLength(3);
    });

    it('filters by type', () => {
      repo.createIssue({ type: 'project', title: 'Project 1' });
      repo.createIssue({ type: 'task', title: 'Task 1' });
      repo.createIssue({ type: 'task', title: 'Task 2' });

      const tasks = repo.listIssues({ types: ['task'] });
      expect(tasks).toHaveLength(2);
      expect(tasks.every((i) => i.type === 'task')).toBe(true);
    });

    it('filters by status', () => {
      repo.createIssue({ type: 'task', title: 'Task 1', status: ISSUE_STATUSES.BACKLOG });
      repo.createIssue({ type: 'task', title: 'Task 2', status: ISSUE_STATUSES.IN_PROGRESS });
      repo.createIssue({ type: 'task', title: 'Task 3', status: ISSUE_STATUSES.DONE });

      const inProgress = repo.listIssues({ statuses: [ISSUE_STATUSES.IN_PROGRESS] });
      expect(inProgress).toHaveLength(1);
      expect(inProgress[0].title).toBe('Task 2');
    });

    it('filters by parentId', () => {
      const parent = repo.createIssue({ type: 'project', title: 'Project' });
      repo.createIssue({ type: 'task', title: 'Task 1', parentId: parent.id });
      repo.createIssue({ type: 'task', title: 'Task 2', parentId: parent.id });
      repo.createIssue({ type: 'task', title: 'Task 3' }); // No parent

      const children = repo.listIssues({ parentId: parent.id });
      expect(children).toHaveLength(2);
    });

    it('filters for root issues (parentId = null)', () => {
      const parent = repo.createIssue({ type: 'project', title: 'Project' });
      repo.createIssue({ type: 'task', title: 'Task 1', parentId: parent.id });
      repo.createIssue({ type: 'epic', title: 'Epic 1' }); // Root

      const roots = repo.listIssues({ parentId: null });
      expect(roots).toHaveLength(2);
      expect(roots.map((i) => i.title).sort()).toEqual(['Epic 1', 'Project']);
    });
  });

  describe('updateIssue', () => {
    it('throws when issue does not exist', () => {
      expect(() => repo.updateIssue('non-existent', { title: 'New Title' })).toThrow();
    });

    it('updates issue fields', () => {
      const created = repo.createIssue({ type: 'task', title: 'Original' });

      const updated = repo.updateIssue(created.id, {
        title: 'Updated Title',
        description: 'New description',
        status: ISSUE_STATUSES.IN_PROGRESS,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('New description');
      expect(updated.status).toBe(ISSUE_STATUSES.IN_PROGRESS);
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('preserves fields not included in update', () => {
      const created = repo.createIssue({
        type: 'task',
        title: 'Original',
        description: 'Original description',
      });

      const updated = repo.updateIssue(created.id, { title: 'New Title' });

      expect(updated.description).toBe('Original description');
      expect(updated.type).toBe('task');
    });
  });

  describe('deleteIssue', () => {
    it('throws when issue does not exist', () => {
      expect(() => repo.deleteIssue('non-existent')).toThrow();
    });

    it('deletes the issue', () => {
      const created = repo.createIssue({ type: 'task', title: 'To Delete' });
      repo.deleteIssue(created.id);

      const found = repo.getIssue(created.id);
      expect(found).toBeNull();
    });
  });

  // ===========================================================================
  // Hierarchy Tests
  // ===========================================================================

  describe('Issue Hierarchy', () => {
    it('creates child issues with parentId', () => {
      const parent = repo.createIssue({ type: 'project', title: 'Project' });
      const child = repo.createIssue({
        type: 'task',
        title: 'Child Task',
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);

      const retrieved = repo.getIssue(child.id);
      expect(retrieved?.parentId).toBe(parent.id);
    });

    it('supports multi-level hierarchy', () => {
      const project = repo.createIssue({ type: 'project', title: 'Project' });
      const epic = repo.createIssue({
        type: 'epic',
        title: 'Epic',
        parentId: project.id,
      });
      const task = repo.createIssue({
        type: 'task',
        title: 'Task',
        parentId: epic.id,
      });

      expect(project.parentId).toBeNull();
      expect(epic.parentId).toBe(project.id);
      expect(task.parentId).toBe(epic.id);
    });
  });

  // ===========================================================================
  // Cascade Delete Tests
  // ===========================================================================

  describe('Cascade Delete', () => {
    it('deletes child issues when parent is deleted', () => {
      const parent = repo.createIssue({ type: 'project', title: 'Project' });
      const child1 = repo.createIssue({ type: 'task', title: 'Task 1', parentId: parent.id });
      const child2 = repo.createIssue({ type: 'task', title: 'Task 2', parentId: parent.id });

      repo.deleteIssue(parent.id);

      expect(repo.getIssue(parent.id)).toBeNull();
      expect(repo.getIssue(child1.id)).toBeNull();
      expect(repo.getIssue(child2.id)).toBeNull();
    });

    it('cascades through multiple levels', () => {
      const project = repo.createIssue({ type: 'project', title: 'Project' });
      const epic = repo.createIssue({ type: 'epic', title: 'Epic', parentId: project.id });
      const task = repo.createIssue({ type: 'task', title: 'Task', parentId: epic.id });

      repo.deleteIssue(project.id);

      expect(repo.getIssue(project.id)).toBeNull();
      expect(repo.getIssue(epic.id)).toBeNull();
      expect(repo.getIssue(task.id)).toBeNull();
    });

    it('deletes session links when issue is deleted', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-1');
      repo.linkSession(issue.id, 'session-2');

      repo.deleteIssue(issue.id);

      // Verify session links are gone
      const links = repo.getSessionLinks(issue.id);
      expect(links).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Session Link Tests
  // ===========================================================================

  describe('linkSession', () => {
    it('links a session to an issue', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-123');

      const links = repo.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
      expect(links[0].sessionId).toBe('session-123');
    });

    it('links a session with a type', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-123', 'planning');

      const links = repo.getSessionLinks(issue.id);
      expect(links[0].linkType).toBe('planning');
    });

    it('allows multiple sessions per issue', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-1', 'planning');
      repo.linkSession(issue.id, 'session-2', 'execution');

      const links = repo.getSessionLinks(issue.id);
      expect(links).toHaveLength(2);
    });
  });

  describe('unlinkSession', () => {
    it('removes a session link', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-1');
      repo.linkSession(issue.id, 'session-2');

      repo.unlinkSession(issue.id, 'session-1');

      const links = repo.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
      expect(links[0].sessionId).toBe('session-2');
    });
  });

  describe('getIssueWithRelations', () => {
    it('returns null for non-existent issue', () => {
      const result = repo.getIssueWithRelations('non-existent');
      expect(result).toBeNull();
    });

    it('returns issue with session IDs', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });
      repo.linkSession(issue.id, 'session-1');
      repo.linkSession(issue.id, 'session-2');

      const withRelations = repo.getIssueWithRelations(issue.id);
      expect(withRelations?.sessionIds).toHaveLength(2);
      expect(withRelations?.sessionIds).toContain('session-1');
      expect(withRelations?.sessionIds).toContain('session-2');
    });

    it('returns issue with parsed metadata', () => {
      const issue = repo.createIssue({
        type: 'task',
        title: 'Task',
        metadata: { priority: 'high' },
      });

      const withRelations = repo.getIssueWithRelations(issue.id);
      expect(withRelations?.metadata).toEqual({ priority: 'high' });
    });

    it('returns empty metadata object when metadata is null', () => {
      const issue = repo.createIssue({ type: 'task', title: 'Task' });

      const withRelations = repo.getIssueWithRelations(issue.id);
      expect(withRelations?.metadata).toEqual({});
    });
  });

  // ===========================================================================
  // Config Tests
  // ===========================================================================

  describe('Config operations', () => {
    it('returns undefined for non-existent key', () => {
      const value = repo.getConfig('non-existent');
      expect(value).toBeUndefined();
    });

    it('sets and gets a config value', () => {
      repo.setConfig('test_key', { foo: 'bar', count: 42 });

      const value = repo.getConfig<{ foo: string; count: number }>('test_key');
      expect(value).toEqual({ foo: 'bar', count: 42 });
    });

    it('overwrites existing config value', () => {
      repo.setConfig('key', { original: true });
      repo.setConfig('key', { updated: true });

      const value = repo.getConfig('key');
      expect(value).toEqual({ updated: true });
    });

    it('deletes a config key', () => {
      repo.setConfig('to_delete', { value: 1 });
      repo.deleteConfig('to_delete');

      expect(repo.getConfig('to_delete')).toBeUndefined();
    });

    it('validates config value with Zod schema when provided', () => {
      const TestSchema = z.object({ foo: z.string(), count: z.number() }).strict();
      repo.setConfig('typed_key', { foo: 'bar', count: 42 });

      const value = repo.getConfig('typed_key', TestSchema);

      expect(value).toEqual({ foo: 'bar', count: 42 });
    });

    it('returns undefined when schema validation fails', () => {
      const StrictSchema = z.object({ required: z.string() }).strict();
      repo.setConfig('wrong_shape', { different: 'data' });

      const value = repo.getConfig('wrong_shape', StrictSchema);

      expect(value).toBeUndefined();
    });
  });

  // ===========================================================================
  // Board CRUD Tests
  // ===========================================================================

  describe('Board CRUD', () => {
    it('creates a board with required fields', () => {
      const board = repo.createBoard({ name: 'Sprint Board' });

      expect(board.id).toBeDefined();
      expect(board.name).toBe('Sprint Board');
      expect(board.filters).toEqual({});
      expect(board.columnConfig).toEqual([]);
    });

    it('creates a board with filters and columns', () => {
      const board = repo.createBoard({
        name: 'Task Board',
        filters: { types: ['task'], statuses: [ISSUE_STATUSES.BACKLOG, ISSUE_STATUSES.IN_PROGRESS] },
        columnConfig: [
          { id: 'col-1', title: 'To Do', statusMappings: [ISSUE_STATUSES.BACKLOG] },
          { id: 'col-2', title: 'Doing', statusMappings: [ISSUE_STATUSES.IN_PROGRESS] },
        ],
      });

      expect(board.filters).toEqual({ types: ['task'], statuses: [ISSUE_STATUSES.BACKLOG, ISSUE_STATUSES.IN_PROGRESS] });
      expect(board.columnConfig).toHaveLength(2);
    });

    it('gets a board by ID', () => {
      const created = repo.createBoard({ name: 'Test Board' });
      const found = repo.getBoard(created.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Board');
    });

    it('returns null for non-existent board', () => {
      const found = repo.getBoard('non-existent');
      expect(found).toBeNull();
    });

    it('lists all boards', () => {
      repo.createBoard({ name: 'Board 1' });
      repo.createBoard({ name: 'Board 2' });

      const boards = repo.listBoards();
      expect(boards).toHaveLength(2);
    });

    it('updates a board', () => {
      const created = repo.createBoard({ name: 'Original' });
      const updated = repo.updateBoard(created.id, {
        name: 'Updated',
        filters: { types: ['epic'] },
      });

      expect(updated.name).toBe('Updated');
      expect(updated.filters).toEqual({ types: ['epic'] });
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });

    it('throws when updating non-existent board', () => {
      expect(() => repo.updateBoard('non-existent', { name: 'New' })).toThrow();
    });

    it('deletes a board', () => {
      const created = repo.createBoard({ name: 'To Delete' });
      repo.deleteBoard(created.id);

      expect(repo.getBoard(created.id)).toBeNull();
    });

    it('throws when deleting non-existent board', () => {
      expect(() => repo.deleteBoard('non-existent')).toThrow();
    });
  });
});
