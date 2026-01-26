# Spec 3.6.1: Code Organization (Barrels)

> **Context:** Fixing architectural inconsistencies in module exports.
> **Reference:** `OpenKanban/docs/phase3.5-issues3.md` (Category A)
> **Goal:** Standardize feature encapsulation via barrel files.
> **Time Estimate:** ~30 minutes

---

## 1. Project Feature Exports (Issue A.2)

### 1.1 Update Barrel
Update `src/features/projects/index.ts`:
- Export `WelcomeScreen` component.
- Verify `create-project-dialog` is exported.

### 1.2 Update Consumers
Update `src/app/page.tsx`:
- Import `WelcomeScreen` from `@/features/projects`.

---

## 2. Kanban Feature Barrel (Issue A.3)

### 2.1 Create Barrel
Create `src/features/kanban/index.ts`:
- Export `KanbanBoard`.
- Export `KanbanViewPage`.
- Export API functions from `./api`.
- Export Types from `./types` (created in 360).

### 2.2 Update Consumers
Update `src/app/project/[projectId]/board/[boardId]/page.tsx`:
- Import `KanbanViewPage` from `@/features/kanban`.

---

## 3. App Layer Imports (Issue A.4)

### 3.1 Refactor
Search for direct internal imports (e.g. `@/features/kanban/components/...`) and replace with barrel imports (`@/features/kanban`).

---

## 4. Verification
- `npm run build` -> Must pass (verifies no circular deps introduced).
- `grep "src/features/.*/components" src/app` -> Should return 0 matches.
