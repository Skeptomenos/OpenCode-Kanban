# Spec 3.1: Route Structure & Layout

> **Context:** Phase 3 of OpenKanban. Moving from flat `/dashboard` to `/project/[id]` hierarchy.
> **Reference:** `OpenKanban/docs/SCHEMA.md` (Data Model), `ralph-wiggum/specs/phase3-plan.md` (Master Plan)
> **Goal:** Establish the new routing structure and layouts.
> **Time Estimate:** ~30 minutes

---

## 1. File Structure

Create the following directory structure in `OpenKanban/src/app/`:

```
project/
├── [projectId]/
│   ├── layout.tsx       (Project context + Sidebar)
│   ├── page.tsx         (Redirect to first board)
│   ├── not-found.tsx    (Project 404)
│   ├── loading.tsx      (Project loading state)
│   └── board/
│       └── [boardId]/
│           ├── page.tsx (The actual Kanban board)
│           └── loading.tsx (Board loading state)
```

## 2. Implementation Details

### 2.1 Project Layout (`src/app/project/[projectId]/layout.tsx`)
- **Purpose**: Render the `AppSidebar` and provide the project context.
- **Props**: `children`, `params: Promise<{ projectId: string }>` (Async params).
- **Logic**:
  - `const { projectId } = await params;`
  - Reuse structure from `dashboard/layout.tsx`.
  - Pass `projectId` to `AppSidebar` (optional, for active state).

### 2.2 Project Root Redirect (`src/app/project/[projectId]/page.tsx`)
- **Purpose**: Redirect `/project/123` to the first available board.
- **Logic**:
  - `const { projectId } = await params;`
  - **Query**: Get boards where `filters` contains `parentId: projectId` (requires parsing JSON in app code or adding `parentId` column - *Decision: Use listBoards() and filter in JS for Phase 3 MVP*).
  - **Redirect**:
    - If boards found: `redirect(/project/${projectId}/board/${boards[0].id})`.
    - If NO boards:
      - **Auto-create**: Call repository `createBoard({ name: 'Main Board', filters: { parentId: projectId, types: ['task'] } })`.
      - Then redirect to new board.

### 2.3 Board Page (`src/app/project/[projectId]/board/[boardId]/page.tsx`)
- **Purpose**: Container for `KanbanViewPage`.
- **Props**: `params: Promise<{ projectId: string; boardId: string }>`.
- **Logic**:
  - `const { projectId, boardId } = await params;`
  - Validate `projectId` and `boardId` exist (simple check).
  - If invalid, `notFound()`.
  - Render `<KanbanViewPage projectId={projectId} boardId={boardId} />`.

### 2.4 Root Redirect (`src/app/page.tsx`)
- **Purpose**: Smart redirect on app launch.
- **Logic**:
  - Fetch all projects (`type: 'project'`).
  - If projects > 0: `redirect(/project/${projects[0].id})`.
  - If 0 projects: Show "Welcome/Create Project" screen (reuse Dashboard layout).

---

## 3. Testing & Verification (TDD)

### 3.1 Automated Tests
- [ ] **Unit**: Create `src/app/project/[projectId]/page.test.tsx` (mock params).
  - Test redirect to board[0].
  - Test auto-creation if empty.
- [ ] **Build**: `npm run build` must pass (validates async params types).

### 3.2 Manual Verification
1. **Start App**: `npm run dev`
2. **Navigate**: `/project/123/board/456` -> Should render board layout.
3. **Invalid ID**: `/project/bad-id` -> Should show 404 (if DB check implemented) or empty state.
4. **Root**: `/` -> Redirects to project (if exists).
