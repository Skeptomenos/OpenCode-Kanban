# Phase 5: UI/UX Polish & Workflow

> **Goal:** Transform the UI into a polished, production-ready experience and implement critical workflow persistence.

## 1. Sidebar Overhaul (High Impact)

### 1.1 Hierarchy & Navigation
**Requirement:** Merge "Project Boards" into the "Projects" tree.
- **Tree Structure:**
  - Project A
    - Main Board
    - Sprint Board
  - Project B
- **Action:** Remove separate "Project Boards" section. Render boards as children of their Project node in `app-sidebar.tsx`.
- **Acceptance Criteria:**
  - [ ] Verify: Clicking a Project chevron expands to show its boards.
  - [ ] Verify: Clicking a Board navigates to correct route.
  - [ ] Verify: "Project Boards" section is gone.

### 1.2 Layout & Density
**Requirement:**
- **Push Mode:** `InfoSidebar` must be a flex sibling (Master-Detail) on desktop, not an absolute overlay.
  - **Implementation:** In `infobar.tsx`, remove `absolute inset-y-0 z-10` on desktop (`md:`). Change to `relative h-full border-l`. Ensure parent layout in `project/[id]/layout.tsx` uses `flex-row`.
- **Density:** Ensure **Collapsed Sidebar** (icon-only) matches the **loose vertical spacing** of the Expanded Sidebar.
  - **Implementation:** In `app-sidebar.tsx`, check `SidebarMenuItem` padding/gap. Ensure `gap-2` (or similar) is consistent regardless of `state="collapsed"`.
- **Icon Alignment:** Fix Board `...` menu wrapping.
  - **Implementation:** `SidebarMenuButton` container: `flex w-full items-center justify-between`. Title: `truncate min-w-0`. Action: `shrink-0`.
- **Acceptance Criteria:**
  - [ ] Verify: Opening Task Details shifts the main board left (does not cover it).
  - [ ] Verify: Sidebar icons have consistent vertical spacing when collapsed.
  - [ ] Verify: Long board names do not push `...` menu to next line.

### 1.3 Project Actions
**Requirement:** Add `...` menu for Projects.
- **Actions:** Edit (Rename), Delete (Hard).
- **UI:** Replicate `BoardActionsMenu` pattern as `ProjectActionsMenu`.
- **Acceptance Criteria:**
  - [ ] Verify: Clicking `...` on Project shows Edit/Delete.
  - [ ] Verify: Rename updates sidebar immediately.
  - [ ] Verify: Delete removes project and redirects to home/next project.

---

## 2. Task Card Polish

**Requirement:** Redesign `TaskCard` for better information hierarchy.
**Design Spec:**
- **Container:** `p-3` (was `p-4`), `gap-2`.
- **Header:** `flex-row items-start justify-between`.
  - Title: `font-medium leading-tight text-sm`.
  - Drag Handle: `text-muted-foreground/50 hover:text-foreground`.
  - **Remove:** "Task" badge.
- **Body:** `mt-2`.
  - Description: `text-xs text-muted-foreground line-clamp-3`.
- **Footer:** `mt-3 pt-2 border-t flex items-center gap-1`.
  - Parent: `text-[10px] text-muted-foreground font-medium`. Icon `size-3`.
- **Acceptance Criteria:**
  - [ ] Verify: Title is at top. Description is truncated.
  - [ ] Verify: Parent project name shown in footer.
  - [ ] Verify: No "Task" badge visible.

---

## 3. Workflow Features

### 3.1 Editable Description
**Requirement:** Auto-saving description editor.
- **Component:** `src/features/kanban/components/task-description-editor.tsx`.
- **Mount Point:** In `TaskCard.tsx`, replace static description in `InfobarContent` sections with this component.
- **Behavior:**
  - State: Local `value` state initialized from prop.
  - Save Trigger: `onBlur` or `Cmd+Enter`.
  - UI: `Textarea` (autosize).
  - Indicator: Small "Saved" checkmark fading out after save.
- **Acceptance Criteria:**
  - [ ] Verify: Clicking description in sidebar turns into textarea.
  - [ ] Verify: Typing and clicking outside saves to DB.
  - [ ] Verify: "Saved" indicator appears.

### 3.2 New Task Parent Visibility
**Requirement:** Newly created tasks must show their Parent Project name immediately.
- **Fix:** In `NewTaskDialog` `onSuccess`:
  - Lookup Project Title using `useProjects()` list + `currentProjectId`.
  - Inject `{ parent: { id: pid, title: pTitle, type: 'project' } }` into the optimistic/local task update.
- **Acceptance Criteria:**
  - [ ] Verify: Create new task -> Card appears -> Footer shows "Project Name" immediately (no refresh).

### 3.3 Status Filter Cleanup
**Requirement:** Remove "Status: All" dropdown from `BoardFilterControls`.
- **Acceptance Criteria:**
  - [ ] Verify: Board header no longer shows Status dropdown.

---

## 4. Workflow Persistence (Critical)

### 4.1 Schema Migration
**Requirement:** Add `sort_order` column to `issues` table.
- **File:** `src/lib/db/schema.ts`.
- **Change:** Add `sortOrder: real('sort_order').notNull().default(0)`.
- **Steps:**
  1. Modify schema.
  2. `pnpm drizzle-kit generate` (creates SQL migration).
  3. `pnpm drizzle-kit migrate` (applies to local SQLite).
- **Acceptance Criteria:**
  - [ ] Verify: `sqlite3 data/kanban.db ".schema issues"` shows `sort_order` column.

### 4.2 API Contract: Move Issue
**Endpoint:** `PUT /api/issues/[id]/move`
**Request Schema (Zod):**
```typescript
z.object({
  status: z.string(), // Target column ID
  prevIssueId: z.string().nullable(), // Issue above (null if top)
  nextIssueId: z.string().nullable()  // Issue below (null if bottom)
})
```
**Logic:**
- **Calculate Order:**
  - If `prev` & `next`: `(prev.order + next.order) / 2`
  - If `prev` only: `prev.order + 1000`
  - If `next` only: `next.order - 1000`
  - If neither (empty col): `0`
- **Update:** `db.update(issues).set({ status, sortOrder }).where(eq(issues.id, id))`
- **Acceptance Criteria:**
  - [ ] Verify: Drag task to new position -> Refresh -> Task stays in new position.

### 4.3 Optimistic Updates
**Requirement:** Instant UI feedback.
- **Implementation:** In `useTaskMutations` (or equivalent):
  - `onMutate`: Cancel outgoing refetches. Snapshot previous tasks.
  - **Update Cache:** Manually update `tasks` array in QueryCache.
    - Set new `status`.
    - Calculate new `sortOrder` locally (same logic as backend) to prevent jumpiness.
- **Acceptance Criteria:**
  - [ ] Verify: Drag drop is instant. No flicker.

---

## 5. Scale & Integration

### 5.1 Server-Side Search
**Requirement:** Server-side search for Session Linking.
- **API:** `GET /api/sessions?q=...`
  - Use `session-loader` to filter by filename/metadata.
- **UI:** `LinkSessionDialog` uses debounced input (300ms) to call API.
- **Acceptance Criteria:**
  - [ ] Verify: Typing "login" triggers API call `/api/sessions?q=login`.
  - [ ] Verify: Results update.

### 5.2 Session Details View
**Requirement:** View full session transcript within the board.
- **UI:** "View" button on linked sessions in Task Details.
- **Interaction:** Opens modal/pane with read-only session transcript.
- **Acceptance Criteria:**
  - [ ] Verify: Clicking "View" opens session content.

### 5.3 Create Branch from Task
**Requirement:** Generate git branch command for tasks.
- **UI:** "Create Branch" in Task Actions.
- **Logic:** Generate `task/{id}-{slug}`.
- **Action:** Copy command `git checkout -b ...` to clipboard.
- **Acceptance Criteria:**
  - [ ] Verify: "Create Branch" button exists.
  - [ ] Verify: Clicking it copies valid git command.

---

## 6. Execution Sequence
1.  **Sidebar Refactor** (Tree, Density, Push Mode, Actions).
2.  **Task Card & Dialogs** (Card layout, Editor, Parent Fix).
3.  **Schema Migration** (Add `sort_order`).
4.  **Drag Persistence** (API + Frontend Logic).
5.  **Search & Integration** (Search API, Session View, Branch Copy).
