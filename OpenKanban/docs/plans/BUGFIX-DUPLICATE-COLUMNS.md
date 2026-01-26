# Bug Fix Plan: Duplicate Column Creation

> **Status**: Ready for Implementation
> **Priority**: Critical
> **Affected Component**: `useColumnMutations` hook

## 1. The Issue
When a user adds a new column/section to the Kanban board, it is sometimes duplicated in the database.

**Root Cause Analysis:**
In `src/features/kanban/hooks/use-column-mutations.ts`, the `addColumnMutation` has a race condition between its optimistic update and the actual API call logic.

1. `onMutate` runs first:
   - Reads current columns from Zustand store.
   - Appends the new column.
   - **Updates the store** with `[...columns, newColumn]`.

2. `mutationFn` runs immediately after:
   - Reads the *now updated* columns from the Zustand store.
   - Appends the new column *again*.
   - Sends `[...columns, newColumn, newColumn]` to the API.

## 2. Implementation Steps

### Step 1: Fix `mutationFn` logic
The mutation function should use the *previous* state (before optimistic update) OR check for existence.

**File**: `OpenKanban/src/features/kanban/hooks/use-column-mutations.ts`

**Current Logic (Buggy):**
```typescript
mutationFn: async ({ title, newColumnId }: { title: string; newColumnId: string }) => {
  const state = useTaskStore.getState(); // <-- Reads optimistically updated state!
  // ...
  const newColumn: Column = { title, id: newColumnId };
  const newColumns = [...state.columns, newColumn]; // <-- Appends duplicate!
  return updateBoard(effectiveBoardId, {
    columnConfig: columnsToColumnConfig(newColumns),
  });
},
```

**Proposed Fix:**
Check if the column ID already exists in the state before appending.

```typescript
mutationFn: async ({ title, newColumnId }: { title: string; newColumnId: string }) => {
  const state = useTaskStore.getState();
  const effectiveBoardId = state.currentBoardId;
  if (!effectiveBoardId) throw new Error('No board selected');

  // FIX: Check if column already exists to prevent duplication
  const exists = state.columns.some(col => col.id === newColumnId);
  
  let newColumns;
  if (exists) {
      // If it exists (due to optimistic update), use current state as is
      newColumns = state.columns;
  } else {
      // If it doesn't exist yet, append it
      const newColumn: Column = { title, id: newColumnId };
      newColumns = [...state.columns, newColumn];
  }

  return updateBoard(effectiveBoardId, {
    columnConfig: columnsToColumnConfig(newColumns),
  });
},
```

### Step 2: Verification
1. Run `pnpm run build` to ensure type safety.
2. Run `pnpm test` (if applicable) to ensure no regressions.
3. Manual test (if possible):
   - Add a section "Test A".
   - Reload page.
   - Verify "Test A" appears only once.

## 3. Constraints
- **Type Safety**: Do not use `any`.
- **Validation**: Ensure `updateBoard` receives valid `ColumnConfig`.
- **Store Integrity**: Do not modify `onMutate` (optimistic UI is good); fix the data persistence logic.
