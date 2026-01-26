# Implementation Plan: Phase 5 - UI/UX Polish & Workflow

> **Goal:** Transform the UI into a polished, production-ready experience and implement critical workflow persistence.
> **Previous Phase:** Phase 4 Board Management COMPLETE (v0.3.84)
> **Created:** 2026-01-26

## Execution Order

1. **Drag Persistence (5.3)** - Schema migration is foundation for all ordering
2. **Search & Cleanup (5.4)** - Independent, quick wins
3. **Sidebar Overhaul (5.1)** - Hierarchical navigation
4. **Task Card Redesign (5.2)** - UI polish
5. **Deferred Features (5.5)** - Integration convenience

---

## Tasks

### Sprint 1: Data Foundation (Est: 1.5 days)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Add `sortOrder` column to `issues` table | `specs/5.3-drag-persistence.md:L7-15` | DONE: Schema updated, test DBs updated, manual ALTER TABLE applied. |
| [x] | **Task 1.2**: Update repository with `updateIssueOrder` method | `specs/5.3-drag-persistence.md:L17-30` | DONE: Added `updateIssueOrder` to repository interface + implementation. Added `moveIssue` to IssueService with midpoint algorithm. Tests pass. |
| [x] | **Task 1.3**: Create `PUT /api/issues/[id]/move` endpoint | `specs/5.3-drag-persistence.md:L17-30` | DONE: Created route with MoveIssueSchema validation. Uses IssueService.moveIssue(). 7 tests pass. |
| [x] | **Task 1.4**: Wire drag-end to move API with optimistic updates | `specs/5.3-drag-persistence.md:L32-48` | DONE: Added `moveIssue` API fetcher. Replaced `updateIssueMutation` with `moveIssueMutation` in kanban-board.tsx. onDragEnd now calculates prev/next issue IDs and calls move API. |
| [x] | **Task 1.5**: Add `?q=` search param to `GET /api/sessions` | `specs/5.4-search-cleanup.md:L6-11` | DONE: Added `query` param to `IOpenCodeRepository.getAllSessions()`. Adapter filters by title/id (case-insensitive). API route parses `?q=` search param. |
| [x] | **Task 1.6**: Remove Status dropdown from `BoardFilterControls` | `specs/5.4-search-cleanup.md:L20-23` | DONE: Deleted entire `board-filter-controls.tsx` (Status was only filter). Removed import from `kanban-board.tsx`. |

### Sprint 2: Sidebar Hierarchy (Est: 2 days)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 2.1**: Create `ProjectActionsMenu` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `project-actions-menu.tsx` following BoardActionsMenu pattern. |
| [x] | **Task 2.2**: Create `RenameProjectDialog` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `rename-project-dialog.tsx` with duplicate name validation. |
| [x] | **Task 2.3**: Create `DeleteProjectDialog` component | `specs/5.1-sidebar-overhaul.md:L25-31` | DONE: Created `delete-project-dialog.tsx` with cascade warning. Also created `use-project-mutations.ts` hook. |
| [ ] | **Task 2.4**: Refactor sidebar - nest boards under projects | `specs/5.1-sidebar-overhaul.md:L7-15` | Use `Collapsible` + `SidebarMenuSub`. Remove separate "Project Boards" group. Active project auto-expands. |
| [ ] | **Task 2.5**: Wire `ProjectActionsMenu` to sidebar project items | `specs/5.1-sidebar-overhaul.md:L25-43` | Add `...` menu to each project in sidebar. Hook up rename/delete dialogs. |
| [ ] | **Task 2.6**: Add optimistic updates to project mutations | `specs/5.1-sidebar-overhaul.md:L33-43` | Update `use-project-mutations.ts` with `onMutate` for rename/delete. Rollback on error. |
| [ ] | **Task 2.7**: Implement "Push Mode" layout for InfoSidebar | `specs/5.1-sidebar-overhaul.md:L17-22` | Change `infobar.tsx`: remove `absolute` on md:, use `relative`. Update parent layout.tsx to `flex-row`. |

### Sprint 3: Task Card Redesign (Est: 0.5 days)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 3.1**: Remove "Task" badge from TaskCard | `specs/5.2-task-card-editor.md:L10` | Delete `<Badge variant="outline">Task</Badge>` from `task-card.tsx`. |
| [ ] | **Task 3.2**: Restructure TaskCard layout (header/body/footer) | `specs/5.2-task-card-editor.md:L7-12` | Title + drag handle in header. Description preview in body (line-clamp-3). Parent in footer with border-t. |
| [ ] | **Task 3.3**: Create `TaskDescriptionEditor` component | `specs/5.2-task-card-editor.md:L15-25` | File: `src/features/kanban/components/task-description-editor.tsx`. Auto-saving textarea. Save on blur/Cmd+Enter. |
| [ ] | **Task 3.4**: Integrate editor into InfobarContent | `specs/5.2-task-card-editor.md:L27-30` | Replace static description text with `<TaskDescriptionEditor>` in `handleCardClick`. |
| [ ] | **Task 3.5**: Fix new task optimistic update (show parent) | `specs/5.2-task-card-editor.md:L32-37` | In `NewTaskDialog` onSuccess, inject parent object into optimistic update. |
| [ ] | **Task 3.6**: Update LinkSessionDialog to use debounced server search | `specs/5.4-search-cleanup.md:L13-17` | Add `useDebounce(300)` for search input. Pass query to `useSessions(query)`. |

### Sprint 4: Deferred Features (Est: 0.5 days)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 4.1**: Create `SessionViewer` component | `specs/5.5-deferred-features.md:L7-13` | File: `src/features/sessions/components/session-viewer.tsx`. Render transcript read-only. Breadcrumb nav. |
| [ ] | **Task 4.2**: Wire "View Session" button to linked sessions | `specs/5.5-deferred-features.md:L8-13` | Add "View" button in TaskInfobarActions. Opens SessionViewer in InfoSidebar. |
| [ ] | **Task 4.3**: Add "Create Branch" button to task actions | `specs/5.5-deferred-features.md:L16-26` | Button in TaskInfobarActions. Generates `git checkout -b task/{id}-{slug}`. Copy to clipboard. |

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
- [ ] "View" button on linked sessions opens transcript
- [ ] "Create Branch" button copies git command to clipboard

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

---

## Dependencies

```
Task 1.1 (schema) -> Task 1.2 (repo) -> Task 1.3 (API) -> Task 1.4 (frontend)
Task 1.5 (search API) -> Task 3.6 (debounced UI)
Task 2.1-2.3 (dialogs) -> Task 2.5 (wire to sidebar)
Task 3.3 (editor) -> Task 3.4 (integration)
```

---

## Effort Summary

| Sprint | Tasks | Estimated |
|--------|-------|-----------|
| Sprint 1: Data Foundation | 6 | 1.5 days |
| Sprint 2: Sidebar Hierarchy | 7 | 2 days |
| Sprint 3: Task Card Redesign | 6 | 0.5 days |
| Sprint 4: Deferred Features | 3 | 0.5 days |
| **Total** | **22** | **4-5 days** |
