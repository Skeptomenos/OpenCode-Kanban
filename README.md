# OpenCode-Kanban

A local-first Kanban board for managing OpenCode sessions.

**Goal:** Build a hierarchical Project Management system that integrates seamlessly with OpenCode sessions.

## Features (Planned)
- **Structure**: Projects > Milestones > Epics > User Stories > Tasks.
- **Visualization**: Multiple Kanban boards per project.
- **Integration**: OpenCode sessions are treated as *evidence* or *implementation details* linked to Tasks.
- **Local-First**: All data lives in `~/.local/share/opencode/storage` or the project root.

## Architecture
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (local `kanban.db`)
- **ORM**: Drizzle
- **State**: Zustand

## Development

```bash
cd OpenKanban
npm install
npm run dev
```

See `OpenKanban/docs/ROADMAP.md` for detailed roadmap.
