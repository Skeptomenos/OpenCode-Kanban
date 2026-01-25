# Spec 3.2: Dynamic Sidebar & Creation

> **Context:** Phase 3. Routing exists. Now we need the sidebar to list actual projects and allow creating new ones.
> **Reference:** `OpenKanban/docs/SCHEMA.md` (Data Model), `src/lib/db/repository.ts` (API)
> **Goal:** Dynamic navigation and project creation.
> **Time Estimate:** ~45 minutes

---

## 1. Create Project Dialog

Create `OpenKanban/src/features/projects/components/create-project-dialog.tsx`.

### 1.1 UI Components
- Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from shadcn.
- Form with:
  - **Name** (Input, required)
  - **Description** (Textarea, optional)
- **Submit Button**: "Create Project" (disabled while submitting).

### 1.2 Logic
- **Action**: 
  1. Call `POST /api/issues` with `{ type: 'project', title: name, ... }`.
  2. Call `POST /api/boards` with `{ name: 'Main Board', filters: { parentId: projectId } }` to initialize the project.
- **On Success**:
  - Close dialog.
  - Call `router.refresh()` to update server components (sidebar).
  - Redirect to `/project/[newProjectId]/board/[newBoardId]`.

---

## 2. Dynamic Sidebar

Refactor `OpenKanban/src/components/layout/app-sidebar.tsx`.

### 2.1 Fetching Logic
- **Constraint**: Sidebar is a Client Component (`use client`).
- **Pattern**: 
  - Use `useEffect` + `fetch('/api/issues?type=project')` + local state `projects`.
  - Handle loading state (skeleton).
  - Handle error state (toast).

### 2.2 Rendering
- Replace static "Overview" with "Projects".
- **Header**: "Projects" + `PlusIcon` button (triggers `CreateProjectDialog`).
- **List**: Map `projects` to `SidebarMenuButton`.
  - Link: `/project/[id]` (Let the project page handle board redirect).
  - Active: `pathname.includes(project.id)`.

---

## 3. Testing & Verification (TDD)

### 3.1 Automated Tests
- [ ] **Unit**: Create `src/features/projects/components/create-project-dialog.test.tsx`.
  - Mock fetch.
  - Test form submission calls both APIs (issue + board).
  - Test redirect on success.

### 3.2 Manual Verification
1. **Sidebar Load**: Verify projects load from DB.
2. **Create Project**:
   - Click "+".
   - Enter details.
   - Click Submit.
   - **Expect**: Sidebar updates (new project appears), URL changes to new board.
   - **Check DB**: `issues` table has project, `boards` table has board with `filters: { parentId: ... }`.
