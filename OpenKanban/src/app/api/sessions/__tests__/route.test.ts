import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { OpenCodeProject, OpenCodeSession } from '@/contract/opencode/types';

/**
 * /api/sessions Route Tests
 * @see ralph-wiggum/specs/356-tech-debt.md:L32-37
 *
 * Test Cases:
 * 1. GET: Returns sessions/projects (success)
 * 2. GET: Returns empty array (empty state)
 * 3. GET: Returns 500 (service throws)
 */

const mockGetAllSessions = vi.fn();
const mockGetAllProjects = vi.fn();

vi.mock('@/services/opencode-service', () => ({
  OpenCodeService: class MockOpenCodeService {
    getAllSessions = mockGetAllSessions;
    getAllProjects = mockGetAllProjects;
  },
}));

vi.mock('@/contract/opencode/adapter', () => ({
  LocalOpenCodeAdapter: class MockLocalOpenCodeAdapter {},
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

function createMockSession(overrides: Partial<OpenCodeSession> = {}): OpenCodeSession {
  const timestamp = Date.now();
  return {
    id: `ses_${Math.random().toString(36).slice(2, 10)}`,
    title: 'Test Session',
    slug: 'test-session',
    projectID: 'proj_123',
    directory: '/test/project',
    time: {
      created: timestamp - 3600000,
      updated: timestamp,
    },
    ...overrides,
  };
}

function createMockProject(overrides: Partial<OpenCodeProject> = {}): OpenCodeProject {
  const timestamp = Date.now();
  return {
    id: `proj_${Math.random().toString(36).slice(2, 10)}`,
    worktree: '/test/project',
    time: {
      created: timestamp - 86400000,
      updated: timestamp,
    },
    ...overrides,
  };
}

function createMockRequest(queryString: string = ''): NextRequest {
  const url = `http://localhost:3000/api/sessions${queryString ? `?${queryString}` : ''}`;
  return new NextRequest(url);
}

describe('/api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns sessions and projects on success', async () => {
      const mockSessions = [
        createMockSession({ id: 'ses_001', title: 'Session 1' }),
        createMockSession({ id: 'ses_002', title: 'Session 2' }),
      ];
      const mockProjects = [
        createMockProject({ id: 'proj_001', worktree: '/project1' }),
        createMockProject({ id: 'proj_002', worktree: '/project2' }),
      ];

      mockGetAllSessions.mockResolvedValue(mockSessions);
      mockGetAllProjects.mockResolvedValue(mockProjects);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.sessions).toHaveLength(2);
      expect(body.data.sessions[0].id).toBe('ses_001');
      expect(body.data.sessions[1].id).toBe('ses_002');
      expect(body.data.projects).toHaveLength(2);
      expect(body.data.projects[0].id).toBe('proj_001');
      expect(body.data.projects[1].id).toBe('proj_002');
    });

    it('returns empty arrays when no sessions or projects exist', async () => {
      mockGetAllSessions.mockResolvedValue([]);
      mockGetAllProjects.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.sessions).toEqual([]);
      expect(body.data.projects).toEqual([]);
    });

    it('returns 500 when service throws an error', async () => {
      const error = new Error('Storage directory not found');
      mockGetAllSessions.mockRejectedValue(error);
      mockGetAllProjects.mockResolvedValue([]);

      const { GET } = await import('../route');
      const request = createMockRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.message).toBe('Failed to load sessions');
    });
  });
});
