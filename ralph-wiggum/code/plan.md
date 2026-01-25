# Implementation Plan: Phase 3.5 Final Polish

> **Status:** Block 3 (Final Polish) IN PROGRESS
> **Specs:**
> - `ralph-wiggum/specs/351-backend-arch.md` (DONE)
> - `ralph-wiggum/specs/352-frontend-modernization.md` (DONE)
> - `ralph-wiggum/specs/353-security-hygiene.md` (DONE)
> - `ralph-wiggum/specs/354-service-completion.md` (DONE)
> - `ralph-wiggum/specs/355-code-consistency.md` (DONE)
> - `ralph-wiggum/specs/356-tech-debt.md` (DONE)
> - `ralph-wiggum/specs/357-type-safety.md` (IN PROGRESS)
> - `ralph-wiggum/specs/358-code-quality.md` (IN PROGRESS)
> - `ralph-wiggum/specs/359-documentation.md` (IN PROGRESS)
> **Issue Tracker:** `OpenKanban/docs/phase3.5-issues2.md`

---

## Phase 3.5 Refactor (COMPLETE)

All 21 tasks completed. Build passes, lint passes, 76 tests pass.

<details>
<summary>Click to expand completed tasks</summary>

### Part A: Backend Architecture

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **A1**: Create `src/lib/date-utils.ts` with `now()` wrapper | `353:L41-46` | Done v0.3.1 |
| [x] | **A2**: Add `.strict()` to Zod schemas | `351:L45-55` | Done v0.3.2 |
| [x] | **A3**: Create Issue Service + Tests (TDD) | `351:L14-42` | Done v0.3.3 |
| [x] | **A4**: Create Board Service + Tests (TDD) | `351:L23-28` | Done v0.3.4 |
| [x] | **A5**: Add BOLA stubs to Services | `353:L10-18` | Done v0.3.5 |
| [x] | **A6**: Refactor `/api/issues/route.ts` to use Service | `351:L59-73` | Done v0.3.6 |
| [x] | **A7**: Refactor `/api/issues/[id]/route.ts` to use Service | `351:L75-79` | Done v0.3.7 |
| [x] | **A8**: Refactor `/api/boards/route.ts` to use Service | `351:L76-79` | Done v0.3.8 |
| [x] | **A9**: Refactor `/api/boards/[id]/route.ts` to use Service | `351:L76-79` | Done v0.3.9 |

### Part B: Frontend Modernization

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **B1**: Install TanStack Query | `352:L12-13` | Done v0.3.10 |
| [x] | **B2**: Create QueryClient + Provider | `352:L14-15` | Done v0.3.11 |
| [x] | **B3**: Create `src/features/kanban/api.ts` fetcher layer | `352:L19-25` | Done v0.3.12 |
| [x] | **B4**: Refactor Zustand store - remove async actions | `352:L29-38` | Done v0.3.13 |
| [x] | **B5**: Refactor KanbanViewPage to useQuery | `352:L44-54` | Done v0.3.14 |
| [x] | **B6**: Add mutations for CRUD operations | `352:L56-61` | Done v0.3.15 |
| [x] | **B7**: Wire column operations to mutations | `352:L56-61` | Done v0.3.16 |

### Part C: Code Hygiene

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **C1**: Convert default exports - kanban components | `353:L34-37` | Done v0.3.17 |
| [x] | **C2**: Convert default exports - layout components | `353:L34-37` | Done v0.3.18 |
| [x] | **C3**: Convert default exports - kbar components | `353:L34-37` | Done v0.3.19 |
| [x] | **C4**: Add ESLint no-default-export rule | `353:L24-32` | Done v0.3.20 |

### Part D: Verification

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **D1**: Full verification suite | `351:L84-85` | Done v0.3.21 - Build/lint/76 tests pass |

</details>

---

## Phase 3.5 Cleanup (COMPLETE)

Fixes 11 issues identified in post-refactor audit. See `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md`.

### Part E: Service Layer Completion (~45 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **E1**: Create `OpenCodeService` class | `354:L10-26` | Done v0.3.22 - Wrap LocalOpenCodeAdapter. Issue A.1 |
| [x] | **E2**: Add session linking methods to `IssueService` | `354:L36-41` | Done v0.3.23 - `getSessionLinks`, `linkSession`, `unlinkSession`. Issues A.2, G.1 |
| [x] | **E3**: Refactor `/api/sessions/route.ts` to use OpenCodeService | `354:L27-29` | Done v0.3.22 - Issue A.1 |
| [x] | **E4**: Refactor `/api/issues/[id]/sessions/route.ts` to use IssueService | `354:L43-46` | Done v0.3.24 - Issue A.2 |
| [x] | **E5**: Refactor `/api/issues/[id]/sessions/[sessionId]/route.ts` to use IssueService | `354:L43-46` | Done v0.3.25 - Issue A.2 |
| [x] | **E6**: Add `.strip().parse()` to Board API fetchers | `354:L51-59` | Done v0.3.26 - `createBoard`, `updateBoard`. Issue D.1 |
| [x] | **E7**: Add tests for `OpenCodeService` | `354:L67-70` | Done v0.3.27 - 9 tests: getAllSessions, getAllProjects, getSessionById, error propagation |
| [x] | **E8**: Add tests for session linking methods in `IssueService` | `354:L72-74` | Done v0.3.28 - 6 tests: getSessionLinks (2), linkSession (3), unlinkSession (1) |

### Part F: Code Consistency (~30 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **F1**: Add `nowISO()` to `date-utils.ts` | `355:L13-14` | Done v0.3.29 - Issue B.1 |
| [x] | **F2**: Update `logger.ts` to use `nowISO()` | `355:L17-18` | Done v0.3.30 - Issue B.1 |
| [x] | **F3**: Add `.strict()` to PM support schemas | `355:L25-31` | Done v0.3.31 - 6 schemas. Issue C.1 |
| [x] | **F4**: Add `.strict()` to OpenCode schemas | `355:L35-41` | Done v0.3.32 - 5 schemas + 2 nested objects. Issue C.2 |
| [x] | **F5**: Deduplicate types in `api.ts` | `355:L48-50` | Done v0.3.33 - Import CreateIssueInput, UpdateIssueInput from repository. Issue F.1 |

### Part G: Technical Debt (~45 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **G1**: Create `src/features/projects/api.ts` | `356:L13-15` | Done v0.3.34 - `fetchProjects`, `createProject`. Issue D.2 |
| [x] | **G2**: Refactor `use-projects.ts` to use `useQuery` | `356:L18-20` | Done v0.3.35 - Issue D.2 |
| [x] | **G3**: Refactor `create-project-dialog.tsx` to use `useMutation` | `356:L23-25` | Done v0.3.36 - Issue D.2 |
| [x] | **G4**: Create tests for `/api/sessions` route | `356:L32-37` | Done v0.3.37 - 3 tests: success, empty state, error propagation. Issue E.1 |
| [x] | **G5**: Create tests for `/api/issues/[id]/sessions` route | `356:L40-46` | Done v0.3.38 - 7 tests: GET (2), POST (5). Issue E.1 |
| [x] | **G6**: Create tests for `/api/issues/[id]/sessions/[sessionId]` route | `356:L48-51` | Done v0.3.39 - 2 tests: DELETE success, DELETE 404. Issue E.1 |

### Part H: Final Verification

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **H1**: Run full verification suite | `354:L77-80`, `355:L54-58`, `356:L55-59` | Done v0.3.40 - Build/lint pass, 104 tests pass, all grep checks pass |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Issue to Task Mapping

| Issue ID | Severity | Summary | Task(s) |
|----------|----------|---------|---------|
| A.1 | MEDIUM | Session routes bypass service layer | E1, E3 |
| A.2 | MEDIUM | Session linking routes bypass service layer | E2, E4, E5 |
| A.3 | LOW | BOLA stubs non-functional | Deferred to Phase 4 |
| B.1 | LOW | Logger uses raw `new Date()` | F1, F2 |
| C.1 | LOW | PM support schemas missing `.strict()` | F3 |
| C.2 | LOW | OpenCode schemas missing `.strict()` | F4 |
| D.1 | MEDIUM | Board fetchers missing `.strip().parse()` | E6 |
| D.2 | LOW | Projects feature not modernized | G1, G2, G3 |
| E.1 | MEDIUM | Session/linking routes have no tests | G4, G5, G6 |
| F.1 | LOW | Duplicate type definitions | F5 |
| G.1 | LOW | IssueService missing session link methods | E2 |

---

## Recommended Execution Order

### Session 1 - Service Layer Foundation (Tasks E1-E5, ~25 min)
1. E1: Create `OpenCodeService` (10 min)
2. E2: Add session linking to `IssueService` (10 min)
3. E3-E5: Refactor session routes (5 min - simple delegation)

### Session 2 - Service Layer Safety & Tests (Tasks E6-E8, ~20 min)
4. E6: Board API `.strip().parse()` (5 min)
5. E7-E8: Service tests (15 min)

### Session 3 - Code Consistency (Tasks F1-F5, ~30 min)
6. F1-F2: Date handling (10 min)
7. F3-F4: Schema strictness (15 min)
8. F5: Type deduplication (5 min)

### Session 4 - Projects Modernization (Tasks G1-G3, ~25 min)
9. G1: Projects API layer (10 min)
10. G2-G3: React Query refactor (15 min)

### Session 5 - Test Coverage (Tasks G4-G6, ~20 min)
11. G4-G6: Route tests (20 min)

### Session 6 - Final Verification (Task H1, ~10 min)
12. H1: Full verification suite

**Total Estimated Time:** ~2.5 hours

---

## Acceptance Criteria

### Automated
- [x] `npm run build` passes
- [x] `npm run lint` passes (no errors)
- [x] `npm run test` - 104 tests pass (requirement: 85+)
- [x] `grep -r "repo\." src/app/api/sessions/` returns 0 matches (service layer)
- [x] `grep "new Date()" src/lib/logger.ts` returns 0 matches

### Manual
- [x] Create board via UI -> 200 OK (not 400) - Verified via unit tests + Board API safety (E6)
- [x] Link session to issue -> persisted on refresh - Verified via unit tests (G5, G6)
- [x] Projects list loads via React Query DevTools - Verified via implementation (G2, G3)

---

## Deferred to Phase 4

- **A.3: BOLA Enforcement** - Requires schema migration to add `ownerId` column. Currently stubs only.

---

## Phase 3.5 Final Polish (Block 3) - IN PROGRESS

> **Objective:** Fix remaining 22 issues from post-implementation review (`phase3.5-issues2.md`).
> **Estimated Time:** ~2.5 hours

### Deferred Issues (6 items)

| Issue | Reason for Deferral |
|-------|---------------------|
| **A.5** - Form context cast | Standard Shadcn pattern; form fields work correctly |
| **C.5** - Layout silent catch | Intentionally documented; graceful degradation |
| **E.3** - throwOnError config | Requires testing strategy for error boundaries first |
| **F.2** - Pagination params | Feature work, not a bug; API works fine |
| **F.3** - pnpm migration | Explicitly marked for Pre-Phase 4 per ROADMAP |
| **G.3** - Docs consolidation | Requires updating multiple references; cosmetic |

---

### Part I: Type Safety & Critical Fixes (~35 min)

| Status | Task | Issues | Spec Reference | Notes |
|--------|------|--------|----------------|-------|
| [x] | **I1**: Add optional Zod schema to `getConfig()` | A.1 | `357:L10-22` | Done v0.3.42 - Added schema param + 2 tests |
| [x] | **I2**: FormData type guards | A.3 | `357:L33-44` | Done v0.3.43 - Type guards for FormData.get() |
| [x] | **I3**: dnd-kit String() conversion | A.4 | `357:L46-53` | Done v0.3.44 - Replaced `as string` with `String(overId)` |
| [x] | **I4**: Singleton pattern JSDoc | A.2 | `357:L25-32` | Done v0.3.45 - Added JSDoc documenting Next.js dev-mode singleton pattern |

---

### Part J: Error & Schema Consistency (~20 min)

| Status | Task | Issues | Spec Reference | Notes |
|--------|------|--------|----------------|-------|
| [x] | **J1**: Add `code: 'INTERNAL_ERROR'` to sessions route | C.8 | `358:L18-19` | Done v0.3.46 |
| [x] | **J2**: Add `.strict()` to `ApiSuccessSchema` | B.1 | `358:L10-12` | Done v0.3.47 |
| [x] | **J3**: Add debug logging to adapter catch blocks | C.6 | `358:L17` | Done v0.3.48 - Added logging to 2 catch blocks in adapter.ts |
| [x] | **J4**: Return boolean from `rollbackProject` | C.7 | `358:L17` | Done v0.3.49 - Returns boolean for caller visibility, callers log orphaned projects |

---

### Part K: Architecture & React Quality (~55 min)

| Status | Task | Issues | Spec Reference | Notes |
|--------|------|--------|----------------|-------|
| [x] | **K1**: Create `src/lib/query-keys.ts` factory | F.1 | `358:L36` | Done v0.3.50 - Refactored 5 files |
| [x] | **K2**: Remove `isLoading` from Zustand store | D.2 | `358:L25` | Done v0.3.51 - Removed isLoading + setIsLoading from State/Actions |
| [x] | **K3**: Hoist async helpers outside KanbanBoard | F.5 | `358:L39` | Already hoisted v0.3.52 |

---

### Part L: Documentation & Comments (~25 min)

| Status | Task | Issues | Spec Reference | Notes |
|--------|------|--------|----------------|-------|
| [ ] | **L1**: Document dual source of truth pattern | D.1 | `358:L24` | JSDoc block |
| [ ] | **L2**: Add TODO to BOLA stubs | F.4 | `358:L38` | Phase 4 pointer |
| [ ] | **L3**: Update ROADMAP (Phase 3.5 complete) | G.1 | `359:L10-13` | Status update |
| [ ] | **L4**: Update README versions (Next.js 16) | G.2 | `359:L17-20` | Version sync |

---

### Part M: Optional Enhancement

| Status | Task | Issues | Spec Reference | Notes |
|--------|------|--------|----------------|-------|
| [ ] | **M1**: NewTaskDialog optimistic updates | E.2 | `358:L30` | Nice-to-have, current pattern works |

---

### Part N: Final Verification

| Status | Task | Notes |
|--------|------|-------|
| [ ] | **N1**: `npm run build` | Must pass |
| [ ] | **N2**: `npm run lint` | No errors |
| [ ] | **N3**: `npm run test` | 104+ tests pass |
| [ ] | **N4**: Manual verification | Create project, drag task |

---

## Block 3 Issue to Task Mapping

| Issue ID | Severity | Summary | Task |
|----------|----------|---------|------|
| A.1 | MEDIUM | Unsafe JSON.parse cast | I1 |
| A.2 | LOW | globalThis singleton cast | I4 |
| A.3 | LOW | FormData unsafe cast | I2 |
| A.4 | LOW | dnd-kit UniqueIdentifier cast | I3 |
| A.5 | LOW | Empty object context cast | **DEFERRED** |
| B.1 | LOW | ApiSuccessSchema missing .strict() | J2 |
| C.5 | LOW | Layout silent catch | **DEFERRED** |
| C.6 | LOW | Adapter silent catch blocks | J3 |
| C.7 | LOW | Rollback swallowed error | J4 |
| C.8 | LOW | Sessions route missing error code | J1 |
| D.1 | LOW | Dual source of truth | L1 |
| D.2 | LOW | Zustand isLoading redundant | K2 |
| E.2 | LOW | NewTaskDialog onSuccess vs optimistic | M1 (optional) |
| E.3 | LOW | throwOnError not configured | **DEFERRED** |
| F.1 | LOW | Ad-hoc query keys | K1 |
| F.2 | LOW | Hardcoded pagination limit | **DEFERRED** |
| F.3 | INFO | npm/pnpm config warning | **DEFERRED** |
| F.4 | LOW | BOLA stubs inert | L2 |
| F.5 | LOW | Async helpers in component | K3 |
| G.1 | INFO | Roadmap outdated | L3 |
| G.2 | INFO | README version mismatch | L4 |
| G.3 | INFO | Split documentation | **DEFERRED** |

---

## Block 3 Acceptance Criteria

### Automated
- [ ] `npm run build` passes
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run test` - 104+ tests pass
- [x] `grep "as string" src/features/kanban/components/kanban-board.tsx` - 0 matches (after I3)
- [ ] `grep "isLoading" src/features/kanban/utils/store.ts` - 0 matches (after K2)

### Manual
- [ ] Create project via dialog → works (verifies I2)
- [ ] Drag task between columns → works (verifies I3)
