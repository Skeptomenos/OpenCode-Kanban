import { describe, it, expect, beforeEach, vi, type MockedObject } from 'vitest';
import { OpenCodeService } from '../opencode-service';
import type { IOpenCodeRepository } from '../../contract/opencode/repository';
import type { OpenCodeProject, OpenCodeSession } from '../../contract/opencode/types';

/**
 * OpenCodeService Tests
 * @see ralph-wiggum/specs/354-service-completion.md:L67-70
 * 
 * Tests:
 * 1. getAllSessions calls adapter and returns sessions
 * 2. getAllProjects calls adapter and returns projects
 * 3. getSessionById calls adapter with correct ID
 * 4. getSessionById returns null when not found
 * 5. Error propagation from adapter
 */

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

function createMockAdapter(): MockedObject<IOpenCodeRepository> {
  return {
    getAllSessions: vi.fn(),
    getAllProjects: vi.fn(),
    getSessionById: vi.fn(),
  };
}

describe('OpenCodeService', () => {
  let mockAdapter: MockedObject<IOpenCodeRepository>;
  let service: OpenCodeService;

  beforeEach(() => {
    mockAdapter = createMockAdapter();
    service = new OpenCodeService(mockAdapter);
    vi.clearAllMocks();
  });

  describe('getAllSessions', () => {
    it('calls adapter and returns sessions', async () => {
      const mockSessions = [
        createMockSession({ id: 'ses_001', title: 'Session 1' }),
        createMockSession({ id: 'ses_002', title: 'Session 2' }),
      ];
      mockAdapter.getAllSessions.mockResolvedValue(mockSessions);

      const result = await service.getAllSessions();

      expect(mockAdapter.getAllSessions).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('ses_001');
      expect(result[1].id).toBe('ses_002');
    });

    it('returns empty array when no sessions exist', async () => {
      mockAdapter.getAllSessions.mockResolvedValue([]);

      const result = await service.getAllSessions();

      expect(result).toEqual([]);
    });

    it('propagates errors from adapter', async () => {
      const error = new Error('Storage read failed');
      mockAdapter.getAllSessions.mockRejectedValue(error);

      await expect(service.getAllSessions()).rejects.toThrow('Storage read failed');
    });
  });

  describe('getAllProjects', () => {
    it('calls adapter and returns projects', async () => {
      const mockProjects = [
        createMockProject({ id: 'proj_001', worktree: '/home/user/project1' }),
        createMockProject({ id: 'proj_002', worktree: '/home/user/project2' }),
      ];
      mockAdapter.getAllProjects.mockResolvedValue(mockProjects);

      const result = await service.getAllProjects();

      expect(mockAdapter.getAllProjects).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].worktree).toBe('/home/user/project1');
      expect(result[1].worktree).toBe('/home/user/project2');
    });

    it('returns empty array when no projects exist', async () => {
      mockAdapter.getAllProjects.mockResolvedValue([]);

      const result = await service.getAllProjects();

      expect(result).toEqual([]);
    });

    it('propagates errors from adapter', async () => {
      const error = new Error('Project directory not found');
      mockAdapter.getAllProjects.mockRejectedValue(error);

      await expect(service.getAllProjects()).rejects.toThrow('Project directory not found');
    });
  });

  describe('getSessionById', () => {
    it('calls adapter with correct ID and returns session', async () => {
      const mockSession = createMockSession({ id: 'ses_target', title: 'Target Session' });
      mockAdapter.getSessionById.mockResolvedValue(mockSession);

      const result = await service.getSessionById('ses_target');

      expect(mockAdapter.getSessionById).toHaveBeenCalledTimes(1);
      expect(mockAdapter.getSessionById).toHaveBeenCalledWith('ses_target');
      expect(result).toBeDefined();
      expect(result?.id).toBe('ses_target');
      expect(result?.title).toBe('Target Session');
    });

    it('returns null when session not found', async () => {
      mockAdapter.getSessionById.mockResolvedValue(null);

      const result = await service.getSessionById('ses_nonexistent');

      expect(mockAdapter.getSessionById).toHaveBeenCalledWith('ses_nonexistent');
      expect(result).toBeNull();
    });

    it('propagates errors from adapter', async () => {
      const error = new Error('Session file corrupted');
      mockAdapter.getSessionById.mockRejectedValue(error);

      await expect(service.getSessionById('ses_corrupted')).rejects.toThrow('Session file corrupted');
    });
  });
});
