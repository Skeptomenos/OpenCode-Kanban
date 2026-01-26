import { describe, it, expect } from 'vitest';
import { ISSUE_STATUSES, ALL_ISSUE_STATUSES, type IssueStatus } from '../statuses';

describe('ISSUE_STATUSES', () => {
  it('defines canonical status values with hyphen format', () => {
    expect(ISSUE_STATUSES.BACKLOG).toBe('backlog');
    expect(ISSUE_STATUSES.IN_PROGRESS).toBe('in-progress');
    expect(ISSUE_STATUSES.DONE).toBe('done');
  });

  it('matches default board column status mappings', () => {
    const expectedMappings = ['backlog', 'in-progress', 'done'];
    expect(ALL_ISSUE_STATUSES).toEqual(expect.arrayContaining(expectedMappings));
    expect(ALL_ISSUE_STATUSES).toHaveLength(expectedMappings.length);
  });

  it('exports type-safe IssueStatus type', () => {
    const validStatus: IssueStatus = ISSUE_STATUSES.IN_PROGRESS;
    expect(validStatus).toBe('in-progress');
  });

  it('does NOT use underscore format (legacy check)', () => {
    expect(ISSUE_STATUSES.IN_PROGRESS).not.toBe('in_progress');
    expect(ISSUE_STATUSES.IN_PROGRESS).not.toContain('_');
  });
});
