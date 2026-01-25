# Implementation Plan - Phase 2: PM Data Layer

> **Status**: Planning Complete  
> **Last Updated**: 2026-01-25  
> **Spec Source**: `ralph-wiggum/specs/01-foundation.md` through `04-boards-integration.md`

## Summary

Phase 2 implements the PM Data Layer for OpenKanban - adding SQLite persistence via Drizzle ORM, a repository pattern for CRUD operations, and API routes for Issues/Boards management.

**Current State**: Phase 1 Complete (application shell, session loading).  
**Target State**: Full persistence with SQLite, TDD-verified repository, API routes, and store integration.

---

## Tasks

| Status | Task | Spec Reference | Notes |
|--------|------|----------------|-------|
| [x] | **Task 1.1**: Install Drizzle ORM, better-sqlite3, and vitest dependencies | `specs/01-foundation.md:L11-17` | Done: drizzle-orm@0.45.1, better-sqlite3@12.6.2, vitest@4.0.18, drizzle-kit@0.31.8 |
| [x] | **Task 1.2**: Configure vitest for Next.js environment | `specs/01-foundation.md:L20` | Done: vitest.config.ts + vitest.setup.ts with jsdom, tsconfigPaths, React mocks |
| [x] | **Task 1.3**: Configure drizzle-kit and environment variables | `specs/01-foundation.md:L21-22` | Done: drizzle.config.ts, env.example.txt with DATABASE_PATH, data/ dir, src/lib/db/ dir |
| [x] | **Task 1.4**: Verify native module bundling with Next.js build | `specs/01-foundation.md:L79-80` | Done: npm run build passes with better-sqlite3 |
| [x] | **Task 2.1**: Create Drizzle schema for issues, issue_sessions, labels, issue_labels tables | `specs/01-foundation.md:L36-66`, `specs/SCHEMA.md:L52-127` | Done: src/lib/db/schema.ts with all 6 tables |
| [x] | **Task 2.2**: Add boards and config tables to Drizzle schema | `specs/04-boards-integration.md:L11-22`, `specs/SCHEMA.md:L144-177` | Done: boards, config tables included in schema.ts |
| [x] | **Task 2.3**: Run drizzle-kit push to create initial database | `specs/01-foundation.md:L81` | Done: data/kanban.db created with all tables |
| [x] | **Task 3.1**: Create database connection singleton with HMR support | `specs/01-foundation.md:L25-28` | Done: src/lib/db/connection.ts with globalThis pattern, FK enforcement, WAL mode |
| [x] | **Task 3.2**: Add auto-create database file logic and schema sync | `specs/phase2-plan.md:L230-235` | Done: initializeSchema() creates tables with CREATE IF NOT EXISTS on first connection |
| [x] | **Task 4.1**: Define IPMRepository interface with Issue CRUD methods | `specs/02-repository.md:L13-26`, `specs/SCHEMA.md:L209-226` | Done: src/lib/db/repository.ts with full interface + types |
| [ ] | **Task 4.2**: Write repository tests for Issue operations (TDD red phase) | `specs/02-repository.md:L35-44` | Create tests FIRST: create, hierarchy, cascade delete |
| [ ] | **Task 4.3**: Implement SqlitePMRepository Issue CRUD (TDD green phase) | `specs/02-repository.md:L46-48` | Make tests pass with Drizzle queries |
| [ ] | **Task 4.4**: Add Board CRUD to repository interface and implementation | `specs/04-boards-integration.md:L25-27`, `specs/phase2-plan.md:L280-285` | Extend repository with board operations |
| [ ] | **Task 4.5**: Write and implement Config get/set operations | `specs/02-repository.md:L23-24`, `specs/SCHEMA.md:L167-177` | Key-value store for extensible settings |
| [ ] | **Task 4.6**: Add session link/unlink operations to repository | `specs/phase2-plan.md:L275-277`, `specs/SCHEMA.md:L314-319` | Issue-session many-to-many linking |
| [ ] | **Task 5.1**: Create Zod schemas for Issue create/update/filter | `specs/03-api-contracts.md:L9-14`, `specs/SCHEMA.md:L209-226` | src/contract/pm/schemas.ts |
| [ ] | **Task 5.2**: Create Zod schemas for Board create/update | `specs/SCHEMA.md:L253-260` | Board input validation |
| [ ] | **Task 5.3**: Export inferred TypeScript types from Zod schemas | `specs/03-api-contracts.md:L16` | src/contract/pm/types.ts |
| [ ] | **Task 6.1**: Create Issues list and create API routes | `specs/03-api-contracts.md:L25-27`, `specs/SCHEMA.md:L296-302` | GET/POST /api/issues |
| [ ] | **Task 6.2**: Create Issue detail, update, delete API routes | `specs/03-api-contracts.md:L28-30` | GET/PATCH/DELETE /api/issues/[id] |
| [ ] | **Task 6.3**: Create Boards list and create API routes | `specs/04-boards-integration.md:L27`, `specs/SCHEMA.md:L304-312` | GET/POST /api/boards |
| [ ] | **Task 6.4**: Create Board detail, update, delete API routes | `specs/04-boards-integration.md:L27` | GET/PATCH/DELETE /api/boards/[id] - includes filtered issues |
| [ ] | **Task 6.5**: Add session link/unlink API endpoints | `specs/SCHEMA.md:L314-319` | POST/DELETE /api/issues/[id]/sessions |
| [ ] | **Task 7.1**: Connect store addTask to POST /api/issues | `specs/04-boards-integration.md:L36-37`, `specs/phase2-plan.md:L406-407` | Replace console.warn with fetch |
| [ ] | **Task 7.2**: Connect store column operations to PATCH /api/boards | `specs/04-boards-integration.md:L38` | addCol, updateCol, removeCol persist to board config |
| [ ] | **Task 7.3**: Connect store removeTask to DELETE /api/issues | `specs/phase2-plan.md:L410-411` | Complete task deletion persistence |
| [ ] | **Task 7.4**: Update kanban-board.tsx to fetch from API on mount | `specs/04-boards-integration.md:L41-43` | Initialize store from /api/boards/:id |
| [ ] | **Task 8.1**: Copy SCHEMA.md to docs directory | `specs/phase2-plan.md:L124-130` | OpenKanban/docs/SCHEMA.md |
| [ ] | **Task 8.2**: Update ROADMAP.md to mark Phase 2 complete | `specs/04-boards-integration.md:L48`, `specs/phase2-plan.md:L439-448` | Update status table |
| [ ] | **Task 8.3**: Update TECH.md with SQLite/Drizzle stack details | `specs/04-boards-integration.md:L49`, `specs/phase2-plan.md:L447` | Document database layer |

---

## Legend

- `[ ]` Pending
- `[x]` Complete  
- `[!]` Blocked

---

## Task Dependencies

```
Task 1.1-1.4 (Dependencies & Config)
    └── Task 2.1-2.3 (Schema)
        └── Task 3.1-3.2 (Connection)
            └── Task 4.1-4.6 (Repository TDD)
                └── Task 5.1-5.3 (Zod Schemas)
                    └── Task 6.1-6.5 (API Routes)
                        └── Task 7.1-7.4 (Store Integration)
                            └── Task 8.1-8.3 (Documentation)
```

---

## Key Patterns to Follow

### Existing Codebase Patterns (from explore agents)

1. **Zod Schema Pattern**: See `src/contract/opencode/schemas.ts` - composable primitives
2. **API Envelope Pattern**: See `src/app/api/sessions/route.ts` - `{ success: boolean, data?, error? }`
3. **Zustand Store Pattern**: See `src/features/kanban/utils/store.ts` - separate State/Actions types
4. **Repository Interface Pattern**: See `src/contract/opencode/repository.ts`

### New Patterns for Phase 2

1. **Drizzle Schema**: Define tables in `src/lib/db/schema.ts`
2. **Singleton Connection**: Use `globalThis` for HMR survival in dev
3. **TDD Flow**: Tests first in `src/lib/db/__tests__/repository.test.ts`
4. **In-Memory Testing**: Use `:memory:` SQLite for isolated tests

---

## Verification Commands

After each major task group:

```bash
cd OpenKanban
npm install        # After Task 1.1
npm run build      # After Tasks 1.4, 2.3, 3.2, 5.3, 6.5
npx vitest run     # After Tasks 4.3, 4.6
npm run dev        # After Task 7.4 - manual verification
```

---

## Success Criteria

- [ ] SQLite database file exists at `data/kanban.db`
- [ ] All repository tests pass (`npx vitest run`)
- [ ] All API routes return envelope format responses
- [ ] Data persists across browser refreshes
- [ ] No Phase 2 TODO comments remaining in store.ts
- [ ] `npm run build` passes with zero errors

---

## Files to Create/Modify

### New Files
- `OpenKanban/vitest.config.ts`
- `OpenKanban/drizzle.config.ts`
- `OpenKanban/src/lib/db/schema.ts`
- `OpenKanban/src/lib/db/connection.ts`
- `OpenKanban/src/lib/db/repository.ts`
- `OpenKanban/src/lib/db/__tests__/repository.test.ts`
- `OpenKanban/src/contract/pm/schemas.ts`
- `OpenKanban/src/contract/pm/types.ts`
- `OpenKanban/src/app/api/issues/route.ts`
- `OpenKanban/src/app/api/issues/[id]/route.ts`
- `OpenKanban/src/app/api/issues/[id]/sessions/route.ts`
- `OpenKanban/src/app/api/boards/route.ts`
- `OpenKanban/src/app/api/boards/[id]/route.ts`
- `OpenKanban/docs/SCHEMA.md`

### Modified Files
- `OpenKanban/package.json` (add dependencies)
- `OpenKanban/.env.example` (add DATABASE_PATH)
- `OpenKanban/src/features/kanban/utils/store.ts` (connect to API)
- `OpenKanban/src/features/kanban/components/kanban-board.tsx` (fetch on mount)
- `OpenKanban/docs/ROADMAP.md` (mark Phase 2 complete)
- `OpenKanban/docs/TECH.md` (add SQLite/Drizzle docs)
