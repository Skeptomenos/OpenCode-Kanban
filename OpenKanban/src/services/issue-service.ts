/**
 * Issue Service Layer
 * @see ralph-wiggum/specs/351-backend-arch.md:L14-21
 */

import type {
  IPMRepository,
  CreateIssueInput,
  UpdateIssueInput,
  IssueFilter,
  IssueWithRelations,
} from '../lib/db/repository';
import type { Issue } from '../lib/db/schema';

export class IssueService {
  constructor(private readonly repo: IPMRepository) {}

  listIssues(filter?: IssueFilter): Issue[] {
    return this.repo.listIssues(filter);
  }

  createIssue(data: CreateIssueInput): Issue {
    return this.repo.createIssue(data);
  }

  getIssue(id: string): Issue | null {
    return this.repo.getIssue(id);
  }

  getIssueWithRelations(id: string): IssueWithRelations | null {
    return this.repo.getIssueWithRelations(id);
  }

  updateIssue(id: string, data: UpdateIssueInput): Issue {
    return this.repo.updateIssue(id, data);
  }

  deleteIssue(id: string): void {
    this.repo.deleteIssue(id);
  }
}
