# Code Review Plan

## Summary

| Metric | Value |
|--------|-------|
| **Review Target** | codebase |
| **Branch** | main |
| **Files** | 0 reviewed / 35 total |
| **Findings** | 0 (0 critical, 0 high) |
| **Status** | Not Started |

## Project Context

- **Application**: OpenKanban - local-first Kanban board for managing OpenCode sessions
- **Stack**: Next.js 16 (App Router), TypeScript, Shadcn UI, Zustand, SQLite (Drizzle ORM)
- **Architecture**: 3-layer (Presentation -> Service -> Data)
- **Security Model**: Local-first (no auth layer). Security = data integrity + safe filesystem access

### Key Architectural Notes
1. **OpenCode Contract**: Data from `~/.local/share/opencode/storage` is validated via Zod schemas
2. **Validation**: Input validation via Zod schemas in `src/contract/pm/schemas.ts`
3. **API Pattern**: Envelope pattern `{ success, data, error }` for consistent responses

---

## Review Items

### Priority 0 - Critical (Security, Data Access, Validation)

| Status | File | Focus Areas | Findings |
|--------|------|-------------|----------|
| [ ] | `src/contract/opencode/adapter.ts` | Path traversal, FS errors, cache TTL, I/O performance | - |
| [ ] | `src/contract/opencode/schemas.ts` | Schema completeness, graceful parse failures | - |
| [ ] | `src/contract/pm/schemas.ts` | Input bounds (length limits), required field validation | - |
| [ ] | `src/lib/db/connection.ts` | Connection singleton safety, raw SQL injection, PRAGMA settings | - |
| [ ] | `src/lib/db/repository.ts` | Transaction integrity, N+1 prevention, JSON parsing safety | - |
| [ ] | `src/app/api/issues/route.ts` | Request validation, error envelope, auth bypass | - |
| [ ] | `src/app/api/issues/[id]/route.ts` | ID validation, PATCH/DELETE safety | - |
| [ ] | `src/app/api/sessions/route.ts` | Query param validation, error handling | - |

### Priority 1 - Core Logic (Business Logic, APIs, State)

| Status | File | Focus Areas | Findings |
|--------|------|-------------|----------|
| [ ] | `src/services/issue-service.ts` | Sort order algorithm (float precision), edge cases | - |
| [ ] | `src/services/board-service.ts` | Column config validation, board lifecycle | - |
| [ ] | `src/services/opencode-service.ts` | Service delegation, error propagation | - |
| [ ] | `src/features/kanban/utils/store.ts` | State consistency, optimistic updates | - |
| [ ] | `src/app/api/issues/[id]/move/route.ts` | Move validation, revert on failure | - |
| [ ] | `src/app/api/boards/route.ts` | Board creation validation | - |
| [ ] | `src/app/api/boards/[id]/route.ts` | Board updates, column config changes | - |
| [ ] | `src/features/kanban/api.ts` | API client error handling | - |
| [ ] | `src/features/projects/api.ts` | API client error handling | - |

### Priority 2 - Integration (DB, External Files)

| Status | File | Focus Areas | Findings |
|--------|------|-------------|----------|
| [ ] | `src/lib/db/schema.ts` | Schema correctness, constraints, indexes | - |
| [ ] | `src/contract/opencode/repository.ts` | Interface completeness | - |
| [ ] | `src/app/api/issues/[id]/sessions/route.ts` | Session linking integrity | - |
| [ ] | `src/app/api/issues/[id]/sessions/[sessionId]/route.ts` | Session unlinking safety | - |
| [ ] | `src/app/api/sessions/[id]/route.ts` | Single session fetch | - |
| [ ] | `drizzle.config.ts` | Migration config correctness | - |

### Priority 3 - UI/Presentation (Forms, Components)

| Status | File | Focus Areas | Findings |
|--------|------|-------------|----------|
| [ ] | `src/features/kanban/components/kanban-board.tsx` | DnD edge cases, accessibility | - |
| [ ] | `src/features/kanban/components/new-task-dialog.tsx` | Form validation, XSS prevention | - |
| [ ] | `src/features/sessions/components/link-session-dialog.tsx` | Session selection validation | - |
| [ ] | `src/features/projects/components/create-project-dialog.tsx` | Form validation | - |
| [ ] | `src/features/boards/components/create-board-dialog.tsx` | Form validation | - |
| [ ] | `src/components/ui/dialog-error-boundary.tsx` | Error boundary coverage | - |

### Priority 4 - Configuration

| Status | File | Focus Areas | Findings |
|--------|------|-------------|----------|
| [ ] | `next.config.ts` | Security headers, env exposure | - |
| [ ] | `src/lib/constants/statuses.ts` | Status enum correctness | - |
| [ ] | `src/lib/constants/board-defaults.ts` | Default value safety | - |
| [ ] | `src/lib/logger.ts` | Sensitive data logging prevention | - |
| [ ] | `src/lib/query-client.ts` | Cache settings, stale time | - |

---

## Known Concerns (from AGENTS.md & Discovery)

1. **No Auth Layer**: Application is local-first; access to machine = access to data
2. **External Data**: OpenCode sessions come from external filesystem, validated via Zod
3. **Raw SQL**: `connection.ts` contains raw SQL for bootstrap; verify it's strictly static
4. **Float Precision**: `issue-service.ts` uses fractional sort orders; watch for precision loss
5. **I/O Pattern**: `adapter.ts` has O(N*M) I/O for messages with parts; potential bottleneck

---

## Approval Criteria

- [ ] No critical/high severity findings unaddressed
- [ ] All security concerns documented
- [ ] Code follows project conventions (AGENTS.md, QUALITY.md)
- [ ] Test coverage exists for critical paths (P0/P1)

---

## Review Log

| Date | File | Result |
|------|------|--------|
| - | - | - |
