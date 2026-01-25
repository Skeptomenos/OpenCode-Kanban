# Issues Cleanup Plan (Phase 1 Finalization)

> **Goal:** Resolve ALL technical debt before starting Phase 2.
> **Mandate:** No broken windows. Linting MUST pass.
> **Context:** OpenCode Session Manager (Next.js 16, TypeScript, Shadcn).

---

## Status: ✅ PHASE 1 COMPLETE

| Issue | Description | Status |
|-------|-------------|--------|
| 1.1 | Fix Linting | ✅ Complete |
| 2.1 | Store Cleanup (Zombie Actions) | ✅ Complete |
| 2.2 | Architecture Refactor (Prop Drilling) | ✅ Complete |
| 3.1 | Remove UI Artifacts | ✅ Complete |
| 3.2 | Fix Form Warnings | ✅ Complete |

**Verification (2026-01-25):**
- `npm run lint` → Exit 0 (17 warnings, 0 errors)
- `npm run build` → Exit 0

---

## 1. Fix Linting (Issue 1.1) - ✅ COMPLETE

### Solution Applied
1. Installed ESLint 9 + dependencies: `eslint@9`, `@eslint/js`, `typescript-eslint`
2. Deleted `.eslintrc.json` (legacy config)
3. Created `eslint.config.mjs` using native `eslint-config-next` flat config export:
   ```javascript
   import nextConfig from 'eslint-config-next';

   export default [
     ...nextConfig,
     {
       rules: {
         'no-unused-vars': 'off',
         '@typescript-eslint/no-unused-vars': 'warn',
         'no-console': 'warn'
       }
     }
   ];
   ```
4. Fixed 3 lint errors:
   - `infobar.tsx` & `sidebar.tsx`: Replaced impure `Math.random()` with fixed skeleton width
   - `kanban-board.tsx`: Removed redundant `isMounted` state (store's `isLoading` handles SSR)

---

## 2. Store Cleanup (Issue 2.1) - ✅ COMPLETE

### Solution Applied
- **File:** `src/features/kanban/utils/store.ts`
- Added `// TODO: Connect to Phase 2 Storage Engine` above each zombie action
- Added `console.warn('Persistence not implemented (Phase 2)')` to:
  - `addTask`
  - `addCol`
  - `updateCol`
  - `removeCol`

---

## 3. Architecture Refactor (Issue 2.2) - ✅ COMPLETE

### Solution Applied
- **File:** `src/features/kanban/components/board-column.tsx`
  - Made `tasks` prop optional
  - Added store subscription: `useTaskStore(state => state.tasks.filter(...))`
  - Uses prop if provided (for DragOverlay), otherwise reads from store
- **File:** `src/features/kanban/components/kanban-board.tsx`
  - Removed `tasks={...}` prop from regular `<BoardColumn />` rendering
  - Kept `tasks` prop for DragOverlay (needs snapshot at drag start)

---

## 4. UI Polish (Issue 3.1, 3.2) - ✅ COMPLETE

### Solution Applied
- **Issue 3.1 (Artifacts):**
  - File: `src/components/layout/info-sidebar.tsx`
  - Removed "Documentation" and "Installation Guide" default content
  - Now shows empty state when no content provided
- **Issue 3.2 (Form Warnings):**
  - File: `src/features/kanban/components/column-action.tsx`
  - Added `id='column-name'` and `name='column-name'` to Input

---

## Files Changed

| File | Change |
|------|--------|
| `eslint.config.mjs` | Created (flat config) |
| `.eslintrc.json` | Deleted |
| `src/components/ui/infobar.tsx` | Fixed Math.random → fixed width |
| `src/components/ui/sidebar.tsx` | Fixed Math.random → fixed width |
| `src/components/layout/info-sidebar.tsx` | Removed artifact defaults |
| `src/features/kanban/utils/store.ts` | Added TODO + console.warn to zombie actions |
| `src/features/kanban/components/board-column.tsx` | Reads tasks from store |
| `src/features/kanban/components/kanban-board.tsx` | Removed tasks prop + isMounted state |
| `src/features/kanban/components/column-action.tsx` | Added id/name to input |

---

## Next: Phase 2

Phase 1 cleanup complete. Ready for Phase 2 (Storage Engine implementation).
