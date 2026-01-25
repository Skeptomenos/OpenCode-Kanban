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

export class BoardService {
  constructor(private readonly repo: IPMRepository) {}

  listBoards(): BoardWithParsedFields[] {
    return this.repo.listBoards();
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
