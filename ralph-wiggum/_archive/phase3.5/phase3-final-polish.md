# Implementation Plan: Phase 3.5 Final Polish

> **Status:** Ready for Implementation
> **Objective:** Fix remaining 22 low/medium issues from post-audit.
> **Specs:**
> - `ralph-wiggum/specs/357-type-safety.md`
> - `ralph-wiggum/specs/358-code-quality.md`
> - `ralph-wiggum/specs/359-documentation.md`

## Task Checklist

### Part 1: Type Safety (Category A)
- [ ] Fix repository unsafe JSON cast
- [ ] Fix singleton documentation
- [ ] Fix FormData unsafe casts
- [ ] Fix dnd-kit ID casts
- [ ] Fix Form context safety

### Part 2: Code Quality (Category B-F)
- [ ] Strict ApiSuccessSchema
- [ ] Refine error handling (adapter logs, rollback return, session error code)
- [ ] Architecture (doc comment, remove redundant store state)
- [ ] React Patterns (Optimistic task creation, throwOnError)
- [ ] Refactor (Query keys factory, hoisting helpers, pagination)

### Part 3: Documentation (Category G)
- [ ] Update Roadmap/Readme
- [ ] Consolidate docs folder

## Verification
- `npm run build`
- `npm run test`
