# Implementation Plan: Phase 5 - UI/UX Polish & Workflow

> **Goal:** Transform the UI into a polished, production-ready experience and implement critical workflow persistence.
> **Previous Phase:** Phase 4 Board Management COMPLETE (v0.3.84)
> **Created:** 2026-01-26
> **Updated:** 2026-01-27 (Sprint 5 VERIFIED COMPLETE)
> **Remaining Tasks:** 6 (Sprint 6: 2, Sprint 7: 4)

## Execution Order

**Critical Path:**
1. ~~**Bug Fixes (5.6, 5.7)** - P0 blockers~~ **COMPLETE**
2. **Data Integrity (5.8, 5.9)** - P1 persistence and stability issues
3. **UX Polish (5.10)** - P2 visual improvements
4. **Verification (5.11-5.13)** - P2/P3 feature validation

---

## Tasks

### Sprint 1: Data Foundation (COMPLETE)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Add `sortOrder` column to `issues` table | `specs/5.3-drag-persistence.md:L7-15` | DONE: Schema updated, test DBs updated, manual ALTER TABLE applied. |
| [x] | **Task 1.2**: Update repository with `updateIssueOrder` method | `specs/5.3-drag-persistence.md:L17-30` | DONE: Added `updateIssueOrder` to repository interface + implementation. Added `moveIssue` to IssueService with midpoint algorithm. Tests pass. |
| [x] | **Task 1.3**: Create `PUT /api/issues/[id]/move` endpoint | `specs/5.3-drag-persistence.md:L17-30` | DONE: Created route with MoveIssueSchema validation. Uses IssueService.moveIssue(). 7 tests pass. |
| [x] | **Task 1.4**: Wire drag-end to move API with optimistic updates | `specs/5.3-drag-persistence.md:L32-48` | DONE: Added `moveIssue` API fetcher. Replaced `updateIssueMutation` with `moveIssueMutation` in kanban-board.tsx. onDragEnd now calculates prev/next issue IDs and calls move API. |
| [x] | **Task 1.5**: Add `?q=` search param to `GET /api/sessions` | `specs/5.4-search-cleanup.md:L6-11` | DONE: Added `query` param to `IOpenCodeRepository.getAllSessions()`. Adapter filters by title/id (case-insensitive). API route parses `?q=` search param. |
| [x] | **Task 1.6**: Remove Status dropdown from `BoardFilterControls` | `specs/5.4-search-cleanup.md:L20-23` | DONE: Deleted entire `board-filter-controls.tsx` (Status was only filter). Removed import from `kanban-board.tsx`. |

### Sprint 2: Sidebar Hierarchy (COMPLETE)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 2.1**: Create `ProjectActionsMenu` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `project-actions-menu.tsx` following BoardActionsMenu pattern. |
| [x] | **Task 2.2**: Create `RenameProjectDialog` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `rename-project-dialog.tsx` with duplicate name validation. |
| [x] | **Task 2.3**: Create `DeleteProjectDialog` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `delete-project-dialog.tsx` with cascade warning. Also created `use-project-mutations.ts` hook. |
| [x] | **Task 2.4**: Refactor sidebar - nest boards under projects | `specs/5.1-sidebar-overhaul.md:L7-15` | DONE: Created `ProjectTreeItem` component with `Collapsible` + `SidebarMenuSub`. Boards lazy-loaded when expanded. Removed separate "Project Boards" group. |
| [x] | **Task 2.5**: Wire `ProjectActionsMenu` to sidebar project items | `specs/5.1-sidebar-overhaul.md:L25-43` | DONE: ProjectActionsMenu integrated in ProjectTreeItem. Shows Rename/Delete on hover. |
| [x] | **Task 2.6**: Add optimistic updates to project mutations | `specs/5.1-sidebar-overhaul.md:L33-43` | DONE: Added `onMutate` with cache snapshot, optimistic update, `onError` rollback, and `onSettled` invalidation for both `useUpdateProject` and `useDeleteProject`. |
| [x] | **Task 2.7**: Implement "Push Mode" layout for InfoSidebar | `specs/5.1-sidebar-overhaul.md:L17-22` | DONE: Changed infobar-container from `absolute inset-y-0 z-10` to `relative`. Removed redundant infobar-gap div. InfobarProvider already has `flex` wrapper. |

### Sprint 3: Task Card Redesign (COMPLETE)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 3.1**: Remove "Task" badge from TaskCard | `specs/5.2-task-card-editor.md:L10` | DONE: Removed Badge component and its import from task-card.tsx. |
| [x] | **Task 3.2**: Restructure TaskCard layout (header/body/footer) | `specs/5.2-task-card-editor.md:L7-12` | DONE: Restructured to header/body/footer layout. Title+drag handle in header, description with line-clamp-3 in body, parent with border-t in footer. Removed CardHeader/CardContent, using p-3 padding. |
| [x] | **Task 3.3**: Create `TaskDescriptionEditor` component | `specs/5.2-task-card-editor.md:L15-25` | DONE: Created `task-description-editor.tsx`. Auto-saving textarea with blur/Cmd+Enter. Shows "Saved" indicator with fade animation. Build passes. |
| [x] | **Task 3.4**: Integrate editor into InfobarContent | `specs/5.2-task-card-editor.md:L27-30` | DONE: Changed `DescriptiveSection.description` from `string` to `React.ReactNode`. Updated `info-sidebar.tsx` to render ReactNode. Replaced static text with `<TaskDescriptionEditor>` in `task-card.tsx` `handleCardClick`. |
| [x] | **Task 3.5**: Fix new task optimistic update (show parent) | `specs/5.2-task-card-editor.md:L32-37` | DONE: Added `useProjects` hook to find current project. Injecting parent info `{ id, title, type: 'project' }` into new task optimistic update. |
| [x] | **Task 3.6**: Update LinkSessionDialog to use debounced server search | `specs/5.4-search-cleanup.md:L13-17` | DONE: Created `use-debounce.ts` hook (300ms). Updated `useSessions(query)` to accept optional search param and pass to API `?q=`. Updated `queryKeys.sessions` to factory pattern. Removed client-side filtering from LinkSessionDialog. |

### Sprint 4: Deferred Features (COMPLETE)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 4.1**: Create `SessionViewer` component | `specs/5.5-deferred-features.md:L7-13` | DONE: Created SessionViewer with breadcrumb nav, useSession hook, API endpoint, adapter methods for messages/parts. Build passes. |
| [x] | **Task 4.2**: Wire "View Session" button to linked sessions | `specs/5.5-deferred-features.md:L8-13` | DONE: Added "View" (eye icon) button to TaskInfobarActions. Clicking replaces InfoSidebar content with SessionViewer. Back button restores task details. |
| [x] | **Task 4.3**: Add "Create Branch" button to task actions | `specs/5.5-deferred-features.md:L16-26` | DONE: Added IconGitBranch button to TaskInfobarActions. Generates `git checkout -b task/{id}-{slug}` and copies to clipboard via navigator.clipboard API with toast feedback. |

---

### Sprint 5: Critical Bug Fixes (COMPLETE)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 5.1**: Fix InfoSidebar not visually rendering | `specs/5.6-fix-infobar-rendering.md` | DONE: `SidebarInset` changed from `w-full` to `min-w-0` in `sidebar.tsx:311`. InfoSidebar now renders properly on task card click. Verified at 1024px viewport. |
| [x] | **Task 5.2**: Fix board left-column clipping | `specs/5.7-fix-board-clipping.md` | DONE: `justify-center` changed to `gap-4 w-fit min-w-full` in `board-column.tsx:133`. Columns now aligned left, no clipping. |

### Sprint 6: Data Integrity Fixes (READY)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 6.1**: Add column reorder persistence to database | `specs/5.8-column-reorder-persistence.md` | **P1** - `onDragEnd` in `kanban-board.tsx:409` only updates Zustand via `setColumns(arrayMove(...))`. No API call. Create `useReorderColumnsMutation` hook. |
| [ ] | **Task 6.2**: Fix initial load race condition | `specs/5.9-fix-initial-load-race.md` | **P1** - Tasks sometimes don't appear on first load. Sync effect (lines 211-221) may miss initial data. Consider rendering from `data?.tasks` directly during non-drag. |

### Sprint 7: UX Polish (READY)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 7.1**: Add hover states to task cards | `specs/5.10-task-card-click-affordance.md` | **P2** - `task-card.tsx:112` only has `cursor-pointer`. Add `hover:border-primary/50 hover:shadow-md transition-all duration-150`. Depends on 5.6 for verification. |
| [ ] | **Task 7.2**: Verify description editor functionality | `specs/5.11-verify-description-editor.md` | **P2** - Verification task. BLOCKED by 5.6. Test: blur save, Cmd+Enter save, "Saved" indicator, persistence. |
| [ ] | **Task 7.3**: Verify "+ New Board" functionality | `specs/5.12-new-board-functionality.md` | **P2** - Verification task. Click trigger, dialog opens, board created, sidebar updates, navigates to new board. |
| [ ] | **Task 7.4**: Full session linking verification | `specs/5.13-session-linking.md` | **P3** - Verification task. BLOCKED by 5.6. Test: Link Session dialog, search, select, link, display, unlink, view transcript. |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Verification Checklist

### Sprint 1 Completion Criteria
- [ ] `sqlite3 data/kanban.db ".schema issues"` shows `sort_order` column
- [ ] Drag task to new position -> Refresh -> Position persists
- [ ] Move task between columns -> Refresh -> Column persists
- [x] Session search `/api/sessions?q=login` returns filtered results
- [x] Board header no longer shows Status dropdown

### Sprint 2 Completion Criteria
- [ ] Clicking project chevron expands boards list
- [ ] Project `...` menu shows Rename/Delete options
- [ ] UI updates instantly on rename/delete (check with Network throttling)
- [ ] Opening Task Details pushes board content (doesn't overlay)

### Sprint 3 Completion Criteria
- [ ] Task card has title in header, description preview in body
- [ ] No "Task" badge visible
- [ ] Parent project shown in footer with icon
- [ ] Description auto-saves on blur
- [ ] New tasks show parent project footer immediately

### Sprint 4 Completion Criteria
- [x] "View" button on linked sessions opens transcript
- [x] "Create Branch" button copies git command to clipboard

### Sprint 5 Completion Criteria (COMPLETE)
- [x] Click task card -> InfoSidebar visually appears with task title
- [x] Description editor visible and editable
- [x] "Link Session" and "Create Branch" buttons visible
- [x] Backlog column title fully visible when sidebar open
- [x] Horizontal scroll works from leftmost to rightmost column
- [x] Works on 1024px viewport with sidebar open

### Sprint 6 Completion Criteria (NEW)
- [ ] Drag column A after column B -> Refresh -> Column A still after column B
- [ ] Console shows no errors during column reorder
- [ ] Navigate to board -> Task cards appear immediately (no flash)
- [ ] Refresh page multiple times -> cards always appear

### Sprint 7 Completion Criteria (NEW)
- [ ] Hover over task card -> visual feedback appears (border/shadow)
- [ ] Edit description -> blur -> "Saved" indicator
- [ ] Edit description -> Cmd+Enter -> saves
- [ ] "+ New Board" creates board, updates sidebar, navigates

---

## Technical Notes

### Sort Order Algorithm (Task 1.3)
```typescript
// Calculate new sortOrder based on neighbors
if (prevIssue && nextIssue) {
  return (prevIssue.sortOrder + nextIssue.sortOrder) / 2;
} else if (prevIssue) {
  return prevIssue.sortOrder + 1000;
} else if (nextIssue) {
  return nextIssue.sortOrder - 1000;
} else {
  return 0; // Empty column
}
```

### Push Mode CSS (Task 2.7)
```tsx
// layout.tsx
<div className="flex flex-row h-full">
  <main className="flex-1 overflow-auto">{children}</main>
  <InfoSidebar /> {/* No absolute positioning */}
</div>

// infobar.tsx - remove on md:
// OLD: "absolute inset-y-0 z-10 md:relative"
// NEW: "relative h-full border-l"
```

### Board Clipping Fix (Task 5.2)
```tsx
// board-column.tsx - BoardContainer
// OLD: 
<div className='flex flex-row items-start justify-center gap-4'>

// NEW:
<div className='flex flex-row items-start gap-4 w-fit min-w-full'>
```

### Column Reorder Persistence (Task 6.1)
```typescript
// use-column-mutations.ts - Add new hook
export function useReorderColumnsMutation(boardId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (columns: Column[]) => {
      const columnConfig = columns.map((col) => ({
        id: col.id,
        title: col.title,
        statusMappings: [col.id],
      }));
      return updateBoard(boardId, { columnConfig });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.kanban(boardId) });
    },
  });
}

// kanban-board.tsx - onDragEnd
if (isActiveAColumn) {
  const reorderedColumns = arrayMove(columns, activeIndex, overIndex);
  setColumns(reorderedColumns);
  reorderColumnsMutation.mutate(reorderedColumns);  // Add this
  return;
}
```

### Task Card Hover (Task 7.1)
```tsx
// task-card.tsx
<Card
  className={cn(
    variants({ dragging: ... }),
    'cursor-pointer p-3',
    'transition-all duration-150',
    'hover:border-primary/50 hover:shadow-md'
  )}
>
```

### Initial Load Race Condition (Task 6.2)
```tsx
// kanban-board.tsx - Current issue (Lines 151-153, 211-221)
// Board renders from Zustand state (tasks from useTaskStore)
// Data synced via useEffect AFTER first render
// Causes flash of empty state

// FIX Option A: Render from React Query when not dragging
const tasksToRender = draggedTask !== null 
  ? tasks  // Zustand during drag
  : data?.tasks ?? [];  // React Query otherwise

// FIX Option B: Eager sync on mount
useEffect(() => {
  if (data?.tasks) setTasks(data.tasks);
}, []);  // Mount only
```

---

## Code Verification (2026-01-27)

### Task 6.1 Verification
**Confirmed Missing:**
- `useReorderColumnsMutation` hook does not exist in `use-column-mutations.ts`
- `onDragEnd` at line 409 only calls `setColumns(arrayMove(...))` - no API call
- PATCH `/api/boards/[id]` accepts `columnConfig` (verified)
- `updateBoard` API fetcher exists and works

### Task 6.2 Verification
**Confirmed Race Condition:**
- `useTaskStore` (Zustand) starts with empty tasks
- `useEffect` sync (lines 211-221) runs AFTER first render
- Guard `if (draggedTask !== null) return;` is correct but doesn't solve init
- Fix: Render from `data?.tasks` directly when not dragging

### Sprint 5 Fixes Verified
- Task 5.1: `SidebarInset` changed from `w-full` to `min-w-0` in `sidebar.tsx:311`
- Task 5.2: `justify-center` changed to `gap-4 w-fit min-w-full` in `board-column.tsx:133`

---

## Dependencies

```
Original Sprints:
Task 1.1 (schema) -> Task 1.2 (repo) -> Task 1.3 (API) -> Task 1.4 (frontend)
Task 1.5 (search API) -> Task 3.6 (debounced UI)
Task 2.1-2.3 (dialogs) -> Task 2.5 (wire to sidebar)
Task 3.3 (editor) -> Task 3.4 (integration)

New Sprints:
Task 5.1 (infobar fix) -> Task 7.2 (description verify), Task 7.4 (session verify)
Task 5.2 (clipping fix) -> Independent, no blockers
Task 6.1 (column persist) -> Independent, no blockers
Task 6.2 (race condition) -> Independent, no blockers
Task 7.1 (hover) -> 5.1 for verification
```

---

## Effort Summary

| Sprint | Tasks | Estimated | Priority |
|--------|-------|-----------|----------|
| Sprint 1: Data Foundation | 6 | COMPLETE | - |
| Sprint 2: Sidebar Hierarchy | 7 | COMPLETE | - |
| Sprint 3: Task Card Redesign | 6 | COMPLETE | - |
| Sprint 4: Deferred Features | 3 | COMPLETE | - |
| Sprint 5: Critical Bug Fixes | 2 | **COMPLETE** | - |
| Sprint 6: Data Integrity | 2 | 6h | **P1** |
| Sprint 7: UX Polish | 4 | 2.5h | **P2-P3** |
| **Verification Pass** | - | 2h | - |
| **Total Remaining** | **6** | **~8.5h (1.5 days)** | |

---

## Implementation Priority Order

1. **Day 1**: Task 6.1 Column reorder persistence (3h) + Task 6.2 Race condition fix (3h)
2. **Day 2**: Task 7.1 Hover states (1h) + Task 7.2 Description verify (30m) + Task 7.3 New Board verify (30m) + Task 7.4 Session linking verify (30m)
3. **Day 3**: Sprint 1-5 verification checklist pass + Final QA
