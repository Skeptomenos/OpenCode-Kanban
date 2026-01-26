import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Issue } from '@/contract/pm/types';

const mockGetIssue = vi.fn();
const mockMoveIssue = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/issue-service', () => ({
  IssueService: class MockIssueService {
    getIssue = mockGetIssue;
    moveIssue = mockMoveIssue;
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
    sortOrder: 0,
    metadata: null,
    createdAt: timestamp - 3600000,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMockRequest(body: unknown = null): NextRequest {
  const url = new URL('http://localhost:3000/api/issues/test-id/move');
  const init: RequestInit = { method: 'PUT' };

  if (body !== null) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }

  return new NextRequest(url, init);
}

describe('PUT /api/issues/[id]/move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves issue to new position successfully', async () => {
    const existingIssue = createMockIssue({ id: 'test-id', status: 'backlog' });
    const movedIssue = createMockIssue({ id: 'test-id', status: 'in-progress', sortOrder: 500 });

    mockGetIssue.mockReturnValue(existingIssue);
    mockMoveIssue.mockReturnValue(movedIssue);

    const { PUT } = await import('../route');
    const request = createMockRequest({
      status: 'in-progress',
      prevIssueId: 'issue-a',
      nextIssueId: 'issue-b',
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('test-id');
    expect(body.data.status).toBe('in-progress');
    expect(mockMoveIssue).toHaveBeenCalledWith('test-id', 'in-progress', 'issue-a', 'issue-b');
  });

  it('moves issue to first position (null prevIssueId)', async () => {
    const existingIssue = createMockIssue({ id: 'test-id' });
    const movedIssue = createMockIssue({ id: 'test-id', sortOrder: -1000 });

    mockGetIssue.mockReturnValue(existingIssue);
    mockMoveIssue.mockReturnValue(movedIssue);

    const { PUT } = await import('../route');
    const request = createMockRequest({
      status: 'backlog',
      prevIssueId: null,
      nextIssueId: 'issue-b',
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockMoveIssue).toHaveBeenCalledWith('test-id', 'backlog', null, 'issue-b');
  });

  it('moves issue to last position (null nextIssueId)', async () => {
    const existingIssue = createMockIssue({ id: 'test-id' });
    const movedIssue = createMockIssue({ id: 'test-id', sortOrder: 2000 });

    mockGetIssue.mockReturnValue(existingIssue);
    mockMoveIssue.mockReturnValue(movedIssue);

    const { PUT } = await import('../route');
    const request = createMockRequest({
      status: 'done',
      prevIssueId: 'issue-a',
      nextIssueId: null,
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockMoveIssue).toHaveBeenCalledWith('test-id', 'done', 'issue-a', null);
  });

  it('returns 404 when issue not found', async () => {
    mockGetIssue.mockReturnValue(null);

    const { PUT } = await import('../route');
    const request = createMockRequest({
      status: 'backlog',
      prevIssueId: null,
      nextIssueId: null,
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(mockMoveIssue).not.toHaveBeenCalled();
  });

  it('returns 400 when status is missing', async () => {
    const existingIssue = createMockIssue({ id: 'test-id' });
    mockGetIssue.mockReturnValue(existingIssue);

    const { PUT } = await import('../route');
    const request = createMockRequest({
      prevIssueId: null,
      nextIssueId: null,
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockMoveIssue).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON body', async () => {
    const existingIssue = createMockIssue({ id: 'test-id' });
    mockGetIssue.mockReturnValue(existingIssue);

    const { PUT } = await import('../route');
    const url = 'http://localhost:3000/api/issues/test-id/move';
    const request = new NextRequest(url, {
      method: 'PUT',
      body: 'not valid json',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PARSE_ERROR');
    expect(mockMoveIssue).not.toHaveBeenCalled();
  });

  it('returns 500 when service throws an error', async () => {
    const existingIssue = createMockIssue({ id: 'test-id' });
    mockGetIssue.mockReturnValue(existingIssue);
    mockMoveIssue.mockImplementation(() => {
      throw new Error('Database error');
    });

    const { PUT } = await import('../route');
    const request = createMockRequest({
      status: 'backlog',
      prevIssueId: null,
      nextIssueId: null,
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'test-id' }) });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toBe('Failed to move issue');
  });
});
