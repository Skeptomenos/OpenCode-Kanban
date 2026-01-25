# Phase 3: Dynamic Routing & Sidebar

> **Goal:** Enable navigation between multiple projects and boards.
> **Prerequisite:** Phase 2 (Data Layer) complete.

---

## Context

### Original Request
Implement Phase 3 of OpenKanban: Dynamic routing for projects and a sidebar that lists them from the database.

### Current State
- **Data Layer**: SQLite database works, API routes exist for Issues and Boards.
- **UI**: Static "Kanban" link in sidebar points to `/dashboard/kanban`.
- **Routing**: Flat `/dashboard` structure.

### Vision
- **URL**: `/project/[projectId]/board/[boardId]`
- **Sidebar**: Dynamic list of projects (fetched from DB).
- **Home**: Redirect to last active project or first available.

---

## Work Objectives

### Core Objective
Refactor the application routing to be project-centric, make the sidebar dynamic, and allow project creation.

### Concrete Deliverables
- `src/app/project/[projectId]/layout.tsx` - Project context layout
- `src/app/project/[projectId]/board/[boardId]/page.tsx` - Dynamic board page
- Updated `src/components/layout/app-sidebar.tsx` - Dynamic project list
- `src/features/projects/components/create-project-dialog.tsx` - New UI component
- Updated `src/app/page.tsx` - Smart redirect

### Definition of Done
- [ ] Sidebar lists all projects from the database
- [ ] "Create Project" button works in sidebar
- [ ] Clicking a project in sidebar navigates to its board
- [ ] URL reflects current project and board
- [ ] Kanban board loads tasks *only* for the active project
- [ ] Root URL `/` redirects to a valid project

### Must Have
- Dynamic fetching of projects in sidebar
- Active state styling in sidebar
- 404 handling for invalid project IDs
- Basic "Create Project" dialog (Name + Key/ID)

### Must NOT Have
- Auth/User separation (local-first, single user)
- Complex workspace switching (just flat project list for now)

---

## Task Flow

```
Task 1 (Route Structure) → Task 2 (Sidebar Logic) → Task 3 (Project Creation UI) → Task 4 (Board Integration) → Task 5 (Redirects) → Task 6 (Cleanup)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | - | Independent: creates file structure |
| 2 | 1 | Needs route structure to link to |
| 3 | 2 | Needs sidebar to place button |
| 4 | 1 | Needs route params |
| 5 | 2, 4 | Needs working routes to redirect to |
| 6 | 5 | Cleanup after verification |

---

## TODOs

- [ ] 1. Create Project Route Structure

  **What to do**:
  - Create directory `src/app/project/[projectId]/board/[boardId]/`
  - Create `src/app/project/layout.tsx`:
    - Re-use `DashboardLayout` logic or import it
    - Ensure `AppSidebar` is rendered
  - Create `src/app/project/page.tsx`:
    - Redirect to first project or empty state

  **References**:
  - `src/app/dashboard/layout.tsx` - Copy pattern

  **Acceptance Criteria**:
  - [ ] Routes exist
  - [ ] Layout renders sidebar

- [ ] 2. Implement Dynamic Sidebar & Creation

  **What to do**:
  - Update `src/components/layout/app-sidebar.tsx`
  - Fetch projects using `useFilteredNavItems` (or new hook `useProjects`)
  - Create `src/features/projects/components/create-project-dialog.tsx`:
    - Form to inputs: Title, Description
    - Call `POST /api/issues` with `{ type: 'project' }`
  - Add "+" button to "Projects" group in sidebar trigger the dialog

  **References**:
  - `src/config/nav-config.ts` - Interface definition
  - `src/lib/db/repository.ts` - Data source

  **Acceptance Criteria**:
  - [ ] Sidebar shows projects from DB
  - [ ] "+" button opens dialog
  - [ ] Creating project refreshes list and redirects
  - [ ] Links point to `/project/[id]/board/default`

- [ ] 3. Create Project Creation UI

  **What to do**:
  - Add a "+" button to the Sidebar (near "Projects" header)
  - Create `NewProjectDialog` component (similar to `NewSectionDialog`)
  - Form inputs: Project Title, Description (optional)
  - On submit: `POST /api/issues` with `type: 'project'`
  - On success: Refresh sidebar list and navigate to new project

  **References**:
  - `src/features/kanban/components/new-section-dialog.tsx` - Copy pattern

  **Acceptance Criteria**:
  - [ ] Can create a new project via UI
  - [ ] Sidebar updates immediately
  - [ ] User is redirected to new project

- [ ] 4. Update Kanban Board to Use Params

  **What to do**:
  - Move/Copy `src/app/dashboard/kanban/page.tsx` logic to `src/app/project/[projectId]/board/[boardId]/page.tsx`
  - Update `KanbanBoard` component (or wrapper) to accept `projectId` and `boardId` props
  - Update `store.ts` to filter/fetch based on these props

  **References**:
  - `src/features/kanban/components/kanban-view-page.tsx`

  **Acceptance Criteria**:
  - [ ] Board loads data specific to the URL params
  - [ ] Creating a task assigns it to the current project

- [ ] 5. Root Redirect & Empty States

  **What to do**:
  - Update `src/app/page.tsx`
  - Fetch projects -> if > 0, redirect to first
  - Else, show "Create your first project" empty state (reuse `NewProjectDialog`)

  **Acceptance Criteria**:
  - [ ] `/` redirects correctly

- [ ] 6. Cleanup Dashboard Routes

  **What to do**:
  - Delete `src/app/dashboard` folder (once verified)
  - Update `src/config/nav-config.ts` (remove static items)

  **Acceptance Criteria**:
  - [ ] No dead code/routes

---

## Verification

### Manual Verification
1. Create a project via API (if UI doesn't exist yet): `curl -X POST ...`
2. Refresh page -> Sidebar shows project
3. Click project -> URL changes -> Board loads
4. Create task -> Task appears on board
5. Switch project -> Board clears/changes

