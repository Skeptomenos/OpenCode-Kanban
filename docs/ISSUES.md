# Issues & Technical Debt

> **Goal:** Track all known issues, hacks, and technical debt that must be resolved before Phase 2.
> **Philosophy:** No broken windows. Fix it right, not fast.

## 1. High Priority (Must Fix)

### 1.1 `next lint` Configuration Failure
- **Issue:** Running `npm run lint` fails with `Invalid project directory`.
- **Cause:** Likely `eslint` configuration mismatch with the project structure or version conflict (eslint 8 vs 9).
- **Risk:** We are coding without a linter safety net. Code quality will degrade.
- **Fix:** Debug `.eslintrc.json` and `next.config.js`. Ensure eslint runs correctly.

### 1.2 "Any" Typing in Kanban Board
- **Issue:** `src/features/kanban/components/kanban-board.tsx` uses `(p: any)` and `(s: any)` in the mapping logic.
- **Cause:** Prototyping speed.
- **Risk:** Type safety is bypassed. If API shape changes, UI crashes at runtime instead of compile time.
- **Fix:** Import `Project` and `Session` types from `@/lib/session-loader` (via a shared types file) and use them.

### 1.3 Hardcoded Mapping Logic
- **Issue:** The logic mapping `Session -> Task` is hardcoded inside `useEffect`.
- **Cause:** Phase 1 demonstration.
- **Risk:** Tight coupling between the View (Board) and the Data Source (Sessions). Hard to add "Issues" later.
- **Fix:** Extract a `useKanbanData` hook or utility that accepts a "Strategy" (as defined in `docs/MAPPING.md`).

## 2. Medium Priority (Architecture)

### 2.1 Store Pollution
- **Issue:** `useTaskStore` has actions like `updateCol`, `removeCol` that operate on *local state* but are disconnected from the backend.
- **Cause:** Inherited from the starter template.
- **Risk:** User makes changes -> Refresh -> Changes lost. UI lies to the user.
- **Fix:** Either implement persistence (Phase 2) or disable these UI actions until they work.

### 2.2 Component "Prop Drilling"
- **Issue:** `KanbanBoard` passes data down to `BoardColumn` manually.
- **Risk:** Rigid hierarchy.
- **Fix:** Evaluate if `Context` or `Zustand` selectors can simplify the board rendering.

## 3. Low Priority (Polish)

### 3.1 Unused UI Artifacts
- **Issue:** "Documentation" sidebar toggle and "Installation Guide" links might still be present in some sub-components.
- **Fix:** Audit all UI strings and remove template artifacts.

### 3.2 Console Warnings
- **Issue:** `A form field element should have an id or name attribute` (x41).
- **Cause:** Shadcn/Radix components or our usage of them.
- **Fix:** Audit form inputs (even hidden ones) to ensure accessibility compliance.

---

## Action Plan
1.  Fix **Linting** (1.1).
2.  Fix **Types** (1.2).
3.  Refactor **Mapping Logic** (1.3).
4.  Disable **Zombie Actions** (2.1).
