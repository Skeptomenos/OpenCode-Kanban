# Spec 3.6.0: Critical Post-Refactor Fixes

> **Context:** Fixing critical architectural and quality issues identified in Phase 3.5 Issues Report #3.
> **Reference:** `OpenKanban/docs/phase3.5-issues3.md`
> **Goal:** Resolve circular dependencies, side effects, and missing test coverage.
> **Time Estimate:** ~60 minutes

---

## 1. Circular Dependency (Issue A.1)

### 1.1 Extract Types
Create `src/features/kanban/types.ts`:
- Move `Column` interface here from `src/features/kanban/components/board-column.tsx`.
- Move `Task` type here from `src/features/kanban/utils/store.ts` (if not already centralized).

### 1.2 Update Imports
- Update `store.ts` to import `Column` from `types.ts`.
- Update `board-column.tsx` to import `Column` from `types.ts`.
- Verify no cycles: `store.ts` -> `types.ts` <- `board-column.tsx` -> `store.ts` (OK, dependency chain broken).

---

## 2. Query Side Effect (Issue A.5)

### 2.1 Refactor KanbanBoard
Location: `src/features/kanban/components/kanban-board.tsx`

**Current State**: `fetchKanbanData` calls `createBoard` if board missing. This runs inside `useQuery`.

**Fix Strategy**:
1. Remove `createBoard` call from `fetchKanbanData`.
2. `fetchKanbanData` should return `null` or throw if board not found.
3. In `KanbanBoard` component:
   ```typescript
   const { data, error } = useQuery(...);
   
   useEffect(() => {
     if (error?.status === 404 || !data) {
       // Trigger creation mutation here
       createBoardMutation.mutate({ ... });
     }
   }, [error, data]);
   ```
4. **Better**: Handle this at the Route level (Project Page) which already does "Auto-create". The Board component should just display what exists or 404.
   - **Decision**: Remove side effect. Let the route handler or parent component ensure board exists. If `KanbanBoard` receives a `boardId` that doesn't exist, it should show 404 (handled by error boundary).

---

## 3. Silent Catch Blocks (Issue B.1)

### 3.1 Repository Logging
Location: `src/lib/db/repository.ts`

**Fix**: Add `logger.warn` to all `JSON.parse` catch blocks.
```typescript
try {
  return JSON.parse(result.value);
} catch (error) {
  logger.warn('Failed to parse config value', { key, error: String(error) });
  return undefined;
}
```
Apply to: `getConfig`, `listBoards` (filters/columnConfig parsing).

---

## 4. Missing Route Tests (Issue E.1)

### 4.1 Issues Route Integration
Create `src/app/api/issues/__tests__/route.test.ts`:
- **Type**: Integration Test (using `createTestDb`).
- **Tests**:
  - `GET /api/issues`: Returns list.
  - `POST /api/issues`: Creates issue.
  - `GET /api/issues?parentId=...`: Filters correctly.

### 4.2 Boards Route Integration
Create `src/app/api/boards/__tests__/route.test.ts`:
- **Type**: Integration Test.
- **Tests**:
  - `GET /api/boards`: Returns list.
  - `POST /api/boards`: Creates board.

---

## 5. Verification
- `npm run build` -> Pass (Circular dep fixed).
- `npm run test` -> New route tests pass.
- `grep "JSON.parse" src/lib/db/repository.ts -A 5` -> Check for logger calls.
