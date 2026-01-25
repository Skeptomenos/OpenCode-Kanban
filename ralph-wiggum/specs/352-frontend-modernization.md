# Spec 3.5.2: Frontend Modernization (TanStack Query)

> **Context:** Phase 3.5 Refactor. Replacing manual `fetch` with TanStack Query while preserving Drag-and-Drop performance.
> **Reference:** `.sisyphus/plans/phase3-refactor.md` (Hybrid Store Pattern)
> **Goal:** Robust server state management without UI regressions.
> **Time Estimate:** ~60 minutes

---

## 1. Setup

### 1.1 Query Client
- Install `@tanstack/react-query`.
- Create `src/lib/query-client.ts` exporting a `QueryClient` instance.
- Wrap root `layout.tsx` in `QueryClientProvider`.

---

## 2. API Client Layer

Create `src/features/kanban/api.ts`.

### 2.1 Typed Fetchers
- Implement functions like `createIssue(data: CreateIssueInput): Promise<Issue>`.
- **CRITICAL**: Use `Schema.strip().parse(data)` before sending to strip unknown fields (preventing 400 errors from strict backend).

---

## 3. Hybrid Store Refactor (The Fix)

Update `src/features/kanban/utils/store.ts`.

### 3.1 Remove Async Actions
- DELETE: `addTask`, `fetchTasks`, `removeTask`.
- KEEP: `tasks` array (for optimistic drag state), `draggedTask`, `setTasks`.

### 3.2 Update Status Action (Rollback)
- Update `updateTaskStatus` to return a Promise (for `useMutation` to await).

---

## 4. Component Integration

### 4.1 KanbanViewPage Refactor
- Replace `useEffect` fetching with `useQuery({ queryKey: ['issues', projectId], queryFn: ... })`.
- **Sync Effect**:
  ```typescript
  const { data } = useQuery(...);
  useEffect(() => {
    if (data && !isDragging) {
      store.setTasks(data);
    }
  }, [data, isDragging]);
  ```

### 4.2 Optimistic Drag-and-Drop
- **onDragOver**: Update Zustand `tasks` state immediately (as is).
- **onDragEnd**: 
  - Call `useMutation` to persist.
  - On `onError`: Rollback Zustand state to server value.
  - On `onSettled`: Invalidate queries.

---

## 5. Verification
- **Drag Test**: Drag a task. Refresh. Persistence verified.
- **Race Test**: Drag rapidly. No flickering.
- **Strict Mode**: API calls work even if extra fields present (stripped by client).
