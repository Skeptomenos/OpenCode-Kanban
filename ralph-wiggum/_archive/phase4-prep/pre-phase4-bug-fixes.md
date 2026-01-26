# Pre-Phase 4 Bug Fixes Plan

> **Status**: Ready for Implementation
> **Priority**: Critical (blocks Phase 4)
> **Last Updated**: 2026-01-26

This document contains comprehensive implementation plans for the three remaining Phase 4.0 blockers.

---

## Spec Files

Detailed implementation specs for each bug (30-min cohorts):

| Spec | Description | Time | Files |
|------|-------------|------|-------|
| [001-task-details-panel.md](../specs/001-task-details-panel.md) | Task card click opens info sidebar | 30 min | 1 |
| [002-breadcrumbs-names.md](../specs/002-breadcrumbs-names.md) | Show project/board names in breadcrumbs | 30-45 min | 3 |
| [003-dnd-drop-indicator-store.md](../specs/003-dnd-drop-indicator-store.md) | Store state + DropIndicator component | 25-30 min | 2 |
| [003b-dnd-drop-indicator-integration.md](../specs/003b-dnd-drop-indicator-integration.md) | Integrate drop indicators into board | 30-35 min | 2 |

**Execution Order:**
1. Spec 001 (standalone)
2. Spec 002 (standalone)
3. Spec 003 → Spec 003b (sequential)

---

## Context

### Original Request
Fix the three remaining Phase 4.0 bugs identified in the roadmap:
1. Task Details Panel shows "No content available"
2. Breadcrumbs show UUIDs instead of Project/Board names
3. No visual feedback for drag-and-drop operations

### Research Findings
- Task Details: `TaskCard` has no click handler; `InfoSidebar` expects content via `setContent()`
- Breadcrumbs: `useBreadcrumbs` simply capitalizes URL segments, no name lookup
- DnD: Uses dnd-kit with basic opacity feedback, missing drop indicators

---

## Work Objectives

### Core Objective
Fix all three Phase 4.0 UX blockers to enable progression to Phase 4 feature work.

### Concrete Deliverables
- Task cards open info sidebar with task details on click
- Breadcrumbs display human-readable project/board names
- Drop indicators show exactly where dragged items will land

### Definition of Done
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm test` passes (all 126 tests)
- [ ] Manual verification of each fix

### Must Have
- Type-safe implementations (no `any`)
- Existing test coverage maintained
- Build passes without errors

### Must NOT Have (Guardrails)
- No breaking changes to existing drag-and-drop functionality
- No new external dependencies
- No changes to API contracts

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **User wants tests**: Manual verification for UI changes
- **Framework**: vitest

### Manual Execution Verification
Each TODO includes manual verification steps since these are UI/UX fixes.

---

## TODOs

---

### Bug 1: Task Details Panel Shows "No Content Available"

- [ ] 1.1 Add click handler to TaskCard

  **What to do**:
  - Import `useInfobar` and `InfobarContent` type from `@/components/ui/infobar`
  - Create `handleCardClick` function that formats task as `InfobarContent`
  - Call `setContent()` and `setOpen(true)` in handler
  - Add `onClick={handleCardClick}` to the `Card` component
  - Guard against triggering during drag: check `isOverlay` and `isDragging`

  **Must NOT do**:
  - Don't fetch additional data (keep simple for now)
  - Don't modify the infobar component itself

  **Parallelizable**: NO (standalone)

  **References**:
  - `OpenKanban/src/features/kanban/components/task-card.tsx` - Target file, currently has no click handler
  - `OpenKanban/src/components/ui/infobar.tsx:66-73` - `useInfobar` hook returns `{ setContent, setOpen }`
  - `OpenKanban/src/components/ui/infobar.tsx:46-49` - `InfobarContent` type: `{ title: string, sections: DescriptiveSection[] }`
  - `OpenKanban/src/components/ui/info-button.tsx:29-38` - Example usage pattern for `setContent`
  - `OpenKanban/src/features/kanban/types.ts:12-17` - `Task` type: `{ id, title, description?, columnId }`

  **Acceptance Criteria**:
  - [ ] Using dev server at `http://localhost:37291`:
    - Navigate to any board with tasks
    - Click on a task card
    - Verify: Info sidebar opens on the right
    - Verify: Sidebar title shows the task title
    - Verify: Sidebar shows task description (or "No description provided")
  - [ ] Drag a task card
    - Verify: Info sidebar does NOT open during drag
  - [ ] `pnpm run build` passes

  **Commit**: YES
  - Message: `fix(kanban): add click handler to TaskCard for info sidebar`
  - Files: `src/features/kanban/components/task-card.tsx`

---

- [ ] 1.2 Verify Task Details Panel fix

  **What to do**:
  - Run build and lint
  - Manual browser test

  **Parallelizable**: NO (depends on 1.1)

  **References**:
  - Previous task output

  **Acceptance Criteria**:
  - [ ] `pnpm run build` → PASS
  - [ ] `pnpm run lint` → PASS
  - [ ] `pnpm test` → PASS

  **Commit**: NO (verification only)

---

### Bug 2: Breadcrumbs Show UUIDs Instead of Names

- [ ] 2.1 Create useBreadcrumbData hook

  **What to do**:
  - Create new file `OpenKanban/src/hooks/use-breadcrumb-data.tsx`
  - Use TanStack Query to fetch project (via `fetchIssue`) and board (via `fetchBoard`) by ID
  - Return `{ projectName, boardName, isLoading }`
  - Set `staleTime: 5 * 60 * 1000` (5 min cache)
  - Use `enabled: !!id` to conditionally fetch

  **Must NOT do**:
  - Don't modify existing API functions
  - Don't add new API endpoints

  **Parallelizable**: YES (with 2.2)

  **References**:
  - `OpenKanban/src/features/kanban/api.ts:245-273` - `fetchIssue(id)` returns `Issue | null`
  - `OpenKanban/src/features/kanban/api.ts:338-380` - `fetchBoard(id)` returns `BoardWithIssues`
  - `OpenKanban/src/features/projects/hooks/use-projects.ts` - Example TanStack Query pattern in codebase
  - `OpenKanban/src/lib/db/schema.ts` - Issue has `title` field, Board has `name` field

  **Acceptance Criteria**:
  - [ ] New file created: `src/hooks/use-breadcrumb-data.tsx`
  - [ ] Hook exports `useBreadcrumbData(projectId?, boardId?)`
  - [ ] Returns `{ projectName, boardName, isLoading }`
  - [ ] No TypeScript errors

  **Commit**: NO (groups with 2.3)

---

- [ ] 2.2 Add path ID parsing utility

  **What to do**:
  - Add `parsePathIds(pathname: string)` function to `use-breadcrumbs.tsx`
  - Extract projectId from `/project/[id]` pattern
  - Extract boardId from `/board/[id]` pattern
  - Return `{ projectId?: string, boardId?: string }`

  **Parallelizable**: YES (with 2.1)

  **References**:
  - `OpenKanban/src/hooks/use-breadcrumbs.tsx` - Current implementation only splits path segments
  - Route structure: `/project/[projectId]/board/[boardId]`

  **Acceptance Criteria**:
  - [ ] Function correctly extracts IDs from various paths:
    - `/project/abc-123` → `{ projectId: 'abc-123' }`
    - `/project/abc-123/board/def-456` → `{ projectId: 'abc-123', boardId: 'def-456' }`
    - `/` → `{ projectId: undefined, boardId: undefined }`

  **Commit**: NO (groups with 2.3)

---

- [ ] 2.3 Update useBreadcrumbs to resolve names

  **What to do**:
  - Import `useBreadcrumbData` hook
  - Call `parsePathIds(pathname)` to get IDs
  - Call `useBreadcrumbData(projectId, boardId)` to get names
  - In breadcrumb generation, replace UUID segments with names when available
  - Add `isLoading` to breadcrumb item type

  **Must NOT do**:
  - Don't break existing breadcrumb links
  - Don't change the URL structure

  **Parallelizable**: NO (depends on 2.1, 2.2)

  **References**:
  - `OpenKanban/src/hooks/use-breadcrumbs.tsx:26-31` - Current segment-to-title mapping
  - `OpenKanban/src/components/breadcrumbs.tsx` - Renders breadcrumb items

  **Acceptance Criteria**:
  - [ ] Breadcrumb items have correct titles from API data
  - [ ] Falls back to capitalized UUID if fetch fails
  - [ ] `isLoading` property available on items

  **Commit**: NO (groups with 2.4)

---

- [ ] 2.4 Add loading skeleton to Breadcrumbs component

  **What to do**:
  - Import `Skeleton` from `@/components/ui/skeleton`
  - When `item.isLoading` is true, render skeleton instead of text
  - Use `<Skeleton className="h-4 w-24" />` for loading state

  **Parallelizable**: NO (depends on 2.3)

  **References**:
  - `OpenKanban/src/components/breadcrumbs.tsx` - Breadcrumb rendering
  - `OpenKanban/src/components/ui/skeleton.tsx` - Skeleton component

  **Acceptance Criteria**:
  - [ ] Using dev server:
    - Navigate to `/project/[id]/board/[id]`
    - Verify: Brief skeleton shown while loading
    - Verify: Project name appears (not UUID)
    - Verify: Board name appears (not UUID)
    - Verify: Links still work correctly
  - [ ] `pnpm run build` passes

  **Commit**: YES
  - Message: `fix(ui): show project/board names in breadcrumbs instead of UUIDs`
  - Files: `src/hooks/use-breadcrumbs.tsx`, `src/hooks/use-breadcrumb-data.tsx`, `src/components/breadcrumbs.tsx`

---

### Bug 3: No Visual Feedback for Drag-and-Drop

- [ ] 3.1 Add drop target state to Zustand store

  **What to do**:
  - Add `dropTarget: { columnId: string; index: number } | null` to State type
  - Add `setDropTarget` action
  - Initialize `dropTarget: null`

  **Must NOT do**:
  - Don't remove existing drag state
  - Don't change task/column state structure

  **Parallelizable**: NO (foundation for 3.2-3.4)

  **References**:
  - `OpenKanban/src/features/kanban/utils/store.ts` - Zustand store, currently has `draggedTask` state
  - `OpenKanban/src/features/kanban/utils/store.ts:6-12` - State type definition
  - `OpenKanban/src/features/kanban/utils/store.ts:14-20` - Actions type definition

  **Acceptance Criteria**:
  - [ ] `State` type includes `dropTarget`
  - [ ] `Actions` type includes `setDropTarget`
  - [ ] Store initializes with `dropTarget: null`
  - [ ] No TypeScript errors

  **Commit**: NO (groups with 3.5)

---

- [ ] 3.2 Create DropIndicator component

  **What to do**:
  - Create new file `OpenKanban/src/features/kanban/components/drop-indicator.tsx`
  - Accept `isActive: boolean` prop
  - Render horizontal line with transition animation
  - Active: `bg-primary h-1 opacity-100`
  - Inactive: `bg-transparent h-0 opacity-0`
  - Use `transition-all duration-200` for smooth animation

  **Parallelizable**: YES (with 3.1, 3.3)

  **References**:
  - `OpenKanban/src/lib/utils.ts` - `cn()` utility for className merging
  - `OpenKanban/src/features/kanban/components/task-card.tsx:39-46` - CVA pattern example

  **Acceptance Criteria**:
  - [ ] Component renders nothing visible when `isActive=false`
  - [ ] Component renders blue horizontal line when `isActive=true`
  - [ ] Smooth transition between states

  **Commit**: NO (groups with 3.5)

---

- [ ] 3.3 Update onDragOver to track drop position

  **What to do**:
  - In `kanban-board.tsx` `onDragOver` handler:
    - Detect if dragging over a Column or Task
    - Calculate target column ID and insertion index
    - Call `setDropTarget({ columnId, index })`
  - Clear drop target when `over` is null

  **Must NOT do**:
  - Don't break existing task reordering logic
  - Don't change the actual drop behavior

  **Parallelizable**: NO (depends on 3.1)

  **References**:
  - `OpenKanban/src/features/kanban/components/kanban-board.tsx:372-420` - Current `onDragOver` handler
  - `OpenKanban/src/features/kanban/utils/helpers.ts` - `hasDraggableData` type guard

  **Acceptance Criteria**:
  - [ ] `dropTarget` updates as user drags over different positions
  - [ ] `dropTarget` clears when drag leaves valid drop zones
  - [ ] Console.log verification: dropTarget reflects cursor position

  **Commit**: NO (groups with 3.5)

---

- [ ] 3.4 Render DropIndicator in BoardColumn

  **What to do**:
  - Import `DropIndicator` and `useTaskStore`
  - Subscribe to `dropTarget` from store
  - Render `DropIndicator` before each task card
  - Render `DropIndicator` after last task card (for dropping at end)
  - Pass `isActive` based on matching `columnId` and `index`

  **Must NOT do**:
  - Don't change task card rendering logic
  - Don't affect drag-and-drop functionality

  **Parallelizable**: NO (depends on 3.2, 3.3)

  **References**:
  - `OpenKanban/src/features/kanban/components/board-column.tsx` - Column component with task list
  - `OpenKanban/src/features/kanban/components/board-column.tsx:58-95` - Task rendering section

  **Acceptance Criteria**:
  - [ ] Drop indicators render between tasks
  - [ ] Only the indicator at the current drop position is active
  - [ ] Indicators don't affect task spacing when inactive

  **Commit**: NO (groups with 3.5)

---

- [ ] 3.5 Clear drop target on drag end/cancel

  **What to do**:
  - In `onDragEnd`: call `setDropTarget(null)` at the start
  - Add `onDragCancel` handler if not exists: call `setDropTarget(null)`
  - Ensure cleanup happens before any other logic

  **Parallelizable**: NO (depends on 3.1)

  **References**:
  - `OpenKanban/src/features/kanban/components/kanban-board.tsx:337-370` - Current `onDragEnd` handler
  - dnd-kit docs for `onDragCancel` event

  **Acceptance Criteria**:
  - [ ] Using dev server:
    - Drag a task card
    - Verify: Blue line indicator appears at drop position
    - Verify: Indicator follows cursor between tasks
    - Drop the task
    - Verify: Indicator disappears immediately
  - [ ] Press Escape during drag
    - Verify: Indicator disappears
  - [ ] `pnpm run build` passes

  **Commit**: YES
  - Message: `feat(kanban): add visual drop indicators for drag-and-drop`
  - Files: `src/features/kanban/utils/store.ts`, `src/features/kanban/components/drop-indicator.tsx`, `src/features/kanban/components/kanban-board.tsx`, `src/features/kanban/components/board-column.tsx`

---

- [ ] 3.6 Final verification

  **What to do**:
  - Run full test suite
  - Run build
  - Run lint
  - Manual end-to-end verification of all three fixes

  **Parallelizable**: NO (final step)

  **References**:
  - All modified files

  **Acceptance Criteria**:
  - [ ] `pnpm run build` → PASS
  - [ ] `pnpm run lint` → PASS
  - [ ] `pnpm test` → All 126 tests pass
  - [ ] Manual: Task click opens sidebar ✓
  - [ ] Manual: Breadcrumbs show names ✓
  - [ ] Manual: Drop indicators work ✓

  **Commit**: NO (verification only)

---

## Task Flow

```
Bug 1: 1.1 → 1.2

Bug 2: 2.1 ──┬──→ 2.3 → 2.4
        2.2 ──┘

Bug 3: 3.1 → 3.3 → 3.4 → 3.5 → 3.6
        3.2 ────────┘
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 2.1, 2.2 | Independent utilities |
| B | 3.1, 3.2 | Independent (store vs component) |

| Task | Depends On | Reason |
|------|------------|--------|
| 1.2 | 1.1 | Verification requires implementation |
| 2.3 | 2.1, 2.2 | Needs both hook and parser |
| 2.4 | 2.3 | Needs updated breadcrumb type |
| 3.3 | 3.1 | Needs store action |
| 3.4 | 3.2, 3.3 | Needs component and state |
| 3.5 | 3.1 | Needs store action |
| 3.6 | All | Final verification |

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1.1 | `fix(kanban): add click handler to TaskCard for info sidebar` | task-card.tsx | pnpm build |
| 2.4 | `fix(ui): show project/board names in breadcrumbs instead of UUIDs` | use-breadcrumbs.tsx, use-breadcrumb-data.tsx, breadcrumbs.tsx | pnpm build |
| 3.5 | `feat(kanban): add visual drop indicators for drag-and-drop` | store.ts, drop-indicator.tsx, kanban-board.tsx, board-column.tsx | pnpm build && pnpm test |

---

## Success Criteria

### Verification Commands
```bash
pnpm run build    # Expected: Build successful
pnpm run lint     # Expected: No errors
pnpm test         # Expected: 126 tests pass
```

### Final Checklist
- [ ] All three bugs fixed and verified
- [ ] No regression in existing functionality
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Roadmap updated to mark Phase 4.0 items complete
