# TECH.md

## 1. Stack & Architecture
- **Framework**: Next.js 14 (App Router).
- **Styling**: Tailwind CSS + Shadcn UI.
- **State**: Zustand (`src/features/kanban/utils/store.ts`).
- **Drag & Drop**: `@dnd-kit` (headless, accessible).

## 2. Data Flow (v1)
1.  **Source**: Local Filesystem (`~/.local/share/opencode/storage`).
2.  **Loader**: `src/lib/session-loader.ts` (Server-side).
3.  **API**: `GET /api/sessions` (Next.js Route Handler).
4.  **Store**: `useTaskStore` fetches on mount and populates Zustand.
5.  **UI**: `KanbanBoard` renders from Zustand store.

## 3. Key Constraints
- **Client Components**: Used for interactive parts (`KanbanBoard`, `Sidebar`).
- **Server Components**: Used for initial data fetching layout (`layout.tsx`).
- **Imports**: Avoid importing server-only modules (`fs`, `path`) into Client Components. Use API routes as the bridge.
