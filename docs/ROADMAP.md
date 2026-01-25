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

### Phase 3: Dynamic Routing & Sidebar
*Goal: Navigate between projects.*
- [ ] Dynamic Route: `src/app/project/[id]/page.tsx`.
- [ ] Sidebar: Dynamically list projects from `storage`.
- [ ] Home: Redirect to last active project.

**Phase 3 Deliverables Checklist:**
- [ ] `src/app/project/[projectId]/board/[boardId]/page.tsx` created
- [ ] Sidebar fetches projects from SQLite
- [ ] "Create Project" button/dialog implemented in Sidebar
- [ ] Kanban Board filters tasks by `parentId` (Project ID)
- [ ] Root `/` redirects to first available project
- [ ] Legacy `/dashboard` routes removed

### Phase 4: The Hierarchical Board
*Goal: Visualize the complex structure and manage board views.*
- [ ] **Board Management**: UI to Create/Rename/Delete boards within a project.
- [ ] **Filter Builder**: UI to configure board filters (e.g., "Status=In Progress", "Type=Task").
- [ ] **Hierarchical Display**: Visualize parent/child relationships on cards.
- [ ] **Link Session UI**: Modal to search and link OpenCode sessions to issues.

**Phase 4 Deliverables Checklist:**
- [ ] `src/features/boards/components/create-board-dialog.tsx`
- [ ] `src/features/boards/components/board-filter-controls.tsx`
- [ ] `src/features/kanban/components/issue-card.tsx` updated with hierarchy indicators
- [ ] `src/features/sessions/components/link-session-dialog.tsx`

### Phase 5: Polish & Workflow
- [ ] Drag & Drop persistence.
- [ ] Session details view (within the board).
- [ ] "Create Branch" from Task (Deep integration).

---

## 4. Current Status

**Last Updated:** 2026-01-25

**State:** Phase 2 COMPLETE. Ready for Phase 3.

| Component | Status | Notes |
|-----------|--------|-------|
| Template cleanup | ✅ Done | 7 phases, ~47 files deleted (archived in `docs/_archive/`) |
| Session loader | ✅ Done | Async I/O, reads from `~/.local/share/opencode/storage` |
| API endpoint | ✅ Done | `GET /api/sessions`, full CRUD for issues/boards |
| Database | ✅ Done | SQLite with Drizzle ORM at `data/kanban.db` |
| Repository | ✅ Done | TDD-verified with 42 tests (vitest) |
| Kanban UI | ✅ Done | Connected to API, data persists across refresh |
| Persistence | ✅ Done | SQLite-backed, survives browser refresh |
| Session Links | ✅ Done | Issues can link to OpenCode sessions |
| ESLint | ✅ Done | Fixed in Phase 1 Cleanup |

**Next Action:** Start Phase 3 dynamic routing and sidebar.

**Documentation:**
- `docs/ROADMAP.md` - This file (master roadmap)
- `docs/ISSUES.md` - Technical debt tracker
- `docs/TECH.md` - Stack decisions
- `OpenKanban/docs/SCHEMA.md` - Data model specification (Phase 2)
