# Implementation Plan: Phase 4 Completion & Phase 5 Preparation

> **Last Updated**: 2026-01-26  
> **Total Tasks**: 23 atomic tasks (15-25 target achieved)  
> **Estimated Effort**: ~12-14 hours

## Overview

This plan addresses:
1. **Phase 4.5**: Status Constants Standardization (NOT IMPLEMENTED - spec exists but code missing)
2. **Phase 4.6**: Dialog Error Boundaries (NOT IMPLEMENTED - deferred to Phase 5)
3. **Phase 4.8**: Board Actions Menu Positioning (UX TESTING REQUIRED)
4. **Phase 4 Remaining**: Filter Builder, Hierarchical Display, Link Session UI
5. **Technical Debt**: Identified issues from post-Phase-4 audit

All specs are in `ralph-wiggum/specs/4.*.md`.

---

## Summary

| Phase | Priority | Est. Time | Tasks | Status |
|-------|----------|-----------|-------|--------|
| 4.5: Status Constants | HIGH | 2-3 hr | 1-4 | COMPLETE (v0.3.85) |
| 4.6: Error Boundaries | MEDIUM | 1-2 hr | 5-7 | NOT STARTED |
| 4.8: Menu Positioning | LOW | 30-60 min | 8-9 | UX TEST REQUIRED |
| Tech Debt (Quick) | LOW | 30 min | 10-12 | NOT STARTED |
| Phase 4 Filter Builder | HIGH | 3-4 hr | 13-17 | NOT STARTED |
| Phase 4 Hierarchical Display | MEDIUM | 2-3 hr | 18-20 | NOT STARTED |
| Phase 4 Link Session UI | MEDIUM | 2-3 hr | 21-23 | NOT STARTED |

---

## Tasks

### Phase 4.5: Status Constants Standardization

**Spec**: `specs/4.5-status-constants.md`  
**Current State**: Production uses `'in-progress'` (hyphen), tests use `'in_progress'` (underscore). No constants file exists.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1**: Create `src/lib/constants/statuses.ts` with `ISSUE_STATUSES` constant | `specs/4.5-status-constants.md:L17-29` | Done in v0.3.85 |
| [x] | **Task 2**: Update 3 production files to use `ISSUE_STATUSES` | `specs/4.5-status-constants.md:L34-37` | Done in v0.3.85 |
| [x] | **Task 3**: Update 6 test files to use `ISSUE_STATUSES` | `specs/4.5-status-constants.md:L39-45` | Done in v0.3.85 |
| [x] | **Task 4**: Create `src/lib/constants/__tests__/statuses.test.ts` validation test | `specs/4.5-status-constants.md:L65-85` | Done in v0.3.85 |

**Files to Update**:
- `src/lib/constants/statuses.ts` (CREATE)
- `src/features/boards/components/create-board-dialog.tsx`
- `src/app/project/[projectId]/board/page.tsx`
- `src/app/project/[projectId]/page.tsx`
- `src/lib/db/__tests__/repository-boards.test.ts`
- `src/services/__tests__/issue-service.test.ts`
- `src/services/__tests__/board-service.test.ts`
- `src/lib/db/__tests__/repository.test.ts`
- `src/contract/pm/__tests__/schemas.test.ts`
- `src/app/api/boards/__tests__/route.test.ts`
- `src/lib/constants/__tests__/statuses.test.ts` (CREATE)

**Verification**:
```bash
pnpm test
pnpm run build && pnpm run lint
```

---

### Phase 4.6: Dialog Error Boundaries

**Spec**: `specs/4.6-dialog-error-boundaries.md`  
**Current State**: No error boundary exists. `BoardActionsMenu` is not wrapped.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 5**: Create `src/components/ui/dialog-error-boundary.tsx` | `specs/4.6-dialog-error-boundaries.md:L19-56` | Done v0.3.86 - uses logger for error logging |
| [ ] | **Task 6**: Wrap `BoardActionsMenu` with `DialogErrorBoundary` in `app-sidebar.tsx` | `specs/4.6-dialog-error-boundaries.md:L59-70` | Import and wrap existing component |
| [ ] | **Task 7**: Test error boundary catches render errors gracefully | `specs/4.6-dialog-error-boundaries.md:L76-82` | Dev-only test by throwing in dialog |

**Files**:
- `src/components/ui/dialog-error-boundary.tsx` (CREATE)
- `src/components/layout/app-sidebar.tsx` (MODIFY)

**Verification**:
```bash
pnpm run build && pnpm run lint
# Manual: Verify sidebar remains functional when dialog errors
```

---

### Phase 4.8: Board Actions Menu Positioning

**Spec**: `specs/4.8-board-actions-menu-positioning.md`  
**Current State**: Using sibling pattern with `group/board` class. UX testing required before any code changes.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 8**: Execute UX testing checklist for collapsed sidebar mode | `specs/4.8-board-actions-menu-positioning.md:L101-124` | If all pass, document as intentional and skip Task 9 |
| [ ] | **Task 9**: (CONDITIONAL) Refactor to `SidebarMenuAction` slot pattern | `specs/4.8-board-actions-menu-positioning.md:L58-75` | Only if Task 8 reveals issues |

**Decision Gate**: If Task 8 passes all checks, mark Task 9 as CANCELLED and document findings.

**Verification**:
```bash
pnpm run build && pnpm run lint
# Manual: Checklist in spec 4.8
```

---

### Technical Debt (Quick Fixes)

**Source**: `docs/phase4-board-management-issues.md`  
**Current State**: 5 quick documentation/comment fixes identified.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 10**: Update BOLA TODO comment from "Phase 4" to "Future" | `docs/phase4-board-management-issues.md:L227-258` | board-service.ts:21-26, issue-service.ts |
| [ ] | **Task 11**: Add JSDoc header to `src/features/boards/index.ts` barrel | `docs/phase4-board-management-issues.md:L262-300` | Module-level documentation |
| [ ] | **Task 12**: Add clarifying comment for `useBoards(projectId ?? '')` pattern | `docs/phase4-board-management-issues.md:L34-63` | Explain `enabled` guard in app-sidebar.tsx |

**Files**:
- `src/services/board-service.ts`
- `src/services/issue-service.ts`
- `src/features/boards/index.ts`
- `src/components/layout/app-sidebar.tsx`

**Verification**:
```bash
pnpm run lint
```

---

### Phase 4 Remaining: Filter Builder

**Spec**: `docs/ROADMAP.md:L102` (spec file needs creation)  
**Current State**: Backend supports filtering, no UI exists.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 13**: Author spec `ralph-wiggum/specs/4.7-filter-builder.md` | - | Define filter UI requirements, available filters (status, type, assignee) |
| [ ] | **Task 14**: Create `src/features/boards/components/board-filter-controls.tsx` skeleton | - | Filter bar component with status dropdown |
| [ ] | **Task 15**: Implement status filter dropdown with `ISSUE_STATUSES` | - | Use shadcn Select component |
| [ ] | **Task 16**: Wire filter controls to `KanbanBoard` query parameters | - | Update `useIssues` to accept filter params |
| [ ] | **Task 17**: Add filter persistence to board state (optional) | - | Store active filters in URL or Zustand |

**Files**:
- `ralph-wiggum/specs/4.7-filter-builder.md` (CREATE)
- `src/features/boards/components/board-filter-controls.tsx` (CREATE)
- `src/features/kanban/components/kanban-board.tsx` (MODIFY)

**Verification**:
```bash
pnpm run build && pnpm run lint
# Manual: Filter tasks by status on board
```

---

### Phase 4 Remaining: Hierarchical Display

**Spec**: `docs/ROADMAP.md:L103` (spec file needs creation)  
**Current State**: Backend has `parentId`, UI strips it in mapping.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 18**: Author spec `ralph-wiggum/specs/4.9-hierarchical-display.md` | - | Define parent/child indicators on cards |
| [ ] | **Task 19**: Update `Task` type in `features/kanban/types.ts` to include `parentId` | - | Preserve hierarchy from API response |
| [ ] | **Task 20**: Update `TaskCard` to show parent indicator (icon/badge) | - | Small visual indicator when task has parent |

**Files**:
- `ralph-wiggum/specs/4.9-hierarchical-display.md` (CREATE)
- `src/features/kanban/types.ts` (MODIFY)
- `src/features/kanban/components/task-card.tsx` (MODIFY)

**Verification**:
```bash
pnpm run build && pnpm run lint
# Manual: Cards with parentId show hierarchy indicator
```

---

### Phase 4 Remaining: Link Session UI

**Spec**: `docs/ROADMAP.md:L104` (spec file needs creation)  
**Current State**: Backend fully supports session linking via API. No frontend UI.

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 21**: Author spec `ralph-wiggum/specs/4.10-link-session-ui.md` | - | Define modal for searching/linking OpenCode sessions |
| [ ] | **Task 22**: Create `src/features/sessions/components/link-session-dialog.tsx` | - | Search sessions, display matches, link button |
| [ ] | **Task 23**: Integrate link dialog into task details panel or card actions | - | Access from TaskCard or Infobar |

**Files**:
- `ralph-wiggum/specs/4.10-link-session-ui.md` (CREATE)
- `src/features/sessions/` (CREATE directory)
- `src/features/sessions/components/link-session-dialog.tsx` (CREATE)
- `src/features/kanban/components/kanban-board.tsx` or task details (MODIFY)

**Verification**:
```bash
pnpm run build && pnpm run lint
# Manual: Search for session, link to task, verify in DB
```

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked
- `[-]` Cancelled

---

## Task Dependency Graph

```
Phase 4.5 (Status Constants):
  1 (constants) → 2 (prod files) → 3 (test files) → 4 (validation test)

Phase 4.6 (Error Boundaries):
  5 (component) → 6 (wrap) → 7 (test)

Phase 4.8 (Menu Positioning):
  8 (UX test) → 9 (conditional refactor)

Tech Debt:
  10, 11, 12 (independent, parallel)

Filter Builder:
  13 (spec) → 14 (skeleton) → 15 (status filter) → 16 (wire up) → 17 (persistence)

Hierarchical Display:
  18 (spec) → 19 (types) → 20 (UI)

Link Session:
  21 (spec) → 22 (dialog) → 23 (integration)
```

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `src/lib/constants/statuses.ts` | CREATE | 4.5 |
| `src/lib/constants/__tests__/statuses.test.ts` | CREATE | 4.5 |
| `src/features/boards/components/create-board-dialog.tsx` | MODIFY | 4.5 |
| `src/app/project/[projectId]/board/page.tsx` | MODIFY | 4.5 |
| `src/app/project/[projectId]/page.tsx` | MODIFY | 4.5 |
| 6 test files | MODIFY | 4.5 |
| `src/components/ui/dialog-error-boundary.tsx` | CREATE | 4.6 |
| `src/components/layout/app-sidebar.tsx` | MODIFY | 4.6, 4.8, TD |
| `src/services/board-service.ts` | MODIFY | TD |
| `src/services/issue-service.ts` | MODIFY | TD |
| `src/features/boards/index.ts` | MODIFY | TD |
| `ralph-wiggum/specs/4.7-filter-builder.md` | CREATE | Filter |
| `src/features/boards/components/board-filter-controls.tsx` | CREATE | Filter |
| `src/features/kanban/components/kanban-board.tsx` | MODIFY | Filter |
| `ralph-wiggum/specs/4.9-hierarchical-display.md` | CREATE | Hierarchy |
| `src/features/kanban/types.ts` | MODIFY | Hierarchy |
| `src/features/kanban/components/task-card.tsx` | MODIFY | Hierarchy |
| `ralph-wiggum/specs/4.10-link-session-ui.md` | CREATE | Sessions |
| `src/features/sessions/` | CREATE | Sessions |
| `src/features/sessions/components/link-session-dialog.tsx` | CREATE | Sessions |

**Totals**: ~20 files (10 new, 10 modified)

---

## Prioritized Execution Order

**RECOMMENDED SEQUENCE:**

1. **Phase 4.5 (Tasks 1-4)** - HIGH priority, blocks consistency
2. **Tech Debt Quick (Tasks 10-12)** - LOW effort, parallel with 4.5
3. **Phase 4.8 Task 8** - UX testing gate
4. **Phase 4.6 (Tasks 5-7)** - MEDIUM priority, robustness
5. **Filter Builder (Tasks 13-17)** - HIGH priority per ROADMAP
6. **Hierarchical Display (Tasks 18-20)** - MEDIUM priority
7. **Link Session (Tasks 21-23)** - MEDIUM priority

---

## Success Criteria

```bash
cd OpenKanban
pnpm run build    # Build successful
pnpm run lint     # No errors
pnpm test         # All tests pass (130+ expected)
```

**Manual Verification Checklist:**
- [ ] Status constants used consistently (grep for string literals)
- [ ] Error boundary catches errors in dialogs
- [ ] Collapsed sidebar actions menu works (if applicable)
- [ ] Filter controls filter tasks on board
- [ ] Cards show parent indicator when applicable
- [ ] Session linking modal searches and links correctly

---

## Notes

- **Specs to Author**: Tasks 13, 18, 21 require spec creation before implementation
- **Database Audit**: Task 1 should include `SELECT DISTINCT status FROM issues` to verify existing data
- **TDD Preferred**: Task 4 writes validation tests before modifying production code
- **UX Gate**: Task 9 only executes if Task 8 finds issues

---

## Completed Work (Phase 4.1-4.4)

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
