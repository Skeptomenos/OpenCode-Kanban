# Phase 3 Issues Report

> **Generated:** 2026-01-25  
> **Updated:** 2026-01-25 (All Issues Fixed - Phase 3 Complete)  
> **Scope:** Comprehensive code review + browser verification of Phase 3 implementation  
> **Build Status:** ✅ PASSES  
> **Lint Status:** ✅ 0 warnings (0 errors)  
> **Type Safety:** ✅ No `as any`, `@ts-ignore`, or `@ts-expect-error` found  
> **Browser Testing:** ✅ Core functionality verified

---

## Executive Summary

Phase 3 is **100% complete** per `ralph-wiggum/code/plan.md`. All 17 tasks marked done. Code review uncovered **25 issues** - **ALL FIXED**. Browser verification testing uncovered **3 additional issues** - **ALL FIXED**.

| Severity | Count | Immediate Action Required | Status |
|----------|-------|---------------------------|--------|
| Critical | 3     | Yes                       | ✅ 3/3 DONE |
| High     | 7     | Before next phase         | ✅ 7/7 DONE |
| Medium   | 8     | Plan for Phase 4          | ✅ 8/8 DONE |
| Low      | 10    | Backlog                   | ✅ 9/10 DONE (1 N/A) |

---

## Critical Priority (Fix Immediately)

### Issue #1: Silent Error Swallowing in OpenCode Adapter ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/contract/opencode/adapter.ts:67-69` |
| **Type** | Error Handling |
| **Spec Violation** | AGENTS.md "SAFETY" constraint |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added logging with file path and error details. Comment explains partial results behavior. *(Updated to use `logger.warn` in Issue #4)*

**Effort:** 15 minutes

---

### Issue #2: Empty Catch Block in Root Layout ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/layout.tsx:46` |
| **Type** | Error Handling |
| **Spec Violation** | AGENTS.md "SAFETY" constraint |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added justification comment explaining why silent catch is intentional (inline script before hydration, graceful degradation).

**Effort:** 5 minutes

---

### Issue #3: Dead/Legacy Code Not Removed ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/lib/session-loader.ts`, `src/types/session.ts` |
| **Type** | Dead Code |
| **Spec Violation** | Phase 3 cleanup incomplete |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Verified no external imports. Deleted both files (144 lines removed).

**Effort:** 30 minutes

---

## High Priority (Fix Before Next Phase)

### Issue #4: No Structured Logging ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/lib/logger.ts` (new) + 11 files updated |
| **Type** | Observability |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created `src/lib/logger.ts` with structured logging utility providing:
- Consistent timestamp formatting
- Log levels (debug, info, warn, error)
- Structured context via JSON serialization
- Debug logs filtered in production

Replaced all 31 `console.*` statements across 11 files:
- 7 API route files (14 instances)
- 3 client component/store files (14 instances)  
- 1 adapter file (3 instances)

ESLint `no-console` warnings: **31 → 0**

**Effort:** 1.5 hours

---

### Issue #5: Unused Variables/Imports ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | Multiple files |
| **Type** | Code Quality |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Removed unused imports:
- `IconShoppingBag` from `icons.tsx`
- `INFOBAR_COOKIE_NAME`, `INFOBAR_COOKIE_MAX_AGE` from `infobar.tsx`
- `error` variable now used in logging (Issue #1)

**Effort:** 15 minutes

---

### Issue #6: React Hook Dependency Issue ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/components/ui/infobar.tsx:160` |
| **Type** | React Bug |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `setOpen` to useEffect dependency array.

**Effort:** 10 minutes

---

### Issue #7: Duplicate Type Definitions ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | Multiple files |
| **Type** | Type Drift Risk |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created canonical API response types in `src/contract/pm/types.ts`:
- `ApiIssue` - Issue with parsed metadata and relations
- `Project` - Subset of Issue for project listing (with correct `number` timestamps)
- `BoardWithIssues` - Board with column config and issues

Updated consumers:
- `use-projects.ts` - Now imports `Project` from contract (fixed createdAt/updatedAt type bug)
- `kanban-board.tsx` - Now imports `BoardWithIssues` from contract
- `src/features/projects/index.ts` - Re-exports `Project` from contract

**Duplicates resolved:**
| Type | Previous Location | Now | Status |
|------|-------------------|-----|--------|
| ~~`Session`~~ | ~~`src/types/session.ts`~~ | Deleted | ✅ |
| ~~`Project`~~ | ~~`src/types/session.ts`~~ | Deleted | ✅ |
| `ColumnConfig` | `kanban-board.tsx` | `contract/pm/types.ts` | ✅ |
| `ApiIssue` | `kanban-board.tsx` | `contract/pm/types.ts` | ✅ |
| `BoardWithIssues` | `kanban-board.tsx` | `contract/pm/types.ts` | ✅ |
| `Project` | `use-projects.ts` | `contract/pm/types.ts` | ✅ |

**BUG FIXED:** `createdAt`/`updatedAt` now correctly typed as `number` (Unix timestamps).

**Effort:** 30 minutes

---

### Issue #8: N+1 Query in Board API ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/api/boards/[id]/route.ts` (GET) |
| **Type** | Performance |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `getIssuesWithRelations(ids: string[])` batch method to repository. Fetches all session links and label links in 2 queries total instead of 2N queries. Updated Board API route to use batch method.

**Effort:** 1 hour

---

### Issue #9: Inefficient Session Lookup ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/contract/opencode/adapter.ts` |
| **Type** | Performance |
| **Status** | ✅ Fixed 2026-01-25 |

**Problem:** `getSessionById` iterated all 8000+ sessions via `getAllSessions().find()`.

**Solution:** Implemented session index cache with O(1) lookups:
1. Added `ensureSessionIndex()` that builds `Map<sessionId, filePath>` by scanning directory structure (reads filenames only, not file contents)
2. Module-level singleton cache shared across adapter instances
3. 60-second TTL for cache freshness
4. Static `invalidateSessionIndex()` method for manual cache busting
5. `getSessionById()` now does: index lookup → direct file read → Zod validation

**Performance improvement:**
- Before: O(N) - reads and parses ALL session files
- After: O(1) for cache hit, O(N) stat calls for index rebuild (no file content reads)

**Effort:** 45 minutes

---

### Issue #10: Database Eager Initialization ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/lib/db/connection.ts` |
| **Type** | Architecture |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Removed eager `export const db = getDb()` export. All consumers already use `getDb()` function for lazy initialization.

**Effort:** 5 minutes

---

## Medium Priority (Plan for Phase 4)

### Issue #11: Missing Input Length Validation ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/contract/pm/schemas.ts` |
| **Type** | Security |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `.max()` constraints to all string fields in Zod schemas:
- `title`: max 500 chars
- `description`: max 10000 chars
- `type`, `status`: max 50 chars
- `name` (boards): max 200 chars
- `sessionId`, `parentId`, `key`: max 100 chars
- `linkType`: max 50 chars

**Effort:** 10 minutes

---

### Issue #12: BoardFiltersSchema Mismatch ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/contract/pm/schemas.ts` |
| **Type** | Schema Inconsistency |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `.nullable()` to `BoardFiltersSchema.parentId`. Also updated `BoardFilters` type in `repository.ts` to match.

**Effort:** 5 minutes

---

### Issue #13: Missing Client-Side Form Validation ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | Task creation dialogs |
| **Type** | UX |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added HTML5 validation attributes matching Zod schema constraints:

| Component | Field | Validation Added |
|-----------|-------|------------------|
| `CreateProjectDialog` | name | `required`, `maxLength={500}` |
| `CreateProjectDialog` | description | `maxLength={10000}` |
| `NewTaskDialog` | title | `required`, `maxLength={500}` |
| `NewTaskDialog` | description | `maxLength={10000}` |
| `NewSectionDialog` | title | `required`, `maxLength={200}` |

**Effort:** 15 minutes

---

### Issue #14: Task Status Not Persisted on Drag ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/features/kanban/components/kanban-board.tsx`, `src/features/kanban/utils/store.ts` |
| **Type** | Data Integrity |
| **Status** | ✅ Fixed 2026-01-25 |

**Problem:** Drag-and-drop updated local state via `setTasks()` but did not call API to persist status change.

**Solution:**
1. Added `updateTaskStatus(taskId, newStatus)` action to Zustand store that calls `PATCH /api/issues/{id}`
2. Track pending status updates in `pendingStatusUpdates` ref during drag
3. Persist all status changes in `onDragEnd` handler
4. Verified: drag task → refresh page → task remains in new column ✅

**Effort:** 30 minutes

---

### Issue #15: Comma-Separated Query Param Edge Case ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/api/issues/route.ts:37,42` |
| **Type** | Input Validation |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `.filter(Boolean)` to both type and status query param parsing.

**Effort:** 10 minutes

---

### Issue #16: Race Condition in Project Creation ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/features/projects/components/create-project-dialog.tsx` |
| **Type** | Data Consistency |
| **Status** | ✅ Fixed 2026-01-25 |

**Problem:** If board creation fails, project exists without board.

**Solution:** Implemented transaction-like rollback behavior:
1. If board creation fails, immediately DELETE the project via API
2. Log rollback attempt with structured logger
3. If rollback fails, log error but continue to show user-friendly error
4. Throw clear error message for toast display

**Effort:** 15 minutes

---

### Issue #17: Missing Error Boundary ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/project/[projectId]/board/[boardId]/error.tsx` |
| **Type** | Error Handling |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created `error.tsx` in board route segment with:
- User-friendly error message
- Retry button using Next.js `reset()` function
- Error logging via structured logger

**Effort:** 10 minutes

---

### Issue #18: Redundant router.refresh() ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/features/projects/components/create-project-dialog.tsx:89` |
| **Type** | Performance |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Removed redundant `router.refresh()` call before `router.push()`.

**Effort:** 5 minutes

---

## Low Priority (Backlog) ✅ COMPLETE

### Issue #19: WelcomeScreen Missing onSuccess ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/features/projects/components/welcome-screen.tsx:34` |
| **Type** | Consistency |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added clarifying comment explaining that `onSuccess` is intentionally omitted because `CreateProjectDialog` navigates to the new project after creation, making a refresh callback unnecessary.

**Effort:** 5 minutes

---

### Issue #20: Unsafe Type Assertion ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/layout.tsx:68`, `src/components/layout/providers.tsx` |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Changed `Providers` prop type to accept `string | undefined`. Removed `as string` type assertion from layout.tsx.

**Effort:** 5 minutes

---

### Issue #21: Magic Strings for Issue Types ❌ N/A

| Field | Value |
|-------|-------|
| **Location** | N/A |
| **Status** | ❌ Cancelled - Not Applicable |

**Analysis:** Issue types are user-defined strings stored in the database, not hardcoded magic strings. The codebase correctly uses flexible `z.string()` validation in Zod schemas. Creating a const enum would incorrectly constrain the system.

---

### Issue #22: No Loading State for Root Page ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/loading.tsx` (new) |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created `src/app/loading.tsx` with skeleton UI matching the WelcomeScreen layout.

**Effort:** 10 minutes

---

### Issue #23: Document Check in Render ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/features/kanban/components/kanban-board.tsx` |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Replaced `'document' in window && createPortal(...)` with a `ClientPortal` component using `useSyncExternalStore` for proper SSR-safe hydration detection.

**Effort:** 15 minutes

---

### Issue #24: Empty navItems File ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/config/nav-config.ts` (deleted) |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Deleted `src/config/nav-config.ts`. Updated `src/components/kbar/index.tsx` to define empty `navItems` array inline.

**Effort:** 5 minutes

---

### Issue #25: Outdated README ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `OpenKanban/README.md` |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Rewrote README to reflect actual OpenKanban stack: Next.js 16, SQLite, Drizzle, Zustand, dnd-kit. Removed references to Clerk, Sentry, and upstream template.

**Effort:** 15 minutes

---

## Browser Verification Issues (2026-01-25)

*Discovered during automated browser testing with agent-browser.*

### Issue #26: `/project` Route Returns 404 ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/project/page.tsx` |
| **Type** | Missing Route Handler |
| **Severity** | Low |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created `src/app/project/page.tsx` that:
1. Fetches all projects from repository
2. If projects exist → redirects to most recent project
3. If no projects → renders `WelcomeScreen` component

**Effort:** 10 minutes

---

### Issue #27: `/project/[projectId]/board` Route Returns 404 ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/app/project/[projectId]/board/page.tsx` |
| **Type** | Missing Route Handler |
| **Severity** | Low |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Created `src/app/project/[projectId]/board/page.tsx` that:
1. Validates project exists
2. Fetches boards for the project
3. If boards exist → redirects to first board
4. If no boards → creates default "Main Board" and redirects

**Effort:** 10 minutes

---

### Issue #28: Create Project Button Not in Accessibility Tree ✅ FIXED

| Field | Value |
|-------|-------|
| **Location** | `src/components/layout/app-sidebar.tsx` |
| **Type** | Accessibility |
| **Severity** | Low |
| **Status** | ✅ Fixed 2026-01-25 |

**Solution:** Added `aria-label="Create Project"` to the `SidebarGroupAction` button. Button now appears correctly in accessibility tree as `button "Create Project"`.

**Effort:** 2 minutes

---

## Implementation Roadmap

### Sprint 1: Critical + Quick Wins (1 day) ✅ COMPLETE

| Issue | Effort | Status |
|-------|--------|--------|
| #1 Silent catch in adapter | 15 min | ✅ Done |
| #2 Silent catch in layout | 5 min | ✅ Done |
| #3 Delete dead code | 30 min | ✅ Done |
| #5 Unused variables | 15 min | ✅ Done |
| #6 Hook dependency | 10 min | ✅ Done |
| #12 Schema mismatch | 5 min | ✅ Done |
| #15 Query param edge case | 10 min | ✅ Done |
| #18 Redundant refresh | 5 min | ✅ Done |

**Total:** ~1.5 hours - **COMPLETED 2026-01-25**

### Sprint 2: High Priority (1 day) ✅ COMPLETE

| Issue | Effort | Status |
|-------|--------|--------|
| #4 Structured logging | 1.5 hours | ✅ Done |
| #7 Type unification | 30 min | ✅ Done |
| #10 DB initialization | 5 min | ✅ Done |
| #11 Input validation | 10 min | ✅ Done |
| #17 Error boundary | 10 min | ✅ Done |

**Total:** ~2.5 hours - **COMPLETED 2026-01-25**

### Sprint 3: Medium Priority (2 days) ✅ COMPLETE

| Issue | Effort | Status |
|-------|--------|--------|
| #8 N+1 query | 1 hour | ✅ Done |
| #9 Session lookup | 45 min | ✅ Done |
| #13 Client validation | 15 min | ✅ Done |
| #14 Drag persistence | 30 min | ✅ Done |
| #16 Project creation | 15 min | ✅ Done |

**Total:** ~0 hours remaining - **COMPLETED 2026-01-25**

### Sprint 4: Low Priority Backlog (1 hour) ✅ COMPLETE

| Issue | Effort | Status |
|-------|--------|--------|
| #19 WelcomeScreen onSuccess | 5 min | ✅ Done |
| #20 Unsafe type assertion | 5 min | ✅ Done |
| #21 Magic strings | N/A | ❌ Cancelled (not applicable) |
| #22 Root loading.tsx | 10 min | ✅ Done |
| #23 Document check in render | 15 min | ✅ Done |
| #24 Empty nav-config.ts | 5 min | ✅ Done |
| #25 Outdated README | 15 min | ✅ Done |

**Total:** ~55 minutes - **COMPLETED 2026-01-25**

### Sprint 5: Browser Verification Issues ✅ COMPLETE

| Issue | Effort | Status |
|-------|--------|--------|
| #26 `/project` route 404 | 10 min | ✅ Done |
| #27 `/project/[id]/board` route 404 | 10 min | ✅ Done |
| #28 Create Project button a11y | 2 min | ✅ Done |

**Total:** ~22 minutes - **COMPLETED 2026-01-25**

---

## Verification Checklist

After fixes, verify:

- [x] `npm run build` passes ✅ (2026-01-25)
- [x] `npm run lint` shows 0 warnings ✅ (2026-01-25)
- [x] No `console.` statements (except logger) ✅ (2026-01-25)
- [x] No duplicate type definitions ✅ (2026-01-25) - Issue #7 fixed
- [x] All empty catch blocks have logging or justification comment ✅ (2026-01-25)
- [x] DB initialization is lazy (no eager export) ✅ (2026-01-25) - Issue #10 fixed
- [x] Input length validation on all Zod schemas ✅ (2026-01-25) - Issue #11 fixed
- [x] Error boundary for board route ✅ (2026-01-25) - Issue #17 fixed
- [x] Task drag-and-drop persists on refresh ✅ (2026-01-25) - Issue #14 fixed
- [x] Session lookup uses index cache for O(1) performance ✅ (2026-01-25) - Issue #9 fixed
- [x] Client-side form validation matches Zod schemas ✅ (2026-01-25) - Issue #13 fixed
- [x] Project creation rolls back on board failure ✅ (2026-01-25) - Issue #16 fixed
- [x] Root route has loading.tsx ✅ (2026-01-25) - Issue #22 fixed
- [x] No unsafe type assertions ✅ (2026-01-25) - Issue #20 fixed
- [x] Portal uses proper SSR-safe pattern ✅ (2026-01-25) - Issue #23 fixed
- [x] README reflects actual stack ✅ (2026-01-25) - Issue #25 fixed
- [x] No dead code files ✅ (2026-01-25) - Issue #24 fixed
- [x] `/project` route redirects or shows WelcomeScreen ✅ (2026-01-25) - Issue #26 fixed
- [x] `/project/[id]/board` route redirects to first board ✅ (2026-01-25) - Issue #27 fixed
- [x] Create Project button has aria-label ✅ (2026-01-25) - Issue #28 fixed

---

## Final Status

**Phase 3 Issues Report: 100% COMPLETE ✅**

Original 25 issues from code review:
- 24 issues fixed
- 1 issue cancelled (N/A - Issue #21)

Browser verification testing (2026-01-25):
- 3 low-priority issues discovered (#26, #27, #28)
- All 3 fixed (2026-01-25)
- Core functionality verified working ✅

**Phase 3 backlog is cleared. Ready for Phase 4.**

---

## Browser Verification Summary (2026-01-25)

### ✅ Verified Working

| Feature | Status |
|---------|--------|
| Dynamic routing `/project/[id]/board/[id]` | ✅ |
| Project switching via sidebar | ✅ |
| Sidebar dynamic project list | ✅ |
| Create Project dialog | ✅ |
| Sidebar refresh after creation | ✅ |
| Navigate to new project after creation | ✅ |
| Kanban board data loading | ✅ |
| Task creation | ✅ |
| Section creation | ✅ |
| Column actions (rename/delete) | ✅ |
| Root `/` redirect to first project | ✅ |
| 404 for invalid project IDs | ✅ |
| Command+K search modal | ✅ |
| Theme toggle | ✅ |
| API endpoints (all return 200) | ✅ |
| Build passes | ✅ |
| Lint passes (0 warnings) | ✅ |
| No JavaScript console errors | ✅ |

### ✅ Issues Fixed (2026-01-25)

| Issue | Severity | Status |
|-------|----------|--------|
| #26 `/project` route | Low | ✅ Fixed - redirects to first project |
| #27 `/project/[id]/board` route | Low | ✅ Fixed - redirects to first board |
| #28 Create Project button a11y | Low | ✅ Fixed - aria-label added |
