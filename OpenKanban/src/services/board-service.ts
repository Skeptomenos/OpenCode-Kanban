/**
 * Board Service Layer
 * @see ralph-wiggum/specs/351-backend-arch.md:L23-28
 */

import type {
  IPMRepository,
  CreateBoardInput,
  UpdateBoardInput,
  BoardWithParsedFields,
} from '../lib/db/repository';

/**
 * Default owner ID for local-first mode (no multi-tenancy).
 * @see ralph-wiggum/specs/353-security-hygiene.md:L10-18
 */
const DEFAULT_OWNER_ID = 'local-owner';

export class BoardService {
  /**
   * @todo Phase 4: Implement BOLA enforcement
   * - Add ownerId column to database schema
   * - Pass ownerId to all repository methods
   * - Filter queries by owner for multi-tenant security
   * @see OpenKanban/docs/phase3.5-issues2.md#f4-bola-stubs-inert
   */
  constructor(
    private readonly repo: IPMRepository,
    private readonly ownerId: string = DEFAULT_OWNER_ID
  ) {}

  listBoards(filter?: { parentId?: string }): BoardWithParsedFields[] {
    return this.repo.listBoards(filter);
  }

  createBoard(data: CreateBoardInput): BoardWithParsedFields {
    return this.repo.createBoard(data);
  }

  getBoard(id: string): BoardWithParsedFields | null {
    return this.repo.getBoard(id);
  }

  updateBoard(id: string, data: UpdateBoardInput): BoardWithParsedFields {
    return this.repo.updateBoard(id, data);
  }

  deleteBoard(id: string): void {
    this.repo.deleteBoard(id);
  }
}
