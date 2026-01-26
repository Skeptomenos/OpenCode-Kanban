import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { BoardFilters, ColumnConfig } from '@/contract/pm/types';

/**
 * /api/boards Route Tests
 * @see ralph-wiggum/specs/360-critical-fixes.md:L78-84
 *
 * Test Cases:
 * 1. GET: Returns list of boards (success)
 * 2. GET: Returns empty array (empty state)
 * 3. GET: Returns 500 (service throws)
 * 4. POST: Creates board (success)
 * 5. POST: Creates board with custom filters and columns
 * 6. POST: Returns 400 (validation error - missing name)
 * 7. POST: Returns 400 (invalid JSON)
 * 8. POST: Returns 500 (service throws)
 */

interface BoardWithParsedFields {
  id: string;
  name: string;
  filters: BoardFilters;
  columnConfig: ColumnConfig[];
  createdAt: number;
  updatedAt: number;
}

const mockListBoards = vi.fn();
const mockCreateBoard = vi.fn();

vi.mock('@/lib/db/connection', () => ({
  getDb: () => ({}),
}));

vi.mock('@/lib/db/repository', () => ({
  SqlitePMRepository: class MockSqlitePMRepository {},
}));

vi.mock('@/services/board-service', () => ({
  BoardService: class MockBoardService {
    listBoards = mockListBoards;
    createBoard = mockCreateBoard;
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

function createMockBoard(overrides: Partial<BoardWithParsedFields> = {}): BoardWithParsedFields {
  const timestamp = Date.now();
  return {
    id: `board_${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test Board',
    filters: {},
    columnConfig: [
      { id: 'backlog', title: 'Backlog', statusMappings: ['backlog'] },
      { id: 'in-progress', title: 'In Progress', statusMappings: ['in-progress'] },
      { id: 'done', title: 'Done', statusMappings: ['done'] },
    ],
    createdAt: timestamp - 3600000,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createMockRequest(
  body: unknown = null,
  method: string = 'GET'
): NextRequest {
  const url = new URL('http://localhost:3000/api/boards');
  
  const init: RequestInit = { method };
  
  if (body !== null) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  
  return new NextRequest(url, init);
}

describe('/api/boards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns list of boards on success', async () => {
      const mockBoards = [
        createMockBoard({ id: 'board_001', name: 'Sprint Board' }),
        createMockBoard({ id: 'board_002', name: 'Backlog Board' }),
      ];

      mockListBoards.mockReturnValue(mockBoards);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].id).toBe('board_001');
      expect(body.data[0].name).toBe('Sprint Board');
      expect(body.data[1].id).toBe('board_002');
      expect(mockListBoards).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no boards exist', async () => {
      mockListBoards.mockReturnValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('returns 500 when service throws an error', async () => {
      const error = new Error('Database error');
      mockListBoards.mockImplementation(() => {
        throw error;
      });

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Failed to list boards');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST', () => {
    it('creates a board successfully', async () => {
      const newBoard = createMockBoard({
        id: 'board_new',
        name: 'New Sprint Board',
      });

      mockCreateBoard.mockReturnValue(newBoard);

      const { POST } = await import('../route');
      const request = createMockRequest({ name: 'New Sprint Board' }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('board_new');
      expect(body.data.name).toBe('New Sprint Board');
      expect(mockCreateBoard).toHaveBeenCalledWith({
        name: 'New Sprint Board',
      });
    });

    it('creates a board with custom filters and columnConfig', async () => {
      const customFilters: BoardFilters = {
        types: ['task'],
        statuses: ['backlog', 'in-progress'],
        parentId: 'project_001',
      };

      const customColumns: ColumnConfig[] = [
        { id: 'todo', title: 'To Do', statusMappings: ['backlog'] },
        { id: 'wip', title: 'Work In Progress', statusMappings: ['in-progress'] },
        { id: 'complete', title: 'Complete', statusMappings: ['done', 'closed'] },
      ];

      const newBoard = createMockBoard({
        id: 'board_custom',
        name: 'Custom Board',
        filters: customFilters,
        columnConfig: customColumns,
      });

      mockCreateBoard.mockReturnValue(newBoard);

      const { POST } = await import('../route');
      const request = createMockRequest(
        {
          name: 'Custom Board',
          filters: customFilters,
          columnConfig: customColumns,
        },
        'POST'
      );
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('board_custom');
      expect(body.data.filters).toEqual(customFilters);
      expect(body.data.columnConfig).toEqual(customColumns);
      expect(mockCreateBoard).toHaveBeenCalledWith({
        name: 'Custom Board',
        filters: customFilters,
        columnConfig: customColumns,
      });
    });

    it('returns 400 when name is missing (validation error)', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest({ filters: {} }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockCreateBoard).not.toHaveBeenCalled();
    });

    it('returns 400 when name is empty string (validation error)', async () => {
      const { POST } = await import('../route');
      const request = createMockRequest({ name: '' }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockCreateBoard).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid JSON body', async () => {
      const { POST } = await import('../route');
      const url = 'http://localhost:3000/api/boards';
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
      expect(mockCreateBoard).not.toHaveBeenCalled();
    });

    it('returns 500 when service throws an error', async () => {
      const error = new Error('Database error');
      mockCreateBoard.mockImplementation(() => {
        throw error;
      });

      const { POST } = await import('../route');
      const request = createMockRequest({ name: 'New Board' }, 'POST');
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Failed to create board');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
