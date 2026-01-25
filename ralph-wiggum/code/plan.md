# Implementation Plan: Phase 3 - Dynamic Routing & Sidebar

> **Status**: Ready for Implementation  
> **Last Updated**: 2026-01-25  
> **Spec References**: `ralph-wiggum/specs/31-route-structure.md`, `32-dynamic-sidebar.md`, `33-board-integration.md`

## Context Summary

### Current State
- **Data Layer**: Phase 2 complete - SQLite/Drizzle repository with full CRUD, 42 tests passing
- **Routing**: Flat `/dashboard/kanban` structure pointing to a single "Default Board"
- **Sidebar**: Static navigation from `nav-config.ts` with one item ("Kanban")
- **Store**: `useTaskStore` manages tasks/columns but lacks `currentProjectId`
- **API**: `parentId` filtering already implemented in repository

### Target State
- **Routing**: `/project/[projectId]/board/[boardId]` hierarchy
- **Sidebar**: Dynamic project list from DB with "Create Project" dialog
- **Board**: Context-aware - filters tasks by `parentId` (project scope)
- **Root**: Smart redirect to first project or "Create Project" empty state

---

## Tasks

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Create project route structure (`src/app/project/[projectId]/...`) | `specs/31-route-structure.md:L10-25` | Done in v0.3.0-task1.1 |
| [x] | **Task 1.2**: Implement project layout with shared sidebar/header | `specs/31-route-structure.md:L29-35` | Done in v0.3.0-task1.2 |
| [x] | **Task 1.3**: Implement project root redirect page (`/project/[projectId]/page.tsx`) | `specs/31-route-structure.md:L37-46` | Done in v0.3.0-task1.3 |
| [x] | **Task 1.4**: Implement board page (`/project/[projectId]/board/[boardId]/page.tsx`) | `specs/31-route-structure.md:L48-55` | Done in v0.3.0-task1.4 |
| [x] | **Task 1.5**: Add loading and not-found states for project routes | `specs/31-route-structure.md:L19-24` | Done in v0.3.0-task1.5 |
| [x] | **Task 2.1**: Create `CreateProjectDialog` component | `specs/32-dynamic-sidebar.md:L10-28` | Done in v0.3.0-task2.1 |
| [x] | **Task 2.2**: Create `useProjects` hook for fetching projects | `specs/32-dynamic-sidebar.md:L37-41` | Done in v0.3.0-task2.2 |
| [x] | **Task 2.3**: Refactor `AppSidebar` for dynamic project listing | `specs/32-dynamic-sidebar.md:L32-48` | Done in v0.3.0-task2.3 |
| [x] | **Task 2.4**: Add "+" button and integrate CreateProjectDialog in sidebar | `specs/32-dynamic-sidebar.md:L45-46` | Done in v0.3.0-task2.4 |
| [x] | **Task 3.1**: Add `currentProjectId` to Zustand store | `specs/33-board-integration.md:L14-17` | Done in v0.3.0-task3.1 |
| [x] | **Task 3.2**: Update `addTask` to include `parentId` in API payload | `specs/33-board-integration.md:L25-28` | Done in v0.3.0-task3.2 |
| [x] | **Task 3.3**: Create `fetchTasks(projectId)` action in store | `specs/33-board-integration.md:L20-22` | Done in v0.3.0-task3.3 |
| [x] | **Task 3.4**: Update `KanbanViewPage` to accept and use `projectId`/`boardId` props | `specs/33-board-integration.md:L36-44` | Done in v0.3.0-task3.4 |
| [x] | **Task 3.5**: Update `KanbanBoard` component to be project-aware | `specs/33-board-integration.md:L40-44` | Done in v0.3.0-task3.5 (verified: already implemented via Zustand store pattern) |
| [x] | **Task 4.1**: Update root page (`src/app/page.tsx`) for smart redirect | `specs/31-route-structure.md:L57-62` | Done in v0.3.0-task4.1 |
| [x] | **Task 4.2**: Create empty state "Welcome/Create Project" UI | `specs/31-route-structure.md:L62` | Done in v0.3.0-task4.2 - Created `WelcomeScreen` component with centered Card and prominent CTA |
| [x] | **Task 5.1**: Verify build passes with all new routes | `specs/31-route-structure.md:L72` | Done in v0.3.0-task5.1 - Build passes, all routes compiled successfully |
| [x] | **Task 5.2**: Manual verification of project isolation | `specs/33-board-integration.md:L56-60` | Done in v0.3.0-task5.2 - All isolation tests passed via Playwright |
| [ ] | **Task 6.1**: Delete legacy `/dashboard` routes | `specs/phase3-plan.md:L156-163` | Clean up after verification |
| [ ] | **Task 6.2**: Update `nav-config.ts` to remove static items | `specs/phase3-plan.md:L160` | Projects are now dynamic |

---

## Legend

- `[ ]` Pending
- `[x]` Complete  
- `[!]` Blocked

---

## Implementation Notes

### File Creation Order (Dependencies)

```
Phase 1: Route Structure (Tasks 1.1-1.5)
├── Task 1.1 creates directories
├── Task 1.2-1.5 can run in parallel after 1.1

Phase 2: Sidebar & Dialog (Tasks 2.1-2.4)
├── Task 2.1 (Dialog) and 2.2 (Hook) are independent
├── Task 2.3-2.4 depend on 2.1 and 2.2

Phase 3: Store & Board Integration (Tasks 3.1-3.5)
├── Task 3.1 (Store state) must be first
├── Tasks 3.2-3.3 depend on 3.1
├── Tasks 3.4-3.5 depend on Phase 1 routes + 3.1

Phase 4: Root Redirect (Tasks 4.1-4.2)
├── Depends on Phase 2 (needs project fetching)

Phase 5: Verification (Tasks 5.1-5.2)
├── Depends on all above

Phase 6: Cleanup (Tasks 6.1-6.2)
├── Only after Phase 5 verification passes
```

### Key Code Patterns to Follow

1. **Dialog Pattern**: See `src/features/kanban/components/new-section-dialog.tsx`
2. **Layout Pattern**: See `src/app/dashboard/layout.tsx`
3. **Async Params** (Next.js 16): `params: Promise<{ projectId: string }>`
4. **API Fetch Pattern**: See `useTaskStore.addTask` for `try/catch` + toast errors

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/issues?type=project` | GET | List all projects for sidebar |
| `/api/issues?parentId=[id]` | GET | List tasks for a project |
| `/api/issues` | POST | Create project or task |
| `/api/boards` | POST | Create board for new project |
| `/api/boards/[id]` | GET | Get board with filtered issues |

### Files to Create

```
src/app/project/
├── [projectId]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── board/
│       └── [boardId]/
│           ├── page.tsx
│           └── loading.tsx

src/features/projects/
├── components/
│   └── create-project-dialog.tsx
└── hooks/
    └── use-projects.ts
```

### Files to Modify

```
src/components/layout/app-sidebar.tsx     # Dynamic project list
src/features/kanban/utils/store.ts        # Add projectId state
src/features/kanban/components/kanban-view-page.tsx  # Accept props
src/features/kanban/components/kanban-board.tsx      # Project context
src/app/page.tsx                          # Smart redirect
src/config/nav-config.ts                  # Remove static items (cleanup)
```

---

## Verification Checklist (Definition of Done)

From `specs/phase3-plan.md:L38-43`:

- [ ] Sidebar lists all projects from the database
- [ ] "Create Project" button works in sidebar
- [ ] Clicking a project in sidebar navigates to its board
- [ ] URL reflects current project and board
- [ ] Kanban board loads tasks *only* for the active project
- [ ] Root URL `/` redirects to a valid project
