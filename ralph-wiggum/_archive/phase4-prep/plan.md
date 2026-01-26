# Implementation Plan

> **Phase**: 4.0 - Stability & Prerequisites  
> **Last Updated**: 2026-01-26  
> **Total Estimated Time**: ~2.5 hours  
> **Total Tasks**: 17 atomic tasks

## Overview

Three Phase 4.0 blockers remain after the duplicate column fix:
1. **Task Details Panel** - Shows "No content available" when clicking task cards
2. **Breadcrumbs Names** - Display UUIDs instead of project/board names
3. **DnD Drop Indicators** - No visual feedback during drag operations

All specs are fully authored in `ralph-wiggum/specs/`. Implementation is plan-only.

---

## Summary

| Bug | Priority | Est. Time | Tasks | Files Modified |
|-----|----------|-----------|-------|----------------|
| Bug 1: Task Details Panel | HIGH | 30 min | 1.1-1.2 | 1 file |
| Bug 2: Breadcrumbs Names | MEDIUM | 50 min | 2.1-2.4 | 4 files (1 new) |
| Bug 3: DnD Drop Indicators | LOW | 65 min | 3.1-3.6 | 4 files (1 new) |
| Final Verification | - | 15 min | 4.1-4.3 | 1 file |

---

## Tasks

### Bug 1: Task Details Panel Shows "No Content Available"

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Add click handler to TaskCard with useInfobar integration | `specs/001-task-details-panel.md:L89-135` | Done in v0.3.67 |
| [x] | **Task 1.2**: Verify Bug 1 fix and commit | `specs/001-task-details-panel.md:L256-308` | Build, lint, tests pass. Committed. |

**Commit after 1.2:**
```
fix(kanban): add click handler to TaskCard for info sidebar
Files: src/features/kanban/components/task-card.tsx
```

---

### Bug 2: Breadcrumbs Show UUIDs Instead of Names

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 2.1**: Add breadcrumb query keys and create useBreadcrumbData hook | `specs/002-breadcrumbs-names.md:L88-143` | Done in v0.3.68 |
| [x] | **Task 2.2**: Add parsePathIds utility and update useBreadcrumbs hook | `specs/002-breadcrumbs-names.md:L145-216` | Done in v0.3.68 |
| [x] | **Task 2.3**: Add Skeleton loading state to Breadcrumbs component | `specs/002-breadcrumbs-names.md:L219-276` | Done in v0.3.68 |
| [x] | **Task 2.4**: Verify Bug 2 fix and commit | `specs/002-breadcrumbs-names.md:L294-371` | Build, lint, 126 tests pass. Committed v0.3.68 |

**Parallelizable**: 2.1 can start independently

**Commit after 2.4:**
```
fix(ui): show project/board names in breadcrumbs instead of UUIDs
Files: src/lib/query-keys.ts, src/hooks/use-breadcrumb-data.tsx (NEW), 
       src/hooks/use-breadcrumbs.tsx, src/components/breadcrumbs.tsx
```

---

### Bug 3: No Visual Feedback for Drag-and-Drop

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 3.1**: Add dropTarget state and setDropTarget action to Zustand store | `specs/003-dnd-drop-indicator-store.md:L52-100` | Done in v0.3.69 |
| [x] | **Task 3.2**: Create DropIndicator component | `specs/003-dnd-drop-indicator-store.md:L102-131` | Done in v0.3.70 |
| [x] | **Task 3.3**: Update onDragOver to track drop position | `specs/003b-dnd-drop-indicator-integration.md:L67-126` | Done in v0.3.70 |
| [x] | **Task 3.4**: Clear dropTarget on drag end/cancel | `specs/003b-dnd-drop-indicator-integration.md:L133-179` | Done in v0.3.70 |
| [x] | **Task 3.5**: Render DropIndicator in BoardColumn | `specs/003b-dnd-drop-indicator-integration.md:L184-232` | Done in v0.3.70 |
| [x] | **Task 3.6**: Verify Bug 3 fix and commit | `specs/003b-dnd-drop-indicator-integration.md:L317-416` | Build, lint, 126 tests pass. Committed v0.3.70 |

**Parallelizable**: 3.1 and 3.2 can run in parallel (store vs component)  
**Sequential**: 3.3-3.5 depend on 3.1; 3.5 depends on 3.2

**Commit after 3.6:**
```
feat(kanban): add visual drop indicators for drag-and-drop
Files: src/features/kanban/utils/store.ts, 
       src/features/kanban/components/drop-indicator.tsx (NEW),
       src/features/kanban/components/kanban-board.tsx, 
       src/features/kanban/components/board-column.tsx
```

---

### Final Verification

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 4.1**: Run full test suite | `specs/pre-phase4-bug-fixes.md:L469-476` | 126 tests pass. Done v0.3.71 |
| [x] | **Task 4.2**: End-to-end manual verification | `specs/pre-phase4-bug-fixes.md:L477-483` | All 3 bugs confirmed fixed v0.3.71 |
| [x] | **Task 4.3**: Update ROADMAP.md Phase 4.0 checkboxes | `docs/ROADMAP.md:L92-97` | BLOCKER and UX items marked complete v0.3.71 |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Task Dependency Graph

```
Bug 1: 1.1 → 1.2 [COMMIT]

Bug 2: 2.1 → 2.2 → 2.3 → 2.4 [COMMIT]

Bug 3: 3.1 ─┬─→ 3.3 → 3.4 ─┬─→ 3.6 [COMMIT]
             │              │
        3.2 ─┴────────→ 3.5 ─┘

Final: 4.1 → 4.2 → 4.3
```

---

## Files Summary

| File | Action | Bug |
|------|--------|-----|
| `src/features/kanban/components/task-card.tsx` | MODIFY | 1 |
| `src/lib/query-keys.ts` | MODIFY | 2 |
| `src/hooks/use-breadcrumb-data.tsx` | CREATE | 2 |
| `src/hooks/use-breadcrumbs.tsx` | MODIFY | 2 |
| `src/components/breadcrumbs.tsx` | MODIFY | 2 |
| `src/features/kanban/utils/store.ts` | MODIFY | 3 |
| `src/features/kanban/components/drop-indicator.tsx` | CREATE | 3 |
| `src/features/kanban/components/kanban-board.tsx` | MODIFY | 3 |
| `src/features/kanban/components/board-column.tsx` | MODIFY | 3 |
| `docs/ROADMAP.md` | MODIFY | Final |

---

## Success Criteria

```bash
cd OpenKanban
pnpm run build    # Build successful
pnpm run lint     # No errors
pnpm test         # 126 tests pass
```

**Manual Verification Checklist:**
- [ ] Click task card → Info sidebar opens with task title and description
- [ ] Breadcrumbs show "My Project / Sprint Board" not "abc-123 / def-456"
- [ ] Loading skeleton appears briefly during navigation
- [ ] Drag task → Blue line indicator appears at drop position
- [ ] Indicator follows cursor between tasks
- [ ] Drop or press Escape → Indicator disappears immediately
- [ ] Existing drag-and-drop functionality unchanged

---

## Notes

- **No new dependencies required** - all features use existing packages
- **Tests**: No new tests specified (manual verification for UI/UX fixes)
- **ROADMAP update**: Mark Phase 4.0 items complete after all verifications pass
