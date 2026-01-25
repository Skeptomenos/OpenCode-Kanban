import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../lib/db/schema';
import { SqlitePMRepository } from '../../lib/db/repository';
import type { IPMRepository, CreateIssueInput } from '../../lib/db/repository';
import { IssueService } from '../issue-service';

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

describe('IssueService', () => {
  let db: BetterSQLite3Database<typeof schema>;
  let sqlite: Database.Database;
  let repo: IPMRepository;
  let service: IssueService;

  beforeEach(() => {
    const testDb = createTestDb();
    db = testDb.db;
    sqlite = testDb.sqlite;
    repo = new SqlitePMRepository(db);
    service = new IssueService(repo, 'test-owner');
  });

  afterEach(() => {
    sqlite.close();
  });

  describe('createIssue', () => {
    it('creates an issue and persists to DB', () => {
      const input: CreateIssueInput = {
        type: 'task',
        title: 'Service Test Task',
      };

      const issue = service.createIssue(input);

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      expect(issue.type).toBe('task');
      expect(issue.title).toBe('Service Test Task');
      expect(issue.status).toBe('backlog');
    });

    it('creates an issue with all optional fields', () => {
      const input: CreateIssueInput = {
        type: 'epic',
        title: 'Full Epic',
        description: 'Epic description',
        status: 'in_progress',
        metadata: { priority: 'high' },
      };

      const issue = service.createIssue(input);

      expect(issue.description).toBe('Epic description');
      expect(issue.status).toBe('in_progress');
      expect(issue.metadata).toBe(JSON.stringify({ priority: 'high' }));
    });
  });

  describe('listIssues', () => {
    it('returns all issues when no filter applied', () => {
      service.createIssue({ type: 'task', title: 'Task 1' });
      service.createIssue({ type: 'task', title: 'Task 2' });
      service.createIssue({ type: 'epic', title: 'Epic 1' });

      const issues = service.listIssues();

      expect(issues).toHaveLength(3);
    });

    it('filters issues by type', () => {
      service.createIssue({ type: 'task', title: 'Task 1' });
      service.createIssue({ type: 'task', title: 'Task 2' });
      service.createIssue({ type: 'epic', title: 'Epic 1' });

      const tasks = service.listIssues({ types: ['task'] });

      expect(tasks).toHaveLength(2);
      expect(tasks.every((i) => i.type === 'task')).toBe(true);
    });

    it('filters issues by status', () => {
      service.createIssue({ type: 'task', title: 'Task 1', status: 'backlog' });
      service.createIssue({ type: 'task', title: 'Task 2', status: 'in_progress' });

      const inProgress = service.listIssues({ statuses: ['in_progress'] });

      expect(inProgress).toHaveLength(1);
      expect(inProgress[0].title).toBe('Task 2');
    });
  });

  describe('getIssue', () => {
    it('returns null for non-existent issue', () => {
      const result = service.getIssue('non-existent-id');
      expect(result).toBeNull();
    });

    it('returns the issue when it exists', () => {
      const created = service.createIssue({ type: 'task', title: 'Get Test' });

      const found = service.getIssue(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('Get Test');
    });
  });

  describe('getIssueWithRelations', () => {
    it('returns null for non-existent issue', () => {
      const result = service.getIssueWithRelations('non-existent');
      expect(result).toBeNull();
    });

    it('returns issue with parsed metadata', () => {
      const created = service.createIssue({
        type: 'task',
        title: 'Relations Test',
        metadata: { foo: 'bar' },
      });

      const withRelations = service.getIssueWithRelations(created.id);

      expect(withRelations?.metadata).toEqual({ foo: 'bar' });
      expect(withRelations?.sessionIds).toEqual([]);
      expect(withRelations?.labelIds).toEqual([]);
    });
  });

  describe('updateIssue', () => {
    it('throws when issue does not exist', () => {
      expect(() => service.updateIssue('non-existent', { title: 'New' })).toThrow();
    });

    it('updates issue fields', () => {
      const created = service.createIssue({ type: 'task', title: 'Original' });

      const updated = service.updateIssue(created.id, {
        title: 'Updated Title',
        status: 'done',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('done');
      expect(updated.updatedAt).toBeGreaterThan(created.updatedAt);
    });
  });

  describe('deleteIssue', () => {
    it('throws when issue does not exist', () => {
      expect(() => service.deleteIssue('non-existent')).toThrow();
    });

    it('deletes the issue', () => {
      const created = service.createIssue({ type: 'task', title: 'To Delete' });

      service.deleteIssue(created.id);

      expect(service.getIssue(created.id)).toBeNull();
    });
  });

  describe('getSessionLinks', () => {
    it('returns empty array for issue with no linked sessions', () => {
      const issue = service.createIssue({ type: 'task', title: 'No Sessions' });

      const links = service.getSessionLinks(issue.id);

      expect(links).toEqual([]);
    });

    it('returns all linked sessions for an issue', () => {
      const issue = service.createIssue({ type: 'task', title: 'With Sessions' });
      service.linkSession(issue.id, 'session-1', 'planning');
      service.linkSession(issue.id, 'session-2', 'execution');

      const links = service.getSessionLinks(issue.id);

      expect(links).toHaveLength(2);
      expect(links.map((l) => l.sessionId)).toContain('session-1');
      expect(links.map((l) => l.sessionId)).toContain('session-2');
    });
  });

  describe('linkSession', () => {
    it('links a session to an issue', () => {
      const issue = service.createIssue({ type: 'task', title: 'Link Test' });

      service.linkSession(issue.id, 'session-abc');

      const links = service.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
      expect(links[0].sessionId).toBe('session-abc');
      expect(links[0].issueId).toBe(issue.id);
    });

    it('links a session with a link type', () => {
      const issue = service.createIssue({ type: 'task', title: 'Link Type Test' });

      service.linkSession(issue.id, 'session-xyz', 'planning');

      const links = service.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
      expect(links[0].linkType).toBe('planning');
    });

    it('links multiple sessions to the same issue', () => {
      const issue = service.createIssue({ type: 'epic', title: 'Multi Session' });

      service.linkSession(issue.id, 'session-1');
      service.linkSession(issue.id, 'session-2');
      service.linkSession(issue.id, 'session-3');

      const links = service.getSessionLinks(issue.id);
      expect(links).toHaveLength(3);
    });
  });

  describe('unlinkSession', () => {
    it('unlinks a session from an issue', () => {
      const issue = service.createIssue({ type: 'task', title: 'Unlink Test' });
      service.linkSession(issue.id, 'session-to-remove');
      service.linkSession(issue.id, 'session-to-keep');

      service.unlinkSession(issue.id, 'session-to-remove');

      const links = service.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
      expect(links[0].sessionId).toBe('session-to-keep');
    });

    it('does nothing when unlinking non-existent session link', () => {
      const issue = service.createIssue({ type: 'task', title: 'Unlink Non-Existent' });
      service.linkSession(issue.id, 'session-1');

      // Should not throw - unlinking non-existent is a no-op
      service.unlinkSession(issue.id, 'non-existent-session');

      const links = service.getSessionLinks(issue.id);
      expect(links).toHaveLength(1);
    });
  });
});
