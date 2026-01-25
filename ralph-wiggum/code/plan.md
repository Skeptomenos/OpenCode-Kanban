# Implementation Plan: Phase 3.5 Refactor

> **Status:** Ready for Implementation  
> **Total Estimated Time:** ~3 hours  
> **Specs:**
> - `ralph-wiggum/specs/351-backend-arch.md`
> - `ralph-wiggum/specs/352-frontend-modernization.md`
> - `ralph-wiggum/specs/353-security-hygiene.md`
> - `ralph-wiggum/specs/coding-principle-violations-2026-01-25.md`

## Overview

Refactoring OpenKanban to strict architectural compliance before Phase 4. This plan addresses:
- Missing Service Layer (Route → Service → Repository pattern)
- Manual fetch patterns (replace with TanStack Query)
- Security hygiene (BOLA stubs, Date handling, export conventions)
- Coding principle violations

## Dependencies Graph

```
Part A (Backend) ──┬── A1: date-utils.ts (no deps)
                   ├── A2: Strict schemas (no deps)
                   ├── A3: Issue service + tests (TDD)
                   ├── A4: Board service + tests (TDD)
                   ├── A5: BOLA stubs in services
                   └── A6-A9: Route refactors (depend on A3-A5)
                   
Part B (Frontend) ──┬── B1: Install TanStack Query
                    ├── B2: QueryClient provider
                    ├── B3: kanban/api.ts layer
                    ├── B4: Strip Zustand async actions
                    ├── B5: KanbanViewPage useQuery (depends on B1-B4)
                    ├── B6: Mutation + optimistic drag
                    └── B7: Column operations via mutations
                    
Part C (Hygiene) ───┬── C1-C3: Convert default exports (batched by area)
                    └── C4: ESLint no-default-export rule

Part D (Verify) ────┴── D1: Final integration test
```

---

## Tasks

### Part A: Backend Architecture (~60 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **A1**: Create `src/lib/date-utils.ts` with `now()` wrapper | `353:L41-46` | Done v0.3.1 - Replaced 6x in repository.ts + 1x in adapter.ts. Verified: `grep "Date.now()" src/` → only `date-utils.ts` |
| [x] | **A2**: Add `.strict()` to Zod schemas | `351:L45-55` | Done v0.3.2 - Added `.strict()` to 4 schemas. Tests: 8 new cases (4 valid, 4 rejection) |
| [x] | **A3**: Create Issue Service + Tests (TDD) | `351:L14-42` | Done v0.3.3 - IssueService with 6 methods + 13 tests. All 63 tests pass |
| [x] | **A4**: Create Board Service + Tests (TDD) | `351:L23-28` | Done v0.3.4 - BoardService with 5 methods + 13 tests. All 76 tests pass |
| [x] | **A5**: Add BOLA stubs to Services | `353:L10-18` | Done v0.3.5 - Added ownerId to IssueService + BoardService constructors. Tests updated to pass 'test-owner'. Hints for unused ownerId expected (stub pattern). |
| [x] | **A6**: Refactor `/api/issues/route.ts` to use Service | `351:L59-73` | Done v0.3.6 - Replaced `repo.listIssues()` / `repo.createIssue()` with `service.listIssues()` / `service.createIssue()` |
| [ ] | **A7**: Refactor `/api/issues/[id]/route.ts` to use Service | `351:L75-79` | Replace `repo.getIssueWithRelations()`, `repo.updateIssue()`, `repo.deleteIssue()` with service calls |
| [ ] | **A8**: Refactor `/api/boards/route.ts` to use Service | `351:L76-79` | Replace repo calls with `BoardService` |
| [ ] | **A9**: Refactor `/api/boards/[id]/route.ts` to use Service | `351:L76-79` | Replace repo calls with `BoardService`. Verify: `grep -r "repo\." src/app/api/` shows only instantiation |

### Part B: Frontend Modernization (~75 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **B1**: Install TanStack Query | `352:L12-13` | `npm install @tanstack/react-query`. Verify in `package.json` |
| [ ] | **B2**: Create QueryClient + Provider | `352:L14-15` | Create `src/lib/query-client.ts`. Wrap app in `QueryClientProvider` |
| [ ] | **B3**: Create `src/features/kanban/api.ts` fetcher layer | `352:L19-25` | Functions: `fetchIssues`, `createIssue`, `updateIssue`, `deleteIssue`. **CRITICAL**: Use `Schema.strip().parse(data)` before fetch |
| [ ] | **B4**: Refactor Zustand store - remove async actions | `352:L29-38` | Remove `fetchTasks`, `addTask`, `removeTask`. Keep: `tasks`, `setTasks`, `draggedTask`, `columns`, `updateTaskStatus` |
| [ ] | **B5**: Refactor KanbanViewPage to useQuery | `352:L44-54` | Replace `useEffect` fetch with `useQuery`. Add sync effect: `if (data && !isDragging) store.setTasks(data)` |
| [ ] | **B6**: Add mutations for CRUD operations | `352:L56-61` | Create `useMutation` for create/update/delete. `onSettled`: invalidate `['issues']`. `onError`: rollback Zustand |
| [ ] | **B7**: Wire column operations to mutations | `352:L56-61` | Convert `addCol`, `updateCol`, `removeCol` to use `api.ts` + mutations for board updates |

### Part C: Code Hygiene (~45 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **C1**: Convert default exports - kanban components | `353:L34-37` | Convert: `kanban-view-page.tsx`, `new-task-dialog.tsx`, `new-section-dialog.tsx`. Update imports |
| [ ] | **C2**: Convert default exports - layout components | `353:L34-37` | Convert: `search-input.tsx`, `app-sidebar.tsx`, `page-container.tsx`, `header.tsx`, `providers.tsx`. Update imports |
| [ ] | **C3**: Convert default exports - kbar components | `353:L34-37` | Convert: `kbar/index.tsx`, `render-result.tsx`, `result-item.tsx`, `use-theme-switching.tsx` |
| [ ] | **C4**: Add ESLint no-default-export rule | `353:L24-32` | Install `eslint-plugin-import`. Add rule with override for Next.js pages. Run `npm run lint` |

### Part D: Verification (~15 min)

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [ ] | **D1**: Full verification suite | `351:L84-85`, `352:L65-68`, `353:L50-52` | `npm run build`, `npm run lint`, `npm run test`. Manual: drag test, refresh persistence, rapid drag (no flicker) |

---

## Legend

- `[ ]` Pending
- `[x]` Complete
- `[!]` Blocked

---

## Recommended Execution Order

### Session 1 - Backend Foundation (Tasks A1-A4)
1. A1: `date-utils.ts` - Quick (10 min)
2. A2: Strict schemas - Quick (10 min)
3. A3: Issue Service + tests - Short (25 min)
4. A4: Board Service + tests - Short (20 min)

### Session 2 - Backend Wiring (Tasks A5-A9)
5. A5: BOLA stubs - Quick (10 min)
6. A6-A9: Route refactors - Short each (10 min × 4 = 40 min)

### Session 3 - Frontend Setup (Tasks B1-B4)
7. B1: Install TanStack - Quick (5 min)
8. B2: QueryClient provider - Quick (10 min)
9. B3: `kanban/api.ts` - Short (25 min)
10. B4: Strip Zustand async - Short (15 min)

### Session 4 - Frontend Integration (Tasks B5-B7)
11. B5: KanbanViewPage useQuery - Short (25 min)
12. B6: Mutations - Short (20 min)
13. B7: Column mutations - Short (15 min)

### Session 5 - Hygiene (Tasks C1-C4)
14. C1-C3: Export conversions - Quick each (10 min × 3 = 30 min)
15. C4: ESLint rule - Quick (15 min)

### Session 6 - Final
16. D1: Full verification - Short (15 min)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Strict schemas break existing clients | B3 implements `.strip().parse()` before send |
| TanStack Query + Zustand conflict | B5 sync effect checks `isDragging` flag |
| Export refactor breaks imports | Do one area at a time, run build after each |
| Date.now() in tests | Tests already use `createTestDb` isolation |

---

## Acceptance Criteria

- [ ] `npm run build` passes
- [ ] `npm run lint` passes (no errors)
- [ ] `npm run test` - all 42+ tests pass
- [ ] `grep -r "repo\." src/app/api/` - shows only instantiation patterns
- [ ] `grep "Date.now()" src/` - only matches `date-utils.ts`
- [ ] Drag-and-drop: visual update → refresh → persisted
- [ ] Rapid drag: no flickering or race conditions
