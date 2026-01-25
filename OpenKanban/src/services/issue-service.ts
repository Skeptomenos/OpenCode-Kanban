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
import type { Issue, IssueSession } from '../lib/db/schema';

/**
 * Default owner ID for local-first mode (no multi-tenancy).
 * @see ralph-wiggum/specs/353-security-hygiene.md:L10-18
 */
const DEFAULT_OWNER_ID = 'local-owner';

export class IssueService {
  /**
   * BOLA stub: ownerId is accepted but not enforced yet.
   * Future: Use this to filter queries by owner for multi-tenant security.
   */
  constructor(
    private readonly repo: IPMRepository,
    private readonly ownerId: string = DEFAULT_OWNER_ID
  ) {}

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

  getIssuesWithRelations(ids: string[]): IssueWithRelations[] {
    return this.repo.getIssuesWithRelations(ids);
  }

  updateIssue(id: string, data: UpdateIssueInput): Issue {
    return this.repo.updateIssue(id, data);
  }

  deleteIssue(id: string): void {
    this.repo.deleteIssue(id);
  }

  getSessionLinks(issueId: string): IssueSession[] {
    return this.repo.getSessionLinks(issueId);
  }

  linkSession(issueId: string, sessionId: string, linkType?: string | null): void {
    this.repo.linkSession(issueId, sessionId, linkType);
  }

  unlinkSession(issueId: string, sessionId: string): void {
    this.repo.unlinkSession(issueId, sessionId);
  }
}
