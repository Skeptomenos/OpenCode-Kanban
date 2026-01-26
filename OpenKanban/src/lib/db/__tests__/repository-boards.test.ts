/**
 * Board Repository Tests (TDD for Phase 4.1)
 * @see ralph-wiggum/specs/4.1-backend-core.md:L32-37
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, type TestDbResult } from '../test-utils';
import { SqlitePMRepository } from '../repository';
import type { IPMRepository } from '../repository';
import { ISSUE_STATUSES } from '@/lib/constants/statuses';

describe('SqlitePMRepository - Board Filtering', () => {
  let testDb: TestDbResult;
  let repo: IPMRepository;

  beforeEach(() => {
    testDb = createTestDb();
    repo = new SqlitePMRepository(testDb.db);
  });

  afterEach(() => {
    testDb.sqlite.close();
  });

  describe('listBoards with parentId filter', () => {
    it('should create a board with parentId filter', () => {
      const board = repo.createBoard({
        name: 'Project Board',
        filters: { parentId: 'project-123' },
        columnConfig: [
          { id: 'col-1', title: 'Backlog', statusMappings: [ISSUE_STATUSES.BACKLOG] },
          { id: 'col-2', title: 'In Progress', statusMappings: [ISSUE_STATUSES.IN_PROGRESS] },
          { id: 'col-3', title: 'Done', statusMappings: [ISSUE_STATUSES.DONE] },
        ],
      });

      expect(board.id).toBeDefined();
      expect(board.name).toBe('Project Board');
      expect(board.filters.parentId).toBe('project-123');
      expect(board.columnConfig).toHaveLength(3);
    });

    it('should list only boards matching parentId', () => {
      repo.createBoard({
        name: 'Board for Project A',
        filters: { parentId: 'project-a' },
      });
      repo.createBoard({
        name: 'Board for Project B',
        filters: { parentId: 'project-b' },
      });
      repo.createBoard({
        name: 'Another Board for Project A',
        filters: { parentId: 'project-a' },
      });

      const projectABoards = repo.listBoards({ parentId: 'project-a' });
      
      expect(projectABoards).toHaveLength(2);
      expect(projectABoards.every((b) => b.filters.parentId === 'project-a')).toBe(true);
      
      const projectBBoards = repo.listBoards({ parentId: 'project-b' });
      expect(projectBBoards).toHaveLength(1);
      expect(projectBBoards[0].name).toBe('Board for Project B');
    });

    it('should return all boards if no filter provided', () => {
      repo.createBoard({ name: 'Board 1', filters: { parentId: 'p1' } });
      repo.createBoard({ name: 'Board 2', filters: { parentId: 'p2' } });
      repo.createBoard({ name: 'Board 3' });

      const allBoards = repo.listBoards();
      
      expect(allBoards).toHaveLength(3);
    });

    it('should delete a board', () => {
      const board = repo.createBoard({
        name: 'Board to Delete',
        filters: { parentId: 'project-x' },
      });

      expect(repo.getBoard(board.id)).not.toBeNull();
      
      repo.deleteBoard(board.id);
      
      expect(repo.getBoard(board.id)).toBeNull();
      
      const boards = repo.listBoards({ parentId: 'project-x' });
      expect(boards).toHaveLength(0);
    });
  });
});
