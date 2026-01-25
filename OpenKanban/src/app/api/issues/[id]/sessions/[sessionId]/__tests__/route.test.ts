import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { Issue } from '@/contract/pm/types';

/**
 * /api/issues/[id]/sessions/[sessionId] Route Tests
 * @see ralph-wiggum/specs/356-tech-debt.md:L48-51
 *
 * Test Cases:
 * 1. DELETE: 200 (success)
 * 2. DELETE: 404 (link not found / issue not found)
 */

const mockGetIssue = vi.fn();
const mockUnlinkSession = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/issue-service', () => ({
  IssueService: class MockIssueService {
    getIssue = mockGetIssue;
    unlinkSession = mockUnlinkSession;
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

function createMockRequest(): NextRequest {
  const url = 'http://localhost:3000/api/issues/issue_123/sessions/ses_456';
  return new NextRequest(url, { method: 'DELETE' });
}

function createRouteContext(
  id: string = 'issue_123',
  sessionId: string = 'ses_456'
): { params: Promise<{ id: string; sessionId: string }> } {
  return {
    params: Promise.resolve({ id, sessionId }),
  };
}

describe('/api/issues/[id]/sessions/[sessionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE', () => {
    it('unlinks a session successfully (200)', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      
      mockGetIssue.mockReturnValue(mockIssue);
      mockUnlinkSession.mockReturnValue(undefined);

      const { DELETE } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('issue_123', 'ses_456');
      const response = await DELETE(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.unlinked).toBe(true);
      expect(body.data.issueId).toBe('issue_123');
      expect(body.data.sessionId).toBe('ses_456');
      expect(mockGetIssue).toHaveBeenCalledWith('issue_123');
      expect(mockUnlinkSession).toHaveBeenCalledWith('issue_123', 'ses_456');
    });

    it('returns 404 when issue not found', async () => {
      mockGetIssue.mockReturnValue(null);

      const { DELETE } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('non_existent', 'ses_456');
      const response = await DELETE(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('non_existent');
      expect(mockUnlinkSession).not.toHaveBeenCalled();
    });
  });
});
