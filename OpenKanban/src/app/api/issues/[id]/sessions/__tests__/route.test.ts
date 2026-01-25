import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { IssueSession, Issue } from '@/contract/pm/types';

/**
 * /api/issues/[id]/sessions Route Tests
 * @see ralph-wiggum/specs/356-tech-debt.md:L40-46
 *
 * Test Cases:
 * 1. GET: Success (returns links)
 * 2. GET: 404 (issue not found)
 * 3. POST: 201 (success)
 * 4. POST: 400 (missing sessionId)
 * 5. POST: 409/400 (duplicate link)
 */

const mockGetIssue = vi.fn();
const mockGetSessionLinks = vi.fn();
const mockLinkSession = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/issue-service', () => ({
  IssueService: class MockIssueService {
    getIssue = mockGetIssue;
    getSessionLinks = mockGetSessionLinks;
    linkSession = mockLinkSession;
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

function createMockSessionLink(overrides: Partial<IssueSession> = {}): IssueSession {
  const timestamp = Date.now();
  return {
    issueId: 'issue_123',
    sessionId: `ses_${Math.random().toString(36).slice(2, 10)}`,
    linkType: null,
    createdAt: timestamp,
    ...overrides,
  };
}

function createMockRequest(
  body: unknown = null,
  method: string = 'GET'
): NextRequest {
  const url = 'http://localhost:3000/api/issues/issue_123/sessions';
  const init: RequestInit = { method };
  
  if (body !== null) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, init);
}

function createRouteContext(id: string = 'issue_123'): { params: Promise<{ id: string }> } {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('/api/issues/[id]/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns session links on success', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      const mockLinks = [
        createMockSessionLink({ issueId: 'issue_123', sessionId: 'ses_001', linkType: 'planning' }),
        createMockSessionLink({ issueId: 'issue_123', sessionId: 'ses_002', linkType: 'execution' }),
      ];

      mockGetIssue.mockReturnValue(mockIssue);
      mockGetSessionLinks.mockReturnValue(mockLinks);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('issue_123');
      const response = await GET(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].sessionId).toBe('ses_001');
      expect(body.data[0].linkType).toBe('planning');
      expect(body.data[1].sessionId).toBe('ses_002');
      expect(mockGetIssue).toHaveBeenCalledWith('issue_123');
      expect(mockGetSessionLinks).toHaveBeenCalledWith('issue_123');
    });

    it('returns 404 when issue not found', async () => {
      mockGetIssue.mockReturnValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('non_existent');
      const response = await GET(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('non_existent');
      expect(mockGetSessionLinks).not.toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    it('links a session successfully (201)', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      
      mockGetIssue.mockReturnValue(mockIssue);
      mockGetSessionLinks.mockReturnValue([]);
      mockLinkSession.mockReturnValue(undefined);

      const { POST } = await import('../route');
      const request = createMockRequest({ sessionId: 'ses_new', linkType: 'planning' }, 'POST');
      const context = createRouteContext('issue_123');
      const response = await POST(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.linked).toBe(true);
      expect(body.data.issueId).toBe('issue_123');
      expect(body.data.sessionId).toBe('ses_new');
      expect(mockLinkSession).toHaveBeenCalledWith('issue_123', 'ses_new', 'planning');
    });

    it('returns 400 when sessionId is missing', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      mockGetIssue.mockReturnValue(mockIssue);

      const { POST } = await import('../route');
      const request = createMockRequest({ linkType: 'planning' }, 'POST');
      const context = createRouteContext('issue_123');
      const response = await POST(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockLinkSession).not.toHaveBeenCalled();
    });

    it('returns 400 when session is already linked (duplicate)', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      const existingLinks = [
        createMockSessionLink({ issueId: 'issue_123', sessionId: 'ses_duplicate' }),
      ];
      
      mockGetIssue.mockReturnValue(mockIssue);
      mockGetSessionLinks.mockReturnValue(existingLinks);

      const { POST } = await import('../route');
      const request = createMockRequest({ sessionId: 'ses_duplicate' }, 'POST');
      const context = createRouteContext('issue_123');
      const response = await POST(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('ALREADY_LINKED');
      expect(body.error.message).toContain('ses_duplicate');
      expect(body.error.message).toContain('issue_123');
      expect(mockLinkSession).not.toHaveBeenCalled();
    });

    it('returns 404 when issue not found', async () => {
      mockGetIssue.mockReturnValue(null);

      const { POST } = await import('../route');
      const request = createMockRequest({ sessionId: 'ses_any' }, 'POST');
      const context = createRouteContext('non_existent');
      const response = await POST(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(mockLinkSession).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid JSON body', async () => {
      const mockIssue = createMockIssue({ id: 'issue_123' });
      mockGetIssue.mockReturnValue(mockIssue);

      const { POST } = await import('../route');
      const url = 'http://localhost:3000/api/issues/issue_123/sessions';
      const request = new NextRequest(url, {
        method: 'POST',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });
      const context = createRouteContext('issue_123');
      const response = await POST(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('PARSE_ERROR');
      expect(mockLinkSession).not.toHaveBeenCalled();
    });
  });
});
