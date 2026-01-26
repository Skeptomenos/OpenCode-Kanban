# OpenKanban

A local-first Kanban board for managing OpenCode sessions.

## Overview

OpenKanban is a hierarchical project management system that integrates seamlessly with OpenCode sessions. Built for developers who want to organize their AI-assisted coding work.

## Features

- **Hierarchical Structure**: Projects > Tasks with flexible relationships
- **Kanban Boards**: Drag-and-drop task management with customizable columns
- **Session Integration**: Link OpenCode sessions as evidence/implementation details
- **Local-First**: All data stored locally in SQLite (`~/.local/share/opencode/storage`)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Database**: SQLite (local `kanban.db`)
- **ORM**: [Drizzle](https://orm.drizzle.team)
- **State**: [Zustand](https://zustand-demo.pmnd.rs)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **Components**: [Shadcn UI](https://ui.shadcn.com)
- **Drag & Drop**: [dnd-kit](https://dndkit.com)
- **Validation**: [Zod](https://zod.dev)

## Getting Started

```bash
cd OpenKanban
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start managing your projects.

## Documentation

- **[ROADMAP](./docs/ROADMAP.md)**: Project phases and milestones
- **[TECH](./docs/TECH.md)**: Technical decisions and architecture
- **[QUALITY](./docs/QUALITY.md)**: Quality standards and protocols
- **[CONTRACT](./docs/CONTRACT.md)**: OpenCode data contract

## Development

```bash
pnpm run dev      # Start development server
pnpm run build    # Production build
pnpm run lint     # Run ESLint
```
