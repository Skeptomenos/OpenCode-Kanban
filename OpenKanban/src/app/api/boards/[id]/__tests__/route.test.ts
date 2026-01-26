import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { BoardFilters, ColumnConfig, ApiIssue } from '@/contract/pm/types';
import { ISSUE_STATUSES } from '@/lib/constants/statuses';

const mockGetBoard = vi.fn();
const mockUpdateBoard = vi.fn();
const mockDeleteBoard = vi.fn();
const mockListIssues = vi.fn();
const mockGetIssuesWithRelations = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/board-service', () => ({
  BoardService: class MockBoardService {
    getBoard = mockGetBoard;
    updateBoard = mockUpdateBoard;
    deleteBoard = mockDeleteBoard;
  },
}));

vi.mock('@/services/issue-service', () => ({
  IssueService: class MockIssueService {
    listIssues = mockListIssues;
    getIssuesWithRelations = mockGetIssuesWithRelations;
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

interface BoardWithParsedFields {
  id: string;
  name: string;
  filters: BoardFilters;
  columnConfig: ColumnConfig[];
  createdAt: number;
  updatedAt: number;
}

function createMockBoard(overrides: Partial<BoardWithParsedFields> = {}): BoardWithParsedFields {
  const timestamp = Date.now();
  return {
    id: `board_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test Board',
    filters: {},
    columnConfig: [
      { id: ISSUE_STATUSES.BACKLOG, title: 'Backlog', statusMappings: [ISSUE_STATUSES.BACKLOG] },
      { id: ISSUE_STATUSES.IN_PROGRESS, title: 'In Progress', statusMappings: [ISSUE_STATUSES.IN_PROGRESS] },
      { id: ISSUE_STATUSES.DONE, title: 'Done', statusMappings: [ISSUE_STATUSES.DONE] },
    ],
    createdAt: timestamp - 3600000,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMockIssue(overrides: Partial<ApiIssue> = {}): ApiIssue {
  const timestamp = Date.now();
  return {
    id: `issue_${Math.random().toString(36).slice(2, 10)}`,
    type: 'task',
    parentId: null,
    title: 'Test Issue',
    description: null,
    status: 'backlog',
    metadata: {},
    createdAt: timestamp - 3600000,
    updatedAt: timestamp,
    sessionIds: [],
    labelIds: [],
    ...overrides,
  };
}

function createMockRequest(
  body: unknown = null,
  method: string = 'GET'
): NextRequest {
  const url = 'http://localhost:3000/api/boards/board_123';
  
  if (body !== null) {
    return new NextRequest(url, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new NextRequest(url, { method });
}

function createRouteContext(id: string = 'board_123'): { params: Promise<{ id: string }> } {
  return {
    params: Promise.resolve({ id }),
  };
}

describe('/api/boards/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns board with issues on success', async () => {
      const mockBoard = createMockBoard({ id: 'board_123', name: 'Sprint Board' });
      const mockIssues = [
        createMockIssue({ id: 'issue_001', title: 'Task 1' }),
        createMockIssue({ id: 'issue_002', title: 'Task 2' }),
      ];

      mockGetBoard.mockReturnValue(mockBoard);
      mockListIssues.mockReturnValue(mockIssues);
      mockGetIssuesWithRelations.mockReturnValue(mockIssues);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('board_123');
      const response = await GET(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('board_123');
      expect(body.data.name).toBe('Sprint Board');
      expect(body.data.issues).toHaveLength(2);
      expect(mockGetBoard).toHaveBeenCalledWith('board_123');
    });

    it('returns 404 when board not found', async () => {
      mockGetBoard.mockReturnValue(null);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('non_existent');
      const response = await GET(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toContain('non_existent');
    });

    it('returns 500 when service throws', async () => {
      mockGetBoard.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { GET } = await import('../route');
      const request = createMockRequest();
      const context = createRouteContext('board_123');
      const response = await GET(request, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('PATCH', () => {
    it('updates board name successfully', async () => {
      const existingBoard = createMockBoard({ id: 'board_123', name: 'Old Name' });
      const updatedBoard = createMockBoard({ id: 'board_123', name: 'New Name' });

      mockGetBoard.mockReturnValue(existingBoard);
      mockUpdateBoard.mockReturnValue(updatedBoard);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' }, 'PATCH');
      const context = createRouteContext('board_123');
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Name');
      expect(mockUpdateBoard).toHaveBeenCalledWith('board_123', { name: 'New Name' });
    });

    it('updates board filters successfully', async () => {
      const existingBoard = createMockBoard({ id: 'board_123' });
      const newFilters: BoardFilters = { parentId: 'project_001', statuses: ['backlog'] };
      const updatedBoard = createMockBoard({ id: 'board_123', filters: newFilters });

      mockGetBoard.mockReturnValue(existingBoard);
      mockUpdateBoard.mockReturnValue(updatedBoard);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ filters: newFilters }, 'PATCH');
      const context = createRouteContext('board_123');
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.filters).toEqual(newFilters);
    });

    it('returns 404 when board not found', async () => {
      mockGetBoard.mockReturnValue(null);

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' }, 'PATCH');
      const context = createRouteContext('non_existent');
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(mockUpdateBoard).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid JSON body', async () => {
      const existingBoard = createMockBoard({ id: 'board_123' });
      mockGetBoard.mockReturnValue(existingBoard);

      const { PATCH } = await import('../route');
      const url = 'http://localhost:3000/api/boards/board_123';
      const request = new NextRequest(url, {
        method: 'PATCH',
        body: 'not valid json',
        headers: { 'Content-Type': 'application/json' },
      });
      const context = createRouteContext('board_123');
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('PARSE_ERROR');
      expect(mockUpdateBoard).not.toHaveBeenCalled();
    });

    it('returns 500 when service throws', async () => {
      const existingBoard = createMockBoard({ id: 'board_123' });
      mockGetBoard.mockReturnValue(existingBoard);
      mockUpdateBoard.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { PATCH } = await import('../route');
      const request = createMockRequest({ name: 'New Name' }, 'PATCH');
      const context = createRouteContext('board_123');
      const response = await PATCH(request, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('DELETE', () => {
    it('deletes board successfully', async () => {
      const existingBoard = createMockBoard({ id: 'board_123' });
      mockGetBoard.mockReturnValue(existingBoard);
      mockDeleteBoard.mockReturnValue(undefined);

      const { DELETE } = await import('../route');
      const request = createMockRequest(null, 'DELETE');
      const context = createRouteContext('board_123');
      const response = await DELETE(request, context);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.deleted).toBe(true);
      expect(mockDeleteBoard).toHaveBeenCalledWith('board_123');
    });

    it('returns 404 when board not found', async () => {
      mockGetBoard.mockReturnValue(null);

      const { DELETE } = await import('../route');
      const request = createMockRequest(null, 'DELETE');
      const context = createRouteContext('non_existent');
      const response = await DELETE(request, context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(mockDeleteBoard).not.toHaveBeenCalled();
    });

    it('returns 500 when service throws', async () => {
      const existingBoard = createMockBoard({ id: 'board_123' });
      mockGetBoard.mockReturnValue(existingBoard);
      mockDeleteBoard.mockImplementation(() => {
        throw new Error('Database error');
      });

      const { DELETE } = await import('../route');
      const request = createMockRequest(null, 'DELETE');
      const context = createRouteContext('board_123');
      const response = await DELETE(request, context);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
