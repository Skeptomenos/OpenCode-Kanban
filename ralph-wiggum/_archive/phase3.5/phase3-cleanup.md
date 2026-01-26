# Implementation Plan: Phase 3.5 Cleanup

> **Status:** Ready for Implementation
> **Objective:** Fix the 11 issues identified in the Post-Refactor Audit.
> **Specs:**
> - `ralph-wiggum/specs/354-service-completion.md`
> - `ralph-wiggum/specs/355-code-consistency.md`
> - `ralph-wiggum/specs/356-tech-debt.md`

## Task Checklist

### Priority 1: Service Layer Completion
- [ ] Implement `OpenCodeService`
- [ ] Add Session Linking methods to `IssueService`
- [ ] Refactor Session Routes to use Services
- [ ] Add `.strip().parse()` to Board API fetchers

### Priority 2: Code Consistency
- [ ] Update `date-utils.ts` and `logger.ts`
- [ ] Add `.strict()` to all support schemas
- [ ] Deduplicate types in `api.ts`

### Priority 3: Technical Debt
- [ ] Modernize Projects feature (React Query)
- [ ] Add tests for Session Routes

## Verification
- `npm run test` (All 80+ tests pass)
- `npm run build` (No type errors)
- Manual check: Board creation, Session linking, Project list
