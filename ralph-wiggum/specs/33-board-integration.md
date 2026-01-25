# Spec 3.3: Board Integration

> **Context:** Phase 3. Routing and Sidebar are done. Now the Board needs to know WHICH project it's displaying.
> **Reference:** `OpenKanban/docs/SCHEMA.md`, `src/features/kanban/utils/store.ts`
> **Goal:** Context-aware Kanban board.
> **Time Estimate:** ~30 minutes

---

## 1. Store Updates

Update `OpenKanban/src/features/kanban/utils/store.ts`.

### 1.1 New State & Actions
- **State**: `currentProjectId: string | null`
- **Actions**:
  - `setProjectId(id: string | null)`
  - `fetchTasks(projectId: string)`

### 1.2 Fetch Logic (`fetchTasks`)
- Call `GET /api/issues?parentId=[projectId]`.
- Note: This relies on Phase 2 `listIssues` filtering by `parentId`.
- Update `tasks` state with result.

### 1.3 Create Task Logic (`addTask`)
- **Update**: Accept `projectId` argument (or read from state).
- **API Call**: Include `parentId: projectId` in the POST body.
- **Why**: Ensures new tasks belong to the active project.

---

## 2. Kanban View Refactor

Update `OpenKanban/src/features/kanban/components/kanban-view-page.tsx`.

### 2.1 Props
- `projectId: string`
- `boardId: string`

### 2.2 Initialization
- `useEffect` on mount (or when props change):
  - `store.setBoardId(boardId)`
  - `store.setProjectId(projectId)`
  - `store.fetchTasks(projectId)`

---

## 3. Testing & Verification (TDD)

### 3.1 Automated Tests
- [ ] **Unit**: Create `store.test.ts` (if not exists, or add to existing).
  - Test `setProjectId` updates state.
  - Test `addTask` includes `parentId` in API payload (mock fetch).

### 3.2 Manual Verification
1. **Isolation**:
   - Go to Project A. Add Task "A".
   - Go to Project B. Add Task "B".
   - Switch back to A. **Expect**: Only see Task "A".
2. **Persistence**: Refresh page. **Expect**: Correct tasks load for current project.
