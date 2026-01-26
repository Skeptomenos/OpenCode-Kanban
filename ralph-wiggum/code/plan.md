# Implementation Plan: Phase 4 Completion

> **Last Updated**: 2026-01-26
> **Total Tasks**: 25 atomic tasks (15-25 target achieved)
> **Estimated Effort**: ~14-16 hours

## Overview

This plan addresses:
1. **Critical Blocker**: Fix build error in query-keys.ts (introduced by spec work)
2. **Phase 4.7**: Filter Builder - UI controls to filter Kanban tasks by status
3. **Phase 4.9**: Hierarchical Display - Show parent/child relationships on cards
4. **Phase 4.10**: Link Session UI - Modal to search and link OpenCode sessions

All specs are in `ralph-wiggum/specs/4.*.md`.

---

## Current Status

| Phase | Priority | Est. Time | Tasks | Status |
|-------|----------|-----------|-------|--------|
| 4.5: Status Constants | HIGH | 2-3 hr | 1-4 | COMPLETE (v0.3.85) |
| 4.6: Error Boundaries | MEDIUM | 1-2 hr | 5-7 | COMPLETE (v0.3.88) |
| 4.8: Menu Positioning | LOW | 30-60 min | 8-9 | COMPLETE (v0.3.89) |
| Tech Debt (Quick) | LOW | 30 min | 10-12 | COMPLETE |
| **BUILD FIX** | **CRITICAL** | 15 min | 13.5 | **COMPLETE (v0.3.92)** |
| Phase 4.7 Filter Builder | HIGH | 2-3 hr | 13-15 | COMPLETE (v0.3.93) |
| Phase 4.9 Hierarchical Display | MEDIUM | 3-4 hr | 16-20 | COMPLETE (v0.3.98) |
| Phase 4.10 Link Session UI | MEDIUM | 3-4 hr | 21-25 | NOT STARTED |

---

## Tasks

### Phase 4.5: Status Constants Standardization ✅ COMPLETE

**Spec**: `specs/4.5-status-constants.md`

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1**: Create `src/lib/constants/statuses.ts` | `specs/4.5-status-constants.md:L17-29` | Done in v0.3.85 |
| [x] | **Task 2**: Update 3 production files | `specs/4.5-status-constants.md:L34-37` | Done in v0.3.85 |
| [x] | **Task 3**: Update 6 test files | `specs/4.5-status-constants.md:L39-45` | Done in v0.3.85 |
| [x] | **Task 4**: Create validation test | `specs/4.5-status-constants.md:L65-85` | Done in v0.3.85 |

---

### Phase 4.6: Dialog Error Boundaries ✅ COMPLETE

**Spec**: `specs/4.6-dialog-error-boundaries.md`

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 5**: Create `dialog-error-boundary.tsx` | `specs/4.6-dialog-error-boundaries.md:L19-56` | Done v0.3.86 |
| [x] | **Task 6**: Wrap `BoardActionsMenu` with boundary | `specs/4.6-dialog-error-boundaries.md:L59-70` | Done v0.3.87 |
| [x] | **Task 7**: Create unit test suite | `specs/4.6-dialog-error-boundaries.md:L76-82` | Done v0.3.88 (6 tests) |

---

### Phase 4.8: Board Actions Menu Positioning ✅ COMPLETE

**Spec**: `specs/4.8-board-actions-menu-positioning.md`

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 8**: Execute UX testing checklist | `specs/4.8-board-actions-menu-positioning.md:L101-124` | Done v0.3.89 - All PASS |
| [-] | **Task 9**: (CONDITIONAL) Refactor to slot pattern | - | CANCELLED - Task 8 passed |

---

### Technical Debt (Quick Fixes) ✅ COMPLETE

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 10**: Update BOLA TODO comment | `docs/phase4-board-management-issues.md:L227-258` | Done v0.3.90 |
| [x] | **Task 11**: JSDoc header for boards barrel | `docs/phase4-board-management-issues.md:L262-300` | Already present |
| [x] | **Task 12**: Clarifying comment for useBoards pattern | `docs/phase4-board-management-issues.md:L34-63` | Done |

---

### Phase 4.7: Filter Builder

**Spec**: `specs/4.7-filter-builder.md`
**Current State**: COMPLETE - Filter dropdown implemented and integrated.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 13**: Author spec `4.7-filter-builder.md` | - | Done v0.3.91 |
| [x] | **Task 13.5**: Fix query-keys.ts build error | `src/lib/query-keys.ts:L42` | Done v0.3.92 - Removed `.filter()` from kanban key |
| [x] | **Task 14**: Create `BoardFilterControls` component | `specs/4.7-filter-builder.md:L126-210` | Done v0.3.93 - shadcn Select with ISSUE_STATUSES |
| [x] | **Task 15**: Integrate filter controls with KanbanBoard | `specs/4.7-filter-builder.md:L224-330` | Done v0.3.93 - Wire filters to useQuery, local state |

**Build Error Details**:
- Line 42: `['kanban', projectId, boardId, filters].filter((x) => x !== undefined) as const`
- Problem: `as const` cannot be applied to result of `.filter()` (returns mutable array)
- Fix: Remove `.filter()` entirely - TanStack Query handles `undefined` in keys correctly

**Files**:
- `src/lib/query-keys.ts` (FIX - Task 13.5)
- `src/features/boards/components/board-filter-controls.tsx` (CREATE - Task 14)
- `src/features/kanban/components/kanban-board.tsx` (MODIFY - Task 15)

---

### Phase 4.9: Hierarchical Display

**Spec**: `specs/4.9-hierarchical-display.md`
**Current State**: Backend has `parentId` on issues, but frontend strips it in mapping.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 16**: Extend Task type with ParentInfo | `specs/4.9-hierarchical-display.md:L84-131` | Done v0.3.94 - Added ParentInfo interface and parent field to Task |
| [x] | **Task 17**: Update repository with parent metadata | `specs/4.9-hierarchical-display.md:L134-190` | Done v0.3.95 - Added IssueWithParent type, listIssues returns parent info via batch query |
| [x] | **Task 18**: Update frontend API mapping | `specs/4.9-hierarchical-display.md:L193-252` | Done v0.3.96 - Updated fetchIssues return type to IssueWithParent[], updated IssueService |
| [x] | **Task 19**: Map parent in fetchKanbanData | `specs/4.9-hierarchical-display.md:L255-302` | Done v0.3.97 - Added parent field to Task mapping in both projectId and board paths |
| [x] | **Task 20**: Add parent badge to TaskCard | `specs/4.9-hierarchical-display.md:L305-406` | Done v0.3.98 - Added PARENT_TYPE_ICONS mapping, parent badge UI with type icon + truncated title |

**Files**:
- `src/features/kanban/types.ts` (MODIFY - Task 16)
- `src/lib/db/repository.ts` (MODIFY - Task 17)
- `src/features/kanban/api.ts` (MODIFY - Task 18)
- `src/features/kanban/components/kanban-board.tsx` (MODIFY - Task 19)
- `src/features/kanban/components/task-card.tsx` (MODIFY - Task 20)

---

### Phase 4.10: Link Session UI

**Spec**: `specs/4.10-link-session-ui.md`
**Current State**: Backend fully implemented. Frontend missing entirely.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 21**: Create session types and query keys | `specs/4.10-link-session-ui.md:L88-192` | Done v0.3.99 - Session, SessionLink, SessionsResponse types + query keys |
| [x] | **Task 22**: Create session query and mutation hooks | `specs/4.10-link-session-ui.md:L195-369` | Done v0.4.0 - useSessions, useLinkSession, useUnlinkSession, useSessionLinks |
| [x] | **Task 23**: Create LinkSessionDialog component | `specs/4.10-link-session-ui.md:L372-537` | Done v0.4.1 - Search/filter sessions, link button, loading/empty states |
| [x] | **Task 24**: Create feature barrel export | `specs/4.10-link-session-ui.md:L553-590` | Done v0.4.2 - Export components, hooks, types |
| [ ] | **Task 25**: Integrate with task details | `specs/4.10-link-session-ui.md:L593-671` | Add to infobar/card actions |

**Files**:
- `src/features/sessions/types.ts` (CREATE - Task 21)
- `src/lib/query-keys.ts` (MODIFY - Task 21)
- `src/features/sessions/hooks/use-sessions.ts` (CREATE - Task 22)
- `src/features/sessions/hooks/use-session-mutations.ts` (CREATE - Task 22)
- `src/features/sessions/components/link-session-dialog.tsx` (CREATE - Task 23)
- `src/features/sessions/index.ts` (CREATE - Task 24)
- `src/features/kanban/components/task-card.tsx` (MODIFY - Task 25)

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked
- `[-]` Cancelled

---

## Task Dependency Graph

```
BUILD FIX (Critical Path):
  13.5 (query-keys fix) → 14 → 15

Filter Builder:
  13 (spec) ✓ → 13.5 (BLOCKER) → 14 (component) → 15 (integration)

Hierarchical Display:
  16 (types) → 17 (repository) → 18 (API) → 19 (mapping) → 20 (UI)

Link Session:
  21 (types) → 22 (hooks) → 23 (dialog) → 24 (barrel) → 25 (integration)
```

---

## Recommended Execution Order

| Priority | Phase | Tasks | Reason |
|----------|-------|-------|--------|
| **P0** | Fix Build | 13.5 | **CRITICAL BLOCKER** - nothing else can proceed |
| **P1** | Filter Builder | 14-15 | Already started, simplest remaining feature |
| **P2** | Link Session UI | 21-25 | Backend complete, high user value for OpenCode integration |
| **P3** | Hierarchical Display | 16-20 | Requires backend changes (repository JOIN) |

**Rationale**:
- Link Session before Hierarchical because backend is fully implemented
- Link Session is the "killer feature" for OpenCode integration
- Hierarchical requires careful Drizzle ORM self-join handling

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `src/lib/query-keys.ts` | FIX | 4.7 (blocker) |
| `src/features/boards/components/board-filter-controls.tsx` | CREATE | 4.7 |
| `src/features/kanban/components/kanban-board.tsx` | MODIFY | 4.7, 4.9 |
| `src/features/kanban/types.ts` | MODIFY | 4.9 |
| `src/lib/db/repository.ts` | MODIFY | 4.9 |
| `src/features/kanban/api.ts` | MODIFY | 4.9 |
| `src/features/kanban/components/task-card.tsx` | MODIFY | 4.9, 4.10 |
| `src/features/sessions/types.ts` | CREATE | 4.10 |
| `src/features/sessions/hooks/use-sessions.ts` | CREATE | 4.10 |
| `src/features/sessions/hooks/use-session-mutations.ts` | CREATE | 4.10 |
| `src/features/sessions/components/link-session-dialog.tsx` | CREATE | 4.10 |
| `src/features/sessions/index.ts` | CREATE | 4.10 |

**Totals**: ~12 files (6 new, 6 modified)

---

## Success Criteria

```bash
pnpm run build    # Build successful (0 errors)
pnpm run lint     # No errors
pnpm test         # All tests pass (140+ expected)
```

**Manual Verification Checklist**:
- [x] Build passes (Fixed in Task 13.5)
- [x] Filter dropdown filters tasks on board (Done v0.3.93)
- [x] Cards show parent indicator when applicable (Done v0.3.98)
- [ ] Session linking modal searches and links correctly
- [ ] Linked sessions visible in task details

---

## Completed Work (Phase 4.1-4.4) ✅

All 18 tasks from Phase 4 Board Management are complete (v0.3.84):

### Phase 4.1: Backend Core & Filtering ✅
| Status | Task | Notes |
|--------|------|-------|
| [x] | **Task 1**: Create `repository-boards.test.ts` | TDD: 4 test cases |
| [x] | **Task 2**: Update `listBoards` with filter | In-memory filtering |
| [x] | **Task 3**: Update `BoardService.listBoards` | Pass filter param |
| [x] | **Task 4**: Update `GET /api/boards` | Parse parentId query |

### Phase 4.2: Frontend State & API ✅
| Status | Task | Notes |
|--------|------|-------|
| [x] | **Task 5**: Update `fetchBoards` | Accept parentId filter |
| [x] | **Task 6**: Update `CreateBoardInput` type | Add filters field |
| [x] | **Task 7**: Add `deleteBoard` API | DELETE method |
| [x] | **Task 8**: Add `boards` query key | Factory pattern |
| [x] | **Task 9**: Create board hooks | use-boards.ts, use-board-mutations.ts |

### Phase 4.3: UI Components ✅
| Status | Task | Notes |
|--------|------|-------|
| [x] | **Task 10**: CreateBoardDialog | v0.3.78 |
| [x] | **Task 11**: DeleteBoardDialog | v0.3.79 |
| [x] | **Task 12**: RenameBoardDialog | v0.3.80 |
| [x] | **Task 13**: BoardActionsMenu | v0.3.81 |
| [x] | **Task 14**: Barrel export | v0.3.81 |

### Phase 4.4: Integration ✅
| Status | Task | Notes |
|--------|------|-------|
| [x] | **Task 15**: Project Boards sidebar group | v0.3.82 |
| [x] | **Task 16**: Loading/error/empty states | v0.3.83 |
| [x] | **Task 17**: Wire dialogs in sidebar | v0.3.84 |
| [x] | **Task 18**: Full verification | 130 tests pass |

---

## Notes

- **Fixed**: Task 13.5 (build fix) completed in v0.3.92
- **Backend exists for 4.10**: All session linking API endpoints are implemented
- **Backend changes for 4.9**: Repository needs self-join for parent metadata
- **Test count**: 140 tests currently passing (build broken doesn't affect tests)
