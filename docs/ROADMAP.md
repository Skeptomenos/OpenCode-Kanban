# OpenKanban Project Vision & Roadmap

> **Goal:** Build a hierarchical Project Management system that integrates seamlessly with OpenCode sessions.

## 1. The Vision
A local-first Project Management tool where:
1.  **Structure**: Projects > Milestones > Epics > User Stories > Tasks.
2.  **Visualization**: Multiple Kanban boards per project (e.g., "Feature Planning", "Sprint 1").
3.  **Integration**: OpenCode sessions are treated as *evidence* or *implementation details* linked to Tasks.
4.  **Local-First**: All data lives in `~/.local/share/opencode/storage` or the project root. No cloud database.

## 2. Architecture
-   **Framework**: Next.js 14 (App Router).
-   **State**: Zustand (Global Store).
-   **Data Store**:
    -   **PM Data**: `kanban.json` (New file for Issues/Hierarchy).
    -   **Session Data**: `session/*.json` (Read-only reference).
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

### Phase 2: The PM Data Layer
*Goal: Create the "brain" of the system.*
- [ ] Define Schema (`Issue`, `Project`, `Board`) in `docs/SCHEMA.md`.
- [ ] Create `storage-engine` (Read/Write `kanban.json`).
- [ ] Create API routes (`GET/POST /api/issues`).

### Phase 3: Dynamic Routing & Sidebar
*Goal: Navigate between projects.*
- [ ] Dynamic Route: `src/app/project/[id]/page.tsx`.
- [ ] Sidebar: Dynamically list projects from `storage`.
- [ ] Home: Redirect to last active project.

### Phase 4: The Hierarchical Board
*Goal: Visualize the complex structure.*
- [ ] Refactor `KanbanBoard` to support "Issue" type.
- [ ] Add "Filters" (Show Milestones vs Tasks).
- [ ] Implement "Link Session" UI (Modal to select session).

### Phase 5: Polish & Workflow
- [ ] Drag & Drop persistence.
- [ ] Session details view (within the board).
- [ ] "Create Branch" from Task (Deep integration).

---

## 4. Current Status

**Last Updated:** 2026-01-25

**State:** Phase 1 COMPLETE. Ready for Phase 2.

| Component | Status | Notes |
|-----------|--------|-------|
| Template cleanup | ✅ Done | 7 phases, ~47 files deleted (archived in `docs/_archive/`) |
| Session loader | ✅ Done | Async I/O, reads from `~/.local/share/opencode/storage` |
| API endpoint | ✅ Done | `GET /api/sessions` returns projects + sessions |
| Kanban UI | ✅ Empty | Ready for Phase 2 (shows default Backlog column) |
| Persistence | ❌ None | All state lost on refresh |
| ESLint | ✅ Done | Fixed in Phase 1 Cleanup |

**Next Action:** Start Phase 2 schema design.

**Documentation:**
- `docs/ROADMAP.md` - This file (master roadmap)
- `docs/ISSUES.md` - Technical debt tracker
- `docs/TECH.md` - Stack decisions
- `docs/SCHEMA.md` - To be created in Phase 2
