# Implementation Plan: Phase 3.6 - Critical Fixes & Code Organization

> **Status:** Ready for Implementation  
> **Specs:** 
> - `ralph-wiggum/specs/360-critical-fixes.md` (Critical)
> - `ralph-wiggum/specs/361-code-organization.md` (Barrels)
> **Reference:** `OpenKanban/docs/ROADMAP.md`  
> **Created:** 2026-01-26  
> **Estimated Effort:** ~2 hours

---

## Executive Summary

This plan addresses **architectural issues** from Phase 3.5 audit that must be fixed before proceeding to Phase 4. It consolidates Specs 360 (critical fixes) and 361 (code organization) into a cohesive set of 15 tasks.

**Deferred to Phase 3.6b:**
- Spec 362 (Error Handling refinements)
- Spec 363 (Type Safety & Component Tests)
- Spec 364 (Documentation & Hygiene)

**Priority Order:**
1. Circular dependency fix (types extraction)
2. Query side effect removal
3. Silent catch block logging
4. Route integration tests
5. Barrel file standardization

---

## Tasks

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Create `src/features/kanban/types.ts` - extract `Column` interface from `board-column.tsx:15` and `Task` type from `store.ts:4` | `360:L13-15` | Done v0.3.57: Extracted all 6 types to types.ts |
| [x] | **Task 1.2**: Update imports in `store.ts`, `board-column.tsx`, `task-card.tsx`, `kanban-board.tsx` to use new `types.ts` | `360:L18-20` | Done v0.3.57: Also updated utils/index.ts, hooks/use-column-mutations.ts |
| [x] | **Task 1.3**: Verify circular dependency resolved with `npm run build` | `360:L88` | Done v0.3.57: Build + lint + tests all pass |
| [x] | **Task 2.1**: Refactor `resolveBoardId()` in `kanban-board.tsx` - remove `createBoard()` call, return null or throw if no board found | `360:L27-46` | Done v0.3.58: Removed createBoard call, throws if no board |
| [x] | **Task 2.2**: Handle "no board" state in parent route/component - show 404 or redirect | `360:L44-46` | Done v0.3.58: Verified parent route + error boundary handle this |
| [x] | **Task 3.1**: Add `logger.warn` to all 5 silent JSON.parse catch blocks in `repository.ts` | `360:L55-64` | Done v0.3.59: Added logger.warn to lines 332, 390, 609, 642, 649 |
| [x] | **Task 4.1**: Create `src/lib/db/test-utils.ts` - centralize `createTestDb` helper | `360:L120-138` | Done v0.3.60: Extracted createTestDb, updated issue-service.test.ts imports |
| [ ] | **Task 4.2**: Create `src/app/api/issues/__tests__/route.test.ts` with GET, POST, filter tests | `360:L70-77` | 3 test cases using createTestDb integration pattern |
| [ ] | **Task 4.3**: Create `src/app/api/boards/__tests__/route.test.ts` with GET, POST tests | `360:L78-84` | 2 test cases using createTestDb integration pattern |
| [ ] | **Task 5.1**: Add `WelcomeScreen` export to `src/features/projects/index.ts` | `361:L13-15` | Currently missing from barrel |
| [ ] | **Task 5.2**: Create `src/features/kanban/index.ts` barrel file | `361:L25-30` | Export: KanbanBoard, KanbanViewPage, useTaskStore, Column mutations hook, API functions, types |
| [ ] | **Task 5.3**: Refactor `src/features/kanban/utils/index.ts` - move `hasDraggableData` logic to `helpers.ts`, make index.ts pure re-export | `361:L33-34`, `364:L33-34` | Pseudo-barrel fix |
| [ ] | **Task 5.4**: Update app layer imports to use barrel exports | `361:L41` | `src/app/page.tsx`, `src/app/project/[projectId]/board/[boardId]/page.tsx` |
| [ ] | **Task 6.1**: Run full verification suite | `360:L87-90` | `npm run build && npm run test && npm run lint` |
| [ ] | **Task 6.2**: Commit changes with message: "fix: resolve Phase 3.6a critical issues" | - | Only after all verification passes |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Task Details

### Task Group 1: Circular Dependency Fix (A.1)

**Problem:** `store.ts` → `board-column.tsx` → `store.ts` creates a cycle.

**Solution:** Extract shared types to a central `types.ts`:
```
store.ts → types.ts ← board-column.tsx
     ↓                      ↓
  (uses Column)        (uses Task)
```

**Files to create:**
- `src/features/kanban/types.ts`

**Files to modify:**
- `src/features/kanban/utils/store.ts`
- `src/features/kanban/components/board-column.tsx`
- `src/features/kanban/components/task-card.tsx`
- `src/features/kanban/components/kanban-board.tsx`

**Types to extract:**
- `Task` (from store.ts:4)
- `Column` (from board-column.tsx:15)
- `ColumnDragData` (from board-column.tsx)
- `TaskDragData` (from task-card.tsx)
- `ColumnType`, `TaskType` constants

---

### Task Group 2: Query Side Effect Fix (A.5)

**Problem:** `resolveBoardId()` in `kanban-board.tsx:49-60` calls `createBoard()` when no boards exist. This is a mutation inside a query function, violating React Query principles.

**Current flow:**
```
useQuery → fetchKanbanData → resolveBoardId → createBoard (MUTATION!)
```

**Target flow:**
```
Route/Parent → ensures board exists (or shows create UI)
useQuery → fetchKanbanData → resolveBoardId → returns boardId or throws
```

**Decision:** If `KanbanBoard` receives a `boardId` that doesn't exist, the error boundary should catch and show 404. Board creation is a user action, not auto-magic.

**Files to modify:**
- `src/features/kanban/components/kanban-board.tsx`
- `src/app/project/[projectId]/board/[boardId]/page.tsx` (verify handling)

---

### Task Group 3: Repository Logging (B.1)

**Problem:** Silent catch blocks hide data corruption issues.

**Pattern to apply:**
```typescript
try {
  return JSON.parse(result.value);
} catch (error) {
  logger.warn('Failed to parse [field]', { context, error: String(error) });
  return fallbackValue;
}
```

**File:** `src/lib/db/repository.ts`

**Locations (5 total):**
| Line | Function | Field |
|------|----------|-------|
| 331 | `getIssueWithRelations` | `metadata` |
| 388 | `getIssuesWithRelations` | `metadata` |
| 606 | `getConfig` | config value |
| 638 | `parseBoardFields` | `filters` |
| 644 | `parseBoardFields` | `columnConfig` |

---

### Task Group 4: Route Integration Tests (E.1)

**Pre-work:** Extract `createTestDb` to `src/lib/db/test-utils.ts` to avoid duplication.

**Pattern:** Follow `src/app/api/sessions/__tests__/route.test.ts`

**Test scaffold:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from '@/lib/db/test-utils';

describe('/api/issues', () => {
  beforeEach(() => {
    // Mock database connection
  });

  it('GET returns list of issues', async () => { ... });
  it('POST creates an issue', async () => { ... });
  it('GET with parentId filters correctly', async () => { ... });
});
```

**Files to create:**
- `src/lib/db/test-utils.ts`
- `src/app/api/issues/__tests__/route.test.ts`
- `src/app/api/boards/__tests__/route.test.ts`

---

### Task Group 5: Barrel File Standardization (A.2, A.3, A.4)

**Goal:** All feature imports should go through barrel files.

**Current state:**
- `src/features/projects/index.ts` exists but missing `WelcomeScreen`
- `src/features/kanban/index.ts` does NOT exist
- App layer uses direct imports: `@/features/kanban/components/kanban-view-page`

**Target state:**
- All features have complete barrel files
- App layer imports: `@/features/kanban`

**Files to create:**
- `src/features/kanban/index.ts`
- `src/features/kanban/utils/helpers.ts` (move logic from utils/index.ts)

**Files to modify:**
- `src/features/projects/index.ts` (add WelcomeScreen)
- `src/features/kanban/utils/index.ts` (make pure re-export)
- `src/app/page.tsx` (use barrel import)
- `src/app/project/[projectId]/board/[boardId]/page.tsx` (use barrel import)

---

## Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Build passes | `npm run build` | Exit 0, no circular dep warnings |
| Tests pass | `npm run test` | All tests green (including new route tests) |
| Lint passes | `npm run lint` | No errors |
| Circular fixed | `grep "import.*Column.*board-column" store.ts` | No matches |
| Types centralized | `ls src/features/kanban/types.ts` | File exists |
| Logging added | `grep "logger.warn" repository.ts \| wc -l` | ≥5 matches |
| Barrel complete | `grep "export.*KanbanBoard" src/features/kanban/index.ts` | Match found |

---

## Dependencies

- None external. All work is within existing codebase.
- Follows existing patterns in `src/services/__tests__/` for testing.

---

## Notes

1. **Pre-Phase 4 (pnpm migration)** in ROADMAP should come AFTER this Phase 3.6a.

2. **Phase 3.6b (Polish)** deferred:
   - Spec 362: Error handling refinements
   - Spec 363: Type safety (form.tsx, chart.tsx) + component test setup
   - Spec 364: Documentation consolidation, npmrc cleanup

3. **BOLA enforcement** (`@todo Phase 4`) in services is explicitly deferred - not part of this plan.

---

## Change Log

| Date | Change |
|------|--------|
| 2026-01-26 | Initial plan created (Spec 360 only) |
| 2026-01-26 | Extended to include Spec 361 (barrels), consolidated tasks 18→15 |
