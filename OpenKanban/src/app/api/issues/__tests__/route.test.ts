import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Issue } from '@/contract/pm/types';

/**
 * /api/issues Route Tests
 * @see ralph-wiggum/specs/360-critical-fixes.md:L70-77
 *
 * Test Cases:
 * 1. GET: Returns list of issues (success)
 * 2. GET: Returns empty array (empty state)
 * 3. GET: Filters by parentId correctly
 * 4. GET: Returns 500 (service throws)
 * 5. POST: Creates issue (success)
 * 6. POST: Returns 400 (validation error)
 * 7. POST: Returns 400 (invalid JSON)
 * 8. POST: Returns 500 (service throws)
 */

const mockListIssues = vi.fn();
const mockCreateIssue = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/issue-service', () => ({
  IssueService: class MockIssueService {
    listIssues = mockListIssues;
    createIssue = mockCreateIssue;
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createMockIssue(overrides: Partial<Issue> = {}): Issue {
  const timestamp = Date.now();
  return {
    id: `issue_${Math.random().toString(36).slice(2, 10)}`,
    type: 'task',
    parentId: null,
    title: 'Test Issue',
    description: null,
    status: 'backlog',
    metadata: null,
    createdAt: timestamp - 3600000,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMockRequest(
  searchParams: Record<string, string> = {},
  body: unknown = null,
  method: string = 'GET'
): NextRequest {
  const url = new URL('http://localhost:3000/api/issues');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  const init: RequestInit = { method };
  
  if (body !== null) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, init);
}

describe('/api/issues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns list of issues on success', async () => {
      const mockIssues = [
        createMockIssue({ id: 'issue_001', title: 'Issue 1', type: 'task' }),
        createMockIssue({ id: 'issue_002', title: 'Issue 2', type: 'project' }),
      ];

      mockListIssues.mockReturnValue(mockIssues);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].id).toBe('issue_001');
      expect(body.data[1].id).toBe('issue_002');
      expect(mockListIssues).toHaveBeenCalledWith(undefined);
    });

    it('returns empty array when no issues exist', async () => {
      mockListIssues.mockReturnValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('filters by parentId correctly (null for root)', async () => {
      const rootIssues = [
        createMockIssue({ id: 'issue_root', parentId: null }),
      ];

      mockListIssues.mockReturnValue(rootIssues);

      const { GET } = await import('../route');
      const request = createMockRequest({ parentId: 'null' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(mockListIssues).toHaveBeenCalledWith({ parentId: null });
    });

    it('filters by parentId correctly (specific parent)', async () => {
      const childIssues = [
        createMockIssue({ id: 'issue_child', parentId: 'issue_parent' }),
      ];

      mockListIssues.mockReturnValue(childIssues);

      const { GET } = await import('../route');
      const request = createMockRequest({ parentId: 'issue_parent' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(mockListIssues).toHaveBeenCalledWith({ parentId: 'issue_parent' });
    });

    it('filters by type correctly', async () => {
      const tasks = [
        createMockIssue({ id: 'issue_task', type: 'task' }),
      ];

      mockListIssues.mockReturnValue(tasks);

      const { GET } = await import('../route');
      const request = createMockRequest({ type: 'task' });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockListIssues).toHaveBeenCalledWith({ types: ['task'] });
    });

    it('returns 500 when service throws an error', async () => {
      const error = new Error('Database error');
      mockListIssues.mockImplementation(() => {
        throw error;
      });

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Failed to list issues');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST', () => {
    it('creates an issue successfully', async () => {
      const newIssue = createMockIssue({
        id: 'issue_new',
        title: 'New Issue',
        type: 'task',
        status: 'backlog',
      });

      mockCreateIssue.mockReturnValue(newIssue);

      const { POST } = await import('../route');
      const request = createMockRequest(
        {},
        { title: 'New Issue', type: 'task' },
        'POST'
      );
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('issue_new');
      expect(body.data.title).toBe('New Issue');
      expect(mockCreateIssue).toHaveBeenCalledWith({
        title: 'New Issue',
        type: 'task',
      });
    });

    it('returns 400 when title is missing (validation error)', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest({}, { type: 'task' }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockCreateIssue).not.toHaveBeenCalled();
    });

    it('returns 400 when type is missing (validation error)', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest({}, { title: 'Some title' }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockCreateIssue).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid JSON body', async () => {
      const { POST } = await import('../route');
      const url = 'http://localhost:3000/api/issues';
      const request = new NextRequest(url, {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('PARSE_ERROR');
      expect(mockCreateIssue).not.toHaveBeenCalled();
    });

    it('returns 500 when service throws an error', async () => {
      const error = new Error('Database error');
      mockCreateIssue.mockImplementation(() => {
        throw error;
      });

      const { POST } = await import('../route');
      const request = createMockRequest(
        {},
        { title: 'New Issue', type: 'task' },
        'POST'
      );
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Failed to create issue');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
