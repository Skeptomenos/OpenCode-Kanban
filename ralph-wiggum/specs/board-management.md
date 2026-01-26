# Phase 4: Board Management Implementation Plan

## 1. Context & Goal
We are implementing **Phase 4** of the roadmap: "The Hierarchical Board".
The immediate goal is to enable **Board Management** (Create, Read, Update, Delete) and allow multiple boards per project.
Currently, the backend lists *all* boards, and the frontend assumes a single board flow. We need to support filtering boards by project and managing them via the UI.

## 2. Technical Decisions

### 2.1 Backend Updates (Gap Identified)
Contrary to initial assumptions, `GET /api/boards` does **not** support filtering.
We must update the backend stack to support `parentId` filtering for boards.

**Architectural Decision**: We will use the **existing pattern** found in `src/app/project/[projectId]/page.tsx:27`, where board association is defined by `board.filters.parentId`.
-   **Why**: The schema does not have a top-level `parent_id` column.
-   **Pattern**: A board "belongs" to a project if its issue filter (`filters.parentId`) matches the project ID.
-   **Action**: `listBoards` will parse the `filters` JSON column and match `parentId` inside it.

-   **Repository**: Update `listBoards` to accept a filter object. Filter in-memory (SQLite JSON parsing is available but in-memory is safer/simpler for this scale).
-   **Service**: Pass filter from API to Repository.
-   **API Route**: Parse `parentId` query parameter.

### 2.2 Frontend API
-   **Update**: `fetchBoards` must accept `parentId` and append it to the URL.
-   **Add**: `deleteBoard` function (missing).

### 2.3 State Management (TanStack Query)
-   **Key Factory**: Update `queryKeys` in `src/lib/query-keys.ts` to support `['boards', { parentId }]`.
-   **Hooks**:
    -   `useBoards(projectId)`: Fetches boards for the specific project.
    -   `useBoardMutations()`: Encapsulates Create/Update/Delete logic and invalidation.

### 2.4 UI Architecture
-   **Sidebar**:
    -   Add a "Boards" collapsible group inside the Project view.
    -   Show list of boards belonging to the active project.
    -   Active board highlighted.
    -   "+ Create Board" action in the group header.
-   **Dialogs**:
    -   `CreateBoardDialog`: Simple name input. **Crucial**: Automatically sets `filters.parentId` to the current `projectId`. Defaults columns to "Backlog", "In Progress", "Done".
    -   `BoardActionsMenu`: Dropdown on board items (Rename, Delete).

## 3. Detailed Task List

### Task 1: Backend Core (Filtering Support)
- [ ] **Repository**: Update `OpenKanban/src/lib/db/repository.ts`.
    -   Update `IPMRepository` interface: `listBoards(filter?: { parentId?: string }): BoardWithParsedFields[]`.
    -   Update `SqlitePMRepository`: Implement filtering logic.
        -   **Logic**: Parse `board.filters` JSON.
        -   **Match**: If `filter.parentId` is provided, return boards where `parsedFilters.parentId === filter.parentId`.
- [ ] **Service**: Update `OpenKanban/src/services/board-service.ts`.
    -   Update `listBoards` to accept and pass `filter`.
- [ ] **API**: Update `OpenKanban/src/app/api/boards/route.ts`.
    -   In `GET`, parse `parentId` from search params.
    -   Call `service.listBoards({ parentId })`.
- [ ] **Verification**:
    -   Unit Test: `listBoards({ parentId: 'p1' })` returns only boards with `filters: { parentId: 'p1' }`.

### Task 2: Frontend API Layer
- [ ] **API**: Update `OpenKanban/src/features/kanban/api.ts`.
    -   Update `fetchBoards` to accept `filters?: { parentId?: string }`.
    -   Implement `deleteBoard(id: string)`.
- [ ] **Verification**:
    -   Check `fetchBoards` constructs URL like `/api/boards?parentId=123`.

### Task 3: React Hooks & Query Keys
- [ ] **Query Keys**: Update `OpenKanban/src/lib/query-keys.ts`.
    -   Add `boards: (parentId?: string) => ['boards', { parentId }]`.
- [ ] **Hook**: Create `OpenKanban/src/features/boards/hooks/use-boards.ts`.
    -   `useBoards(projectId: string)`: Calls `fetchBoards({ parentId: projectId })`.
- [ ] **Hook**: Create `OpenKanban/src/features/boards/hooks/use-board-mutations.ts`.
    -   `useCreateBoard`: Invalidates `['boards', { parentId }]`.
    -   `useUpdateBoard`: Invalidates `['boards']`.
    -   `useDeleteBoard`: Invalidates `['boards']`.

### Task 4: UI Components
- [ ] **Component**: `OpenKanban/src/features/boards/components/create-board-dialog.tsx`.
    -   Props: `parentId: string`.
    -   Logic: Calls `createBoard` with `filters: { parentId }`.
- [ ] **Component**: `OpenKanban/src/features/boards/components/board-actions-menu.tsx`.
- [ ] **Component**: `OpenKanban/src/features/boards/components/delete-board-dialog.tsx`.
    -   Logic: On success, if deleted board was active, redirect to `/project/[projectId]`.
- [ ] **Component**: `OpenKanban/src/features/boards/components/rename-board-dialog.tsx`.
    -   Triggered from BoardActionsMenu.

### Task 5: Integration
- [ ] **Sidebar**: Update `OpenKanban/src/components/layout/app-sidebar.tsx`.
    -   Read `projectId` from URL params.
    -   If `projectId` exists, fetch boards using `useBoards`.
    -   Render "Project Boards" group (separate from "Projects" group).
    -   Connect "Create Board" button in group header (pass `projectId`).
    -   Connect `BoardActionsMenu` to board items.
    -   Handle empty state: If no boards, show "No boards" message.

### Task 6: Testing (Repository)
- [ ] **Test**: Create `OpenKanban/src/lib/db/__tests__/repository-boards.test.ts`.
    -   Verify `listBoards({ parentId })` filters correctly.
    -   Verify `deleteBoard` works.
    -   Verify `createBoard` sets correct filters.

## 4. Verification Strategy
-   **Manual Verification**:
    1.  Go to Project A.
    2.  Create "Board 1" and "Board 2".
    3.  Go to Project B.
    4.  Verify "Board 1" and "Board 2" are NOT visible.
    5.  Create "Board 3".
    6.  Go back to Project A.
    7.  Verify only "Board 1" and "Board 2" are visible.
    8.  Delete "Board 1". Verify it disappears.
    9.  Rename "Board 2". Verify update.

## 5. File Structure
```
OpenKanban/src/features/boards/
├── components/
│   ├── board-actions-menu.tsx
│   ├── create-board-dialog.tsx
│   └── delete-board-dialog.tsx
├── hooks/
│   ├── use-board-mutations.ts
│   └── use-boards.ts
```
