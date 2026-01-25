s# Implementation Plan: Phase 3.5 Complete

> **Status:** Phase 3.5 Refactor COMPLETE | Phase 3.5 Cleanup PENDING
> **Specs:**
> - `ralph-wiggum/specs/351-backend-arch.md` (DONE)
> - `ralph-wiggum/specs/352-frontend-modernization.md` (DONE)
> - `ralph-wiggum/specs/353-security-hygiene.md` (DONE)
> - `ralph-wiggum/specs/354-service-completion.md` (PENDING)
> - `ralph-wiggum/specs/355-code-consistency.md` (PENDING)
> - `ralph-wiggum/specs/356-tech-debt.md` (PENDING)
> **Issue Tracker:** `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md`

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

## Phase 3.5 Cleanup (PENDING)

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
| [ ] | **G3**: Refactor `create-project-dialog.tsx` to use `useMutation` | `356:L23-25` | Issue D.2 |
| [ ] | **G4**: Create tests for `/api/sessions` route | `356:L32-37` | 3 test cases. Issue E.1 |
| [ ] | **G5**: Create tests for `/api/issues/[id]/sessions` route | `356:L40-46` | 5 test cases. Issue E.1 |
| [ ] | **G6**: Create tests for `/api/issues/[id]/sessions/[sessionId]` route | `356:L48-51` | 2 test cases. Issue E.1 |

### Part H: Final Verification

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **H1**: Run full verification suite | `354:L77-80`, `355:L54-58`, `356:L55-59` | Build, lint, 85+ tests, manual checks |

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
- [ ] `npm run build` passes
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run test` - 85+ tests pass (currently 76)
- [ ] `grep -r "repo\." src/app/api/sessions/` returns 0 matches (service layer)
- [ ] `grep "new Date()" src/lib/logger.ts` returns 0 matches

### Manual
- [ ] Create board via UI -> 200 OK (not 400)
- [ ] Link session to issue -> persisted on refresh
- [ ] Projects list loads via React Query DevTools

---

## Deferred to Phase 4

- **A.3: BOLA Enforcement** - Requires schema migration to add `ownerId` column. Currently stubs only.
