# Spec 3.5.8: Code Quality & Consistency

> **Context:** Fixing various low-severity issues across the codebase to improve maintainability and consistency.
> **Reference:** `OpenKanban/docs/phase3.5-issues2.md` (Categories B-F)
> **Goal:** High code hygiene.
> **Time Estimate:** ~60 minutes

---

## 1. Schema Strictness (Issue B.1)
Update `src/contract/pm/schemas.ts`:
- Add `.strict()` to `ApiSuccessSchema`.

---

## 2. Error Handling Refinements (Category C)
- **C.6**: Add debug logging to `src/contract/opencode/adapter.ts` catch blocks.
- **C.7**: Update `src/features/projects/api.ts`: make `rollbackProject` return `boolean`.
- **C.8**: Update `src/app/api/sessions/route.ts`: add `code: 'INTERNAL_ERROR'` to error response.

---

## 3. Architecture Refinements (Category D)
- **D.1**: Add JSDoc to `src/features/kanban/components/kanban-board.tsx` explaining the "Dual Source of Truth" pattern (React Query + Zustand) for drag optimization.
- **D.2**: Remove `isLoading` from `src/features/kanban/utils/store.ts` (redundant).

---

## 4. React Patterns (Category E)
- **E.2**: Refactor `src/features/kanban/components/new-task-dialog.tsx` to use `onMutate` (optimistic update) instead of `onSuccess` push.
- **E.3**: Update `src/lib/query-client.ts` to enable `throwOnError` for 500 errors.

---

## 5. Code Quality (Category F)
- **F.1**: Create `src/lib/query-keys.ts` factory. Refactor 4-5 files to use it.
- **F.2**: Update `src/app/api/sessions/route.ts` to support `limit` and `offset` query params.
- **F.4**: Add TODO comment to `BOLA` stubs in services.
- **F.5**: Move async helpers in `kanban-board.tsx` outside the component.

---

## 6. Verification
- `npm run lint` -> Pass.
- `npm run test` -> Pass.
- Manual: Create task (optimistic check).
