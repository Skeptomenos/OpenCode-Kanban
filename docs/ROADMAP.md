# OpenKanban Project Vision & Roadmap

> **Goal:** Build a hierarchical Project Management system that integrates seamlessly with OpenCode sessions.

## 1. The Vision
A local-first Project Management tool where:
1.  **Structure**: Projects > Milestones > Epics > User Stories > Tasks.
2.  **Visualization**: Multiple Kanban boards per project (e.g., "Feature Planning", "Sprint 1").
3.  **Integration**: OpenCode sessions are treated as *evidence* or *implementation details* linked to Tasks.
4.  **Local-First**: All data lives in `~/.local/share/opencode/storage` or the project root. No cloud database.

## 2. Architecture
-   **Framework**: Next.js 16 (App Router).
-   **State**: Zustand (Global Store).
-   **Database**: SQLite with Drizzle ORM (`data/kanban.db`).
-   **Data Store**:
    -   **PM Data**: SQLite database (Issues, Boards, Labels, Config).
    -   **Session Data**: `~/.local/share/opencode/storage/` (Read-only reference via adapter).
-   **Routing**: `/project/[projectId]/board/[boardId]`.

---

## 3. Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
*Goal: A stable, clean application shell capable of loading data.*
- [x] Select Base (`Kiranism`).
- [x] Strip Auth & Bloat (7-phase cleanup completed 2026-01-25).
- [x] Connect to Local Filesystem (`session-loader`).
- [x] Verify Build & Run.
- [x] Implement OpenCode Data Contract (v1.0).
- [x] Refactor UI to use Contract types (Strict Types).
- [x] Decouple Mapping Logic (completed, then removed in demo cleanup).

**Technical Debt Resolved:**
- [x] Fix ESLint Configuration (resolved 2026-01-25).
- [x] Remove "Session = Card" demo logic (resolved 2026-01-25).

### Phase 2: The PM Data Layer ✅ COMPLETE
*Goal: Create the "brain" of the system.*
- [x] Define Schema (`Issue`, `Project`, `Board`) in `docs/SCHEMA.md`.
- [x] Create `storage-engine` (SQLite/Drizzle with TDD-verified repository).
- [x] Create API routes (`GET/POST/PATCH/DELETE /api/issues`, `/api/boards`, `/api/issues/[id]/sessions`).

**Phase 2 Deliverables (completed 2026-01-25):**
- SQLite database with Drizzle ORM (`data/kanban.db`)
- 42 passing repository tests (vitest)
- Full CRUD API routes with Zod validation
- Zustand store integration with API persistence
- Session linking for issue-to-OpenCode integration

### Phase 3: Dynamic Routing & Sidebar ✅ COMPLETE
*Goal: Navigate between projects.*
- [x] Dynamic Route: `src/app/project/[projectId]/page.tsx`.
- [x] Sidebar: Dynamically list projects from `storage`.
- [x] Home: Redirect to last active project (or welcome screen).

**Phase 3 Deliverables (completed 2026-01-25):**
- [x] `src/app/project/[projectId]/board/[boardId]/page.tsx` created
- [x] Sidebar fetches projects from SQLite
- [x] "Create Project" button/dialog implemented in Sidebar
- [x] Kanban Board filters tasks by `parentId` (Project ID)
- [x] Root `/` shows welcome screen or redirects to project
- [x] Legacy `/dashboard` routes removed

### Phase 3.5: Refactor & Cleanup ✅ COMPLETE
*Goal: Address 11 architectural issues identified in post-Phase-3 audit.*

**Phase 3.5 Refactor (completed 2026-01-25):**
- [x] Backend Architecture: Service layer, Zod strict schemas, BOLA stubs
- [x] Frontend Modernization: TanStack Query, API fetcher layer, mutations
- [x] Code Hygiene: Named exports, ESLint no-default-export rule

**Phase 3.5 Cleanup (completed 2026-01-25):**
- [x] Service Layer Completion: OpenCodeService, session linking
- [x] Code Consistency: Date utils, schema strictness, type deduplication
- [x] Technical Debt: Projects modernization, route tests

**Phase 3.5 Final Polish (completed 2026-01-26):**
- [x] Type Safety: Zod schema validation, FormData guards, dnd-kit conversions
- [x] Error Handling: Debug logging, rollback visibility, error codes
- [x] Architecture: Query keys factory, store cleanup, documentation

### Pre-Phase 4: Tooling Migration
*Goal: Standardize on pnpm before feature work.*
- [x] Delete `node_modules/` and `package-lock.json`
- [x] Run `pnpm install`
- [x] Remove `shamefully-hoist=true` from `.npmrc` (start strict)
- [x] Verify build passes (`pnpm run build`)
- [x] Update team docs to reference `pnpm` commands

### Phase 4.0: Stability & Prerequisites ✅ COMPLETE
*Goal: Fix critical bugs and UX blockers before adding hierarchy.*
- [x] **CRITICAL BUG**: Fix duplicate column creation (Double entries in DB on "+ Add Section"). ✅ Fixed 2026-01-26
- [x] **BLOCKER**: Fix Task Details Panel (click handler opens info sidebar). ✅ Fixed 2026-01-26
- [x] **UX**: Replace UUIDs in breadcrumbs with Project/Board names. ✅ Fixed 2026-01-26
- [x] **UX**: Add visual feedback for drag-and-drop operations (drop indicators). ✅ Fixed 2026-01-26

### Phase 4: The Hierarchical Board
*Goal: Visualize the complex structure and manage board views.*
- [x] **Board Management**: UI to Create/Rename/Delete boards within a project. ✅ COMPLETE (v0.3.84)
- [ ] **Filter Builder**: UI to configure board filters (e.g., "Status=In Progress", "Type=Task").
- [ ] **Hierarchical Display**: Visualize parent/child relationships on cards.
- [ ] **Link Session UI**: Modal to search and link OpenCode sessions to issues.

**Phase 4.1-4.4 Board Management Deliverables (completed 2026-01-26):**
- [x] Backend: `GET /api/boards?parentId=X` filtering by project
- [x] Frontend: `useBoards(projectId)` hook with React Query
- [x] `src/features/boards/components/create-board-dialog.tsx`
- [x] `src/features/boards/components/rename-board-dialog.tsx`
- [x] `src/features/boards/components/delete-board-dialog.tsx`
- [x] `src/features/boards/components/board-actions-menu.tsx`
- [x] Sidebar "Project Boards" group with CRUD operations
- [x] 130 tests passing, build clean

**Remaining Phase 4 Deliverables:**
- [ ] `src/features/boards/components/board-filter-controls.tsx`
- [ ] `src/features/kanban/components/issue-card.tsx` updated with hierarchy indicators
- [ ] `src/features/sessions/components/link-session-dialog.tsx`

### Phase 5: UI/UX Polish & Workflow ✅ COMPLETE
- [x] **Tooling**: Integrated `agentation` for visual feedback.
- [x] **Sidebar Overhaul**:
    - [x] Hierarchy: Nest Boards under Projects.
    - [x] Layout: "Push Mode" (Master-Detail) layout.
    - [x] Actions: Edit/Delete Projects menu.
- [x] **Task Card**:
    - [x] Layout: Title in header, description preview.
    - [x] Editor: Auto-saving description textarea.
    - [x] Fix: Parent visibility on new tasks.
- [x] **Workflow Persistence**:
    - [x] Drag & Drop: Persist reordering and column moves.
    - [x] Optimistic Updates: Instant UI feedback.
- [x] **Scale**:
    - [x] Server-side session metadata search.
- [x] **Integration** (Deferred):
    - [x] Session details view (within board).
    - [x] "Create Branch" from Task.

### Phase 6: UI Overhaul & Refinement
*Goal: Address lingering UI inconsistencies and achieve a polished, cohesive design system.*
- [ ] **Global Design System**:
    - [ ] Standardize typography and spacing tokens.
    - [ ] Unified z-index management strategy.
- [ ] **Component Polish**:
    - [ ] Task Card: Refine overflow handling and visual density.
    - [ ] Sidebar: Enhance collapsed state and transition animations.
    - [ ] Dialogs: Standardize header/footer layouts.
- [ ] **Responsive Refinement**:
    - [ ] Mobile navigation and layout optimization.
    - [ ] Touch target sizing for drag handles.
- [ ] **Interaction Feedback**:
    - [ ] Loading states for all async actions.
    - [ ] Toast notification consistency.

---

## 4. Current Status

**Last Updated:** 2026-01-28

**State:** Phase 5 COMPLETE. Ready for Phase 6 UI Overhaul.

| Component | Status | Notes |
|-----------|--------|-------|
| Tooling | ✅ Done | Migrated to pnpm, strict mode enabled |
| Template cleanup | ✅ Done | 7 phases, ~47 files deleted (archived in `docs/_archive/`) |
| Session loader | ✅ Done | Async I/O, reads from `~/.local/share/opencode/storage` |
| API endpoint | ✅ Done | `GET /api/sessions`, full CRUD for issues/boards |
| Database | ✅ Done | SQLite with Drizzle ORM at `data/kanban.db` |
| Repository | ✅ Done | TDD-verified with 166 tests (vitest) |
| Kanban UI | ✅ Done | Connected to API, data persists across refresh |
| Persistence | ✅ Done | SQLite-backed, survives browser refresh |
| Session Links | ✅ Done | Issues can link to OpenCode sessions |
| ESLint | ✅ Done | Fixed in Phase 1 Cleanup |
| Dynamic Routing | ✅ Done | `/project/[projectId]/board/[boardId]` |
| Sidebar Projects | ✅ Done | Fetches from SQLite, Create Project dialog |
| Service Layer | ✅ Done | IssueService, BoardService, OpenCodeService |
| TanStack Query | ✅ Done | Replaces Zustand async actions |
| Type Safety | ✅ Done | Zod strict schemas, FormData guards |
| UI/UX Polish | ✅ Done | Sidebar hierarchy, Task layout, Drag persistence |

**Next Action:** Begin Phase 6 planning.

**Documentation:**
- `docs/ROADMAP.md` - This file (master roadmap)
- `docs/ISSUES.md` - Technical debt tracker
- `docs/TECH.md` - Stack decisions
- `OpenKanban/docs/SCHEMA.md` - Data model specification (Phase 2)
- `OpenKanban/docs/PHASE-3.5-REFACTOR-ISSUES.md` - Phase 3.5 issue tracker
