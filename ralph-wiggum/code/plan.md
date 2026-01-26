# Implementation Plan: Phase 4 - Board Management

> **Phase**: 4 - Board Management  
> **Last Updated**: 2026-01-26  
> **Total Estimated Time**: ~6 hours  
> **Total Tasks**: 18 atomic tasks

## Overview

Phase 4 adds full board management capabilities to OpenKanban:
- **Backend**: Filter boards by `parentId` to show only project-specific boards
- **Frontend**: React Query hooks and API updates for boards CRUD
- **UI**: Dialogs for create/rename/delete board operations
- **Integration**: Sidebar shows project-specific boards with actions

All specs are in `ralph-wiggum/specs/4.*.md`.

---

## Summary

| Phase               | Priority | Est. Time | Tasks | Files Modified  |
| ------------------- | -------- | --------- | ----- | --------------- |
| 4.1: Backend Core   | HIGH     | 75 min    | 1-4   | 4 files (1 new) |
| 4.2: Frontend State | HIGH     | 60 min    | 5-9   | 4 files (2 new) |
| 4.3: UI Components  | MEDIUM   | 75 min    | 10-14 | 5 files (5 new) |
| 4.4: Integration    | MEDIUM   | 45 min    | 15-17 | 1 file          |
| Final Verification  | -        | 15 min    | 18    | 1 file          |

---

## Tasks

### Phase 4.1: Backend Core & Filtering

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1**: Create `repository-boards.test.ts` with parentId filtering tests | `specs/4.1-backend-core.md:L32-37` | TDD: 4 test cases for board filtering by parentId |
| [x] | **Task 2**: Update `IPMRepository.listBoards` and `SqlitePMRepository.listBoards` to accept filter | `specs/4.1-backend-core.md:L10-19` | In-memory filtering using `parseBoardFields` |
| [x] | **Task 3**: Update `BoardService.listBoards` to pass filter parameter | `specs/4.1-backend-core.md:L22-23` | Pass filter through from service to repo |
| [x] | **Task 4**: Update `GET /api/boards` to parse `parentId` from query params | `specs/4.1-backend-core.md:L26-29` | Parse searchParams, call service with filter |

**Verification:**
```bash
pnpm test -- repository-boards
pnpm run build && pnpm run lint
# Manual: curl "http://localhost:37291/api/boards?parentId=test-123"
```

---

### Phase 4.2: Frontend State & API

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 5**: Update `fetchBoards` to accept optional `parentId` filter | `specs/4.2-frontend-state.md:L10-12` | Add filter param, append to URL search params |
| [x] | **Task 6**: Update `CreateBoardInput` type to include `filters` field | `specs/4.2-frontend-state.md:L13-14` | Added full `BoardFilters` type to match backend schema |
| [ ] | **Task 7**: Add `deleteBoard` API function | `specs/4.2-frontend-state.md:L15-18` | Send DELETE to `/api/boards/[id]`, handle errors, return `{ id }` |
| [ ] | **Task 8**: Add `boards` query key to `query-keys.ts` | `specs/4.2-frontend-state.md:L22-24` | Add factory: `boards: (parentId?) => parentId ? ['boards', { parentId }] : ['boards']` |
| [ ] | **Task 9**: Create `use-boards.ts` and `use-board-mutations.ts` hooks | `specs/4.2-frontend-state.md:L28-35` | Create `features/boards/hooks/` directory, `useBoards(projectId)`, `useCreateBoard`, `useUpdateBoard`, `useDeleteBoard` |

**Verification:**
```bash
pnpm run build && pnpm run lint
```

---

### Phase 4.3: UI Components

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 10**: Create `CreateBoardDialog` component | `specs/4.3-ui-components.md:L9-16` | Props: `parentId`, `children`. Form: board name. Default columns: Backlog, In Progress, Done. Use `CreateProjectDialog` as reference. |
| [ ] | **Task 11**: Create `DeleteBoardDialog` component | `specs/4.3-ui-components.md:L28-37` | Props: `boardId`, `projectId`, `open`, `onOpenChange`. Warning message, redirect if deleting active board. |
| [ ] | **Task 12**: Create `RenameBoardDialog` component | `specs/4.3-ui-components.md:L40-44` | Props: `boardId`, `currentName`, `open`, `onOpenChange`. Input with current name, calls `useUpdateBoard`. |
| [ ] | **Task 13**: Create `BoardActionsMenu` component | `specs/4.3-ui-components.md:L19-25` | Props: `boardId`, `boardName`. DropdownMenu with Rename/Delete items, orchestrates dialogs. |
| [ ] | **Task 14**: Create barrel export `features/boards/index.ts` | - | Export all components and hooks for clean imports |

**Verification:**
```bash
pnpm run build && pnpm run lint
```

---

### Phase 4.4: Sidebar Integration

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 15**: Add "Project Boards" SidebarGroup with `useBoards` integration | `specs/4.4-integration.md:L10-20` | Extract `projectId` from `useParams`, conditionally render boards group when inside project |
| [ ] | **Task 16**: Add loading, error, and empty states for boards list | `specs/4.4-integration.md:L23-25` | Skeleton items, error message, "No boards" placeholder |
| [ ] | **Task 17**: Wire up `CreateBoardDialog` and `BoardActionsMenu` in sidebar | `specs/4.4-integration.md:L17-19` | Create button in group action, actions menu on each board item, active highlighting |

**Verification:**
```bash
pnpm run build && pnpm run lint
```

---

### Final Verification

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **Task 18**: Full verification and ROADMAP update | `specs/4.4-integration.md:L27-33` | Run test suite, manual E2E verification, update ROADMAP.md |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Task Dependency Graph

```
Phase 4.1 (Backend):
  1 (tests) → 2 (repo) → 3 (service) → 4 (api)

Phase 4.2 (Frontend):
  5 (fetchBoards) ─┐
  6 (types)        ├─→ 9 (hooks)
  7 (deleteBoard)  │
  8 (queryKeys)   ─┘

Phase 4.3 (UI):
  10 (create) ─┐
  11 (delete)  ├─→ 13 (menu) → 14 (barrel)
  12 (rename) ─┘

Phase 4.4 (Integration):
  15 (boards group) → 16 (states) → 17 (dialogs)

Final: 18
```

---

## Files Summary

| File | Action | Phase |
|------|--------|-------|
| `src/lib/db/__tests__/repository-boards.test.ts` | CREATE | 4.1 |
| `src/lib/db/repository.ts` | MODIFY | 4.1 |
| `src/services/board-service.ts` | MODIFY | 4.1 |
| `src/app/api/boards/route.ts` | MODIFY | 4.1 |
| `src/features/kanban/api.ts` | MODIFY | 4.2 |
| `src/lib/query-keys.ts` | MODIFY | 4.2 |
| `src/features/boards/hooks/use-boards.ts` | CREATE | 4.2 |
| `src/features/boards/hooks/use-board-mutations.ts` | CREATE | 4.2 |
| `src/features/boards/components/create-board-dialog.tsx` | CREATE | 4.3 |
| `src/features/boards/components/delete-board-dialog.tsx` | CREATE | 4.3 |
| `src/features/boards/components/rename-board-dialog.tsx` | CREATE | 4.3 |
| `src/features/boards/components/board-actions-menu.tsx` | CREATE | 4.3 |
| `src/features/boards/index.ts` | CREATE | 4.3 |
| `src/components/layout/app-sidebar.tsx` | MODIFY | 4.4 |
| `docs/ROADMAP.md` | MODIFY | Final |

**Totals**: 15 files (8 new, 7 modified)

---

## Success Criteria

```bash
cd OpenKanban
pnpm run build    # Build successful
pnpm run lint     # No errors
pnpm test         # All tests pass (including new repository-boards.test.ts)
```

**Manual Verification Checklist:**
- [ ] `GET /api/boards?parentId=XYZ` returns only boards with that parentId in filters
- [ ] Navigate to project → Sidebar shows "Project Boards" group
- [ ] "Create Board" dialog opens, creates board linked to current project
- [ ] Board appears in sidebar immediately after creation
- [ ] Board actions menu shows Rename/Delete options
- [ ] Rename dialog updates board name
- [ ] Delete dialog removes board and redirects if on deleted board
- [ ] Empty project shows "No boards" placeholder
- [ ] Loading skeleton appears while fetching boards

---

## Notes

- **No new dependencies required** - all features use existing packages
- **TDD**: Task 1 writes tests before implementation (Tasks 2-4)
- **Reference Components**: `CreateProjectDialog` pattern for dialogs, `useProjects` pattern for hooks
- **Existing infrastructure**: `parseBoardFields` helper handles JSON parsing, `BoardFilters` type already has `parentId`
