# Phase 4 Issues & Mitigation Strategies

> **Audit Date:** 2026-01-26
> **Auditor:** Code Review Agent
> **Scope:** Phase 4 features (Board Management, Filter Builder, Hierarchical Display, Link Session UI)

---

## Summary

| Severity | Count | Categories |
|----------|-------|------------|
| **Critical** | 0 | Security (2 closed - N/A for local-first) |
| **High** | 0 | Cache, Logic, Tests (5 fixed) |
| **Medium** | 0 | UX, Accessibility, Performance (10 fixed) |
| **Low** | 0 | Code Quality, Maintainability (6 fixed) |

---

## Critical Issues

### ~~C-01: Missing Authorization on All API Routes~~ [CLOSED - N/A]
- **Status:** ✅ Closed (2026-01-26) - Not applicable for local-first architecture
- **Files:** 
  - `src/app/api/boards/route.ts`
  - `src/app/api/boards/[id]/route.ts`
  - `src/app/api/issues/[id]/sessions/route.ts`
  - `src/app/api/issues/[id]/sessions/[sessionId]/route.ts`
- **Original Description:** All routes directly call services/repositories without any authentication checks.
- **Resolution:** This is a local-first, single-user personal dev tool. Multi-user authentication is not required.
  - App runs on localhost only
  - Data stored in user's local filesystem (`~/.local/share/opencode/storage`)
  - No external network exposure by design
- **Future Consideration:** If multi-user or remote deployment is needed, revisit with appropriate auth strategy (NextAuth, API keys, or OAuth).

### ~~C-02: Missing Rate Limiting~~ [CLOSED - Deferred]
- **Status:** ✅ Closed (2026-01-26) - Deferred for local-first architecture
- **Files:** All API route handlers
- **Original Description:** No middleware or route-level logic for rate limiting exists.
- **Resolution:** Local-first single-user app running on localhost. Rate limiting adds complexity without benefit for current use case.
- **Future Consideration:** Add rate limiting when:
  - Multi-user support is implemented
  - Remote/network deployment is needed
  - Tool matures to production-grade status

---

## High Priority Issues

### ~~H-01: Missing Test Coverage for Board Detail API~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/app/api/boards/[id]/__tests__/route.test.ts`
- **Description:** No tests existed for board detail endpoints.
- **Resolution:** Created comprehensive test file with 11 test cases:
  - GET: returns board with issues, 404 handling, 500 handling
  - PATCH: update name, update filters, 404 handling, invalid JSON, 500 handling
  - DELETE: success, 404 handling, 500 handling
- **Priority:** P1
- **Effort:** Medium (2-3 hours)

### ~~H-02: Stale Breadcrumb Cache on Board Rename~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/boards/hooks/use-board-mutations.ts`
- **Description:** When a board is renamed, only `['boards']` was invalidated.
- **Resolution:** Added `queryClient.invalidateQueries({ queryKey: ['board', id] })` in `useUpdateBoard.onSuccess`
- **Priority:** P1
- **Effort:** Low (15 min)

### ~~H-03: Weak Redirect Logic in Delete Board Dialog~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/boards/components/delete-board-dialog.tsx`
- **Description:** Used `includes(boardId)` which could match substring IDs.
- **Resolution:** Changed to `pathname.includes(\`/board/${boardId}\`)` for exact path segment matching.
- **Priority:** P1
- **Effort:** Low (10 min)

### ~~H-04: Unsafe Array Operations in Drag-and-Drop~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/kanban-board.tsx`
- **Description:** `arrayMove` was called with indices from `findIndex` without -1 guards.
- **Resolution:** Added -1 checks with `logger.warn` and early return in:
  - Column reorder logic (onDragEnd)
  - Task-to-task drag (onDragOver)
  - Task-to-column drag (onDragOver)
- **Priority:** P1
- **Effort:** Low (30 min)

### ~~H-05: Filter Not Applied in Board View Mode~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/kanban-board.tsx`
- **Description:** Status filter had no effect when viewing a board (not a project).
- **Resolution:** Applied Option B - added client-side filtering to `boardData.issues` when `filters.status` is set.
- **Priority:** P1
- **Effort:** Medium (1-2 hours)

---

## Medium Priority Issues

### ~~M-01: Missing Accessibility Label on Status Filter~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/boards/components/board-filter-controls.tsx:76`
- **Description:** The `Select` component lacked `aria-label`. The visual "Status:" label was not programmatically linked.
- **Resolution:** Added `aria-label="Filter tasks by status"` to SelectTrigger.
- **Priority:** P2
- **Effort:** Low (5 min)

### ~~M-02: Keyboard Navigation Missing on Task Cards~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/task-card.tsx:99-104, 116-120`
- **Description:** Card had `onClick` and `cursor-pointer` but no `tabIndex={0}` or `onKeyDown` for Enter/Space.
- **Resolution:** Added `handleKeyDown` function, `tabIndex={0}`, `onKeyDown`, `role="button"`, and `aria-label` to Card component.
- **Priority:** P2
- **Effort:** Low (15 min)

### ~~M-03: Parent Type Icon Case Sensitivity~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/task-card.tsx:117`
- **Description:** `PARENT_TYPE_ICONS` uses lowercase keys (`project`, `epic`). Backend may return capitalized strings.
- **Resolution:** Added `.toLowerCase()` to parent type lookup: `PARENT_TYPE_ICONS[task.parent.type.toLowerCase()]`
- **Priority:** P2
- **Effort:** Low (5 min)

### ~~M-04: Missing React.memo on TaskCard~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/task-card.tsx:45`
- **Description:** Component not memoized. All task cards re-render on any board state change.
- **Resolution:** Wrapped TaskCard with `memo()`: `export const TaskCard = memo(function TaskCard(...) { ... });`
- **Priority:** P2
- **Effort:** Low (5 min)

### ~~M-05: Fragile Timestamp Heuristic~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/lib/date-utils.ts`
- **Description:** Magic number to distinguish seconds vs milliseconds timestamps.
- **Resolution:** Created `normalizeTimestamp()` and `formatTimestamp()` utilities in `date-utils.ts`. Refactored `link-session-dialog.tsx` to use the centralized utility. The threshold constant `SECONDS_MS_THRESHOLD` is now documented with clear explanation.
- **Priority:** P2
- **Effort:** Low (30 min)

### ~~M-06: Search Query Not Trimmed~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/sessions/components/link-session-dialog.tsx:54`
- **Description:** `searchQuery` used directly without `.trim()`. Trailing spaces cause no matches.
- **Resolution:** Added `.trim()` to search query: `const query = searchQuery.trim().toLowerCase();`
- **Priority:** P2
- **Effort:** Low (5 min)

### ~~M-07: Missing Input Sanitization in Zod Schemas~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/contract/pm/schemas.ts`
- **Description:** No `.trim()` or HTML sanitization on `name`, `title`, `description` fields.
- **Resolution:** Added `.transform((s) => s.trim())` to all user-input text fields:
  - `CreateIssueSchema`: `title`, `description`
  - `UpdateIssueSchema`: `title`, `description`
  - `ColumnConfigSchema`: `title`
  - `CreateBoardSchema`: `name`
  - `UpdateBoardSchema`: `name`
- **Priority:** P2
- **Effort:** Low (30 min)

### ~~M-08: Inconsistent HTTP Status Codes~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** `src/app/api/boards/route.ts:99`, `src/app/api/issues/[id]/sessions/route.ts:106`
- **Description:** POST endpoints returned 200 OK instead of 201 Created.
- **Resolution:** Changed both POST endpoints to return `{ status: 201 }`.
- **Priority:** P2
- **Effort:** Low (15 min)

### ~~M-09: Inefficient Cache Invalidation~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** 
  - `src/features/boards/hooks/use-board-mutations.ts`
  - `src/features/boards/components/create-board-dialog.tsx`
  - `src/features/boards/components/rename-board-dialog.tsx`
  - `src/features/boards/components/delete-board-dialog.tsx`
  - `src/features/boards/components/board-actions-menu.tsx`
- **Description:** Invalidates all boards queries globally. Causes unnecessary refetches for other projects.
- **Resolution:** 
  - Added `parentId` to mutation input interfaces
  - Updated `useCreateBoard`, `useUpdateBoard`, `useDeleteBoard` to use `queryKeys.boards(parentId)` for scoped invalidation
  - Updated `RenameBoardDialog` to accept `projectId` prop
  - Updated all calling components to pass `parentId`/`projectId`
- **Priority:** P2
- **Effort:** Medium (1 hour)

### ~~M-10: No Aria Label on Parent Hierarchy Badge~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/features/kanban/components/task-card.tsx:112-124`
- **Description:** Parent info displayed without ARIA context. Screen readers read raw text without relationship context.
- **Resolution:** Added `aria-label` to parent hierarchy div and `aria-hidden="true"` to decorative icon.
- **Priority:** P2
- **Effort:** Low (5 min)

---

## Low Priority Issues

### ~~L-01: Hardcoded Default Column Config~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** Created `src/lib/constants/board-defaults.ts`, updated `src/features/boards/components/create-board-dialog.tsx`
- **Description:** `DEFAULT_COLUMN_CONFIG` was defined in component file.
- **Resolution:** Extracted to `src/lib/constants/board-defaults.ts` with proper typing. Updated import in create-board-dialog.tsx.
- **Priority:** P3
- **Effort:** Low (15 min)

### ~~L-02: Hardcoded 'all' Magic String~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** `src/lib/constants/statuses.ts:46`, `src/features/boards/components/board-filter-controls.tsx:65,74,81`
- **Description:** String `'all'` was used to represent no filter.
- **Resolution:** Added `FILTER_ALL` constant to statuses.ts. Updated board-filter-controls.tsx to use constant.
- **Priority:** P3
- **Effort:** Low (10 min)

### ~~L-03: Hardcoded UI Dimensions~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** 
  - `src/features/kanban/components/kanban-board.tsx:504`
  - `src/features/sessions/components/link-session-dialog.tsx:98`
- **Description:** Pixel values like `w-[300px]`, `max-h-[300px]` hardcoded.
- **Resolution:** Created `src/lib/constants/ui-dimensions.ts` with `KANBAN_DIMENSIONS` and `DIALOG_DIMENSIONS` constants. Updated both files to use centralized constants.
- **Priority:** P3
- **Effort:** Low (30 min)

### ~~L-04: Status Labels Maintenance Risk~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **File:** `src/lib/constants/statuses.ts`, `src/features/boards/components/board-filter-controls.tsx`
- **Description:** `STATUS_LABELS` manually mirrors `ISSUE_STATUSES`. If new status added, this must be updated.
- **Resolution:** Moved `STATUS_LABELS` to `statuses.ts` alongside `ISSUE_STATUSES`. Both are now co-located ensuring any status change updates both. Updated `board-filter-controls.tsx` to import from centralized location.
- **Priority:** P3
- **Effort:** Low (15 min)

### ~~L-05: Hardcoded API Paths~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** `src/lib/api/endpoints.ts`, `src/features/sessions/hooks/use-sessions.ts`, `src/features/sessions/hooks/use-session-mutations.ts`
- **Description:** Strings like `/api/sessions` repeated across files.
- **Resolution:** Created `src/lib/api/endpoints.ts` with `API_ENDPOINTS` constant containing `SESSIONS`, `issueSessionLinks()`, and `issueSessionLink()`. Updated both session hooks to use centralized endpoints.
- **Priority:** P3
- **Effort:** Low (30 min)

### ~~L-06: Missing Duplicate Name Validation~~ [FIXED]
- **Status:** ✅ Fixed (2026-01-26)
- **Files:** `create-board-dialog.tsx`, `rename-board-dialog.tsx`
- **Description:** No check for duplicate board names within a project.
- **Resolution:** Added `useBoards` hook to both dialogs. Implemented `isDuplicateName` memoized check (case-insensitive). Added inline warning message and disabled submit button when duplicate detected. RenameBoardDialog excludes current board from duplicate check.
- **Priority:** P3
- **Effort:** Medium (1 hour)

---

## Recommendations

### Immediate (Before Production)
1. ~~Implement authentication middleware (C-01)~~ - Closed as N/A (local-first)
2. ~~Add rate limiting (C-02)~~ - Deferred (local-first)
3. ~~Add board detail API tests (H-01)~~ - Fixed

### Next Sprint
1. ~~Fix stale breadcrumb cache (H-02)~~ - Fixed
2. ~~Fix delete redirect logic (H-03)~~ - Fixed
3. ~~Fix unsafe DnD array operations (H-04)~~ - Fixed
4. ~~Add aria-label to status filter (M-01)~~ - Fixed
5. ~~Fix parent type case sensitivity (M-03)~~ - Fixed
6. ~~Add React.memo to TaskCard (M-04)~~ - Fixed
7. ~~Trim search query (M-06)~~ - Fixed
8. ~~Add aria-label to parent hierarchy badge (M-10)~~ - Fixed
9. ~~Add keyboard navigation to task cards (M-02)~~ - Fixed
10. ~~Standardize HTTP status codes (M-08)~~ - Fixed
11. ~~Extract DEFAULT_COLUMN_CONFIG to constants (L-01)~~ - Fixed
12. ~~Extract FILTER_ALL constant (L-02)~~ - Fixed

### Backlog ✅ COMPLETE
1. ~~Performance optimizations (M-09 - cache invalidation scoping)~~ - Fixed
2. ~~Timestamp utility extraction (M-05)~~ - Fixed
3. ~~Zod schema sanitization (M-07)~~ - Fixed
4. ~~Code organization (L-03 through L-06)~~ - Fixed (2026-01-26)

---

## Phase 4 Complete

**All 23 issues resolved.** Phase 4 is complete and ready for Phase 5.

---

## Appendix: Files Audited

| Category | Files |
|----------|-------|
| **Components** | `create-board-dialog.tsx`, `rename-board-dialog.tsx`, `delete-board-dialog.tsx`, `board-actions-menu.tsx`, `board-filter-controls.tsx`, `task-card.tsx`, `link-session-dialog.tsx`, `kanban-board.tsx` |
| **Hooks** | `use-boards.ts`, `use-board-mutations.ts`, `use-sessions.ts`, `use-session-mutations.ts` |
| **API Routes** | `api/boards/route.ts`, `api/boards/[id]/route.ts`, `api/issues/[id]/sessions/route.ts`, `api/issues/[id]/sessions/[sessionId]/route.ts` |
| **Types/Schemas** | `contract/pm/schemas.ts`, `features/kanban/types.ts`, `features/sessions/types.ts` |
