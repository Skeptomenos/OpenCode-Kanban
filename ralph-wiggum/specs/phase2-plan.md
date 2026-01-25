# Phase 2: The PM Data Layer

> **Goal:** Create the "brain" of OpenKanban - schema, storage-engine, and API routes.
> **Prerequisite:** Phase 1 complete (demo cleanup in progress via separate session)
> **Specification:** `.sisyphus/specs/SCHEMA.md` (authoritative data model reference)

---

## Context

### Original Request
Implement Phase 2 of the OpenKanban ROADMAP: Define schema for Issue/Project/Board, create storage-engine with SQLite/Drizzle, and create API routes.

### Interview Summary
**Key Discussions:**
- Hierarchy: 3-level (Project > Epic > Task), architected for unlimited nesting via `parentId`
- Issue Model: Single unified `Issue` type with `type` field + `metadata` bag
- Session Linking: Multiple sessions per issue, linkable at any level (planning + execution)
- Boards: Filtered views with custom column layouts (not containers)
- Statuses: Configurable, stored in database (initial: backlog, in_progress, done)
- Storage: SQLite with Drizzle ORM, TDD approach

**Research Findings:**
- Existing Zod schema pattern in `src/contract/opencode/schemas.ts`
- API envelope pattern in `src/app/api/sessions/route.ts`
- Zustand store with Phase 2 TODO markers in `src/features/kanban/utils/store.ts`
- Repository/Adapter pattern in `src/contract/opencode/adapter.ts`

### Metis Review
**Identified Gaps** (addressed):
- Schema migration strategy → Use `drizzle-kit push:sqlite` for dev, formal migrations later
- Session read-only constraint → Store session IDs only, lookup via existing adapter
- Board column source-of-truth → Board config defines columns, maps to statuses
- First-run partial state → Database valid without projects (empty state allowed)
- Metadata bag schema → Schemaless JSON for MVP, validated at application layer
- Orphaned children → Cascade delete (simplest for MVP)
- Drizzle/SQLite compatibility → Early spike task to validate native module

---

## Work Objectives

### Core Objective
Create the data persistence layer for OpenKanban with SQLite/Drizzle, enabling issues, boards, and sessions to be stored and retrieved via type-safe API routes.

### Concrete Deliverables
- `docs/SCHEMA.md` - Data model specification (copied from `.sisyphus/specs/SCHEMA.md`)
- `src/lib/db/schema.ts` - Drizzle schema definition
- `src/lib/db/connection.ts` - Singleton database connection
- `src/lib/db/repository.ts` - Storage-engine with CRUD operations
- `src/contract/pm/schemas.ts` - Zod schemas for API validation
- `src/app/api/issues/route.ts` - Issues CRUD API
- `src/app/api/boards/route.ts` - Boards CRUD API
- `OpenKanban/data/kanban.db` - SQLite database file

### Definition of Done
- [ ] `npm run build` passes with zero errors
- [ ] `npm run test` passes with all storage-engine tests green
- [ ] API routes return data in envelope format `{ success, data?, error? }`
- [ ] Database file created on first run at `OpenKanban/data/kanban.db`
- [ ] Zustand store TODO comments connected to storage-engine

### Must Have
- Single `Issue` type with `type` discriminator and `parentId` for hierarchy
- Multiple session links per issue
- Board as filtered view with custom column config
- Configurable statuses stored in database
- TDD: Tests written before implementation

### Must NOT Have (Guardrails)
- DO NOT add authentication/authorization (Phase 1 has no auth)
- DO NOT add soft-delete, audit logs, or versioning (not requested)
- DO NOT create GraphQL or REST alternatives (Next.js API routes only)
- DO NOT add real-time/WebSocket features (not in scope)
- DO NOT implement setup wizard UI (defer to Phase 3)
- DO NOT add caching layer (premature optimization)
- DO NOT modify existing OpenCode adapter (read-only data stays separate)
- DO NOT create CLI tools for database management

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (need to add vitest)
- **User wants tests**: TDD
- **Framework**: vitest (standard for modern Next.js)

### TDD Workflow
Each storage-engine function follows RED-GREEN-REFACTOR:
1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping green

### Test Setup Task
Task 0 will set up vitest with in-memory SQLite for isolated tests.

---

## Task Flow

```
Task 0 (Spec) → Task 1 (Setup) → Task 2 (Schema) → Task 3 (Connection) → Task 4 (Repository) → Task 5 (Zod) → Task 6 (API) → Task 7 (Integration) → Task 8 (Docs)
```

## Parallelization

| Task | Depends On | Reason |
|------|------------|--------|
| 0 | - | Independent: copies spec to docs |
| 1 | 0 | Independent: adds dependencies |
| 2 | 1 | Needs Drizzle installed |
| 3 | 2 | Needs schema to import |
| 4 | 3 | Needs connection for tests |
| 5 | 4 | Needs repository types |
| 6 | 5 | Needs Zod schemas |
| 7 | 6 | Needs API routes working |
| 8 | 7 | Documents final state |

---

## TODOs

- [ ] 0. Copy Schema Specification to docs/

  **What to do**:
  - Create `OpenKanban/docs/` directory if it doesn't exist
  - Copy `.sisyphus/specs/SCHEMA.md` to `OpenKanban/docs/SCHEMA.md`
  - This is the authoritative data model reference for implementation

  **Must NOT do**:
  - DO NOT modify the spec content
  - DO NOT create other docs yet (Task 8 handles ROADMAP update)

  **Parallelizable**: YES (with Task 1)

  **References**:
  - `.sisyphus/specs/SCHEMA.md` - Source specification

  **Acceptance Criteria**:
  - [ ] `OpenKanban/docs/SCHEMA.md` exists
  - [ ] Content matches `.sisyphus/specs/SCHEMA.md`
  - [ ] Manual: Read docs/SCHEMA.md → understand data model

  **Commit**: YES
  - Message: `docs: add Phase 2 schema specification`
  - Files: `docs/SCHEMA.md`
  - Pre-commit: N/A (docs only)

---

- [ ] 1. Setup Dependencies and Test Infrastructure

  **What to do**:
  - Add dependencies to `package.json`:
    - `drizzle-orm` (ORM)
    - `better-sqlite3` (SQLite driver)
    - `@types/better-sqlite3` (types)
    - `drizzle-kit` (dev, migrations)
    - `vitest` (dev, testing)
  - Create `vitest.config.ts` for Next.js compatibility
  - Create example test to verify setup
  - Run `npm run build` to validate native module bundling works

  **Must NOT do**:
  - DO NOT configure complex test utilities yet
  - DO NOT add test coverage requirements

  **Parallelizable**: NO (first task)

  **References**:
  - `OpenKanban/package.json` - Add dependencies here
  - `OpenKanban/tsconfig.json` - May need path alias updates
  - Drizzle docs: https://orm.drizzle.team/docs/get-started-sqlite

  **Acceptance Criteria**:
  - [ ] `npm install` completes without errors
  - [ ] `npm run build` passes (native module bundling works)
  - [ ] `npx vitest run` executes example test
  - [ ] Manual: Import `better-sqlite3` in a test file → no errors

  **Commit**: YES
  - Message: `build: add Drizzle, SQLite, and vitest dependencies`
  - Files: `package.json`, `package-lock.json`, `vitest.config.ts`
  - Pre-commit: `npm run build`

---

- [ ] 2. Define Drizzle Schema

  **What to do**:
  - Create `src/lib/db/schema.ts` with Drizzle table definitions:
    - `issues` table (id, type, parentId, title, description, status, metadata, timestamps)
    - `issue_sessions` join table (issueId, sessionId, linkType, createdAt)
    - `labels` table (id, name, color)
    - `issue_labels` join table (issueId, labelId)
    - `boards` table (id, name, filters JSON, columnConfig JSON, timestamps)
    - `config` key-value table for extensible settings
  - Create `drizzle.config.ts` for drizzle-kit
  - Run `drizzle-kit push:sqlite` to create initial schema

  **Must NOT do**:
  - DO NOT add indexes (premature optimization)
  - DO NOT add triggers or constraints beyond FKs
  - DO NOT create views

  **Parallelizable**: NO (depends on 1)

  **References**:
  - Spec: `docs/SCHEMA.md` (authoritative SQL and TypeScript definitions)
  - Pattern: `src/contract/opencode/schemas.ts` (Zod schema style to mirror)
  - Drizzle SQLite: https://orm.drizzle.team/docs/sql-schema-declaration

  **Acceptance Criteria**:
  - [ ] Schema file exports all table definitions
  - [ ] `drizzle-kit push:sqlite` creates `data/kanban.db`
  - [ ] Self-referencing `parentId` on issues works
  - [ ] Manual: Open `data/kanban.db` with SQLite CLI → tables exist

  **Commit**: YES
  - Message: `feat(db): add Drizzle schema for PM data layer`
  - Files: `src/lib/db/schema.ts`, `drizzle.config.ts`
  - Pre-commit: `npm run build`

---

- [ ] 3. Create Database Connection Singleton

  **What to do**:
  - Create `src/lib/db/connection.ts` with:
    - Singleton pattern to survive HMR
    - Drizzle instance wrapping better-sqlite3
    - Auto-create database file if not exists
    - Auto-run migrations/schema sync on first connection
  - Add environment variable `DATABASE_PATH` with default to `./data/kanban.db`
  - Create `.env.example` with database path

  **Must NOT do**:
  - DO NOT add connection pooling (SQLite doesn't need it)
  - DO NOT add retry logic
  - DO NOT expose raw SQLite connection

  **Parallelizable**: NO (depends on 2)

  **References**:
  - Pattern: https://orm.drizzle.team/docs/connect-better-sqlite3
  - HMR pattern: Use `globalThis` to store singleton in dev

  **Acceptance Criteria**:
  - [ ] Import `db` from connection → same instance across files
  - [ ] First import creates `data/kanban.db` if missing
  - [ ] HMR: Save file → no "database locked" errors
  - [ ] Manual: `console.log(db.all(issues))` → empty array

  **Commit**: YES
  - Message: `feat(db): add singleton database connection`
  - Files: `src/lib/db/connection.ts`, `.env.example`
  - Pre-commit: `npm run build`

---

- [ ] 4. Create Storage-Engine Repository (TDD)

  **What to do**:
  - Create `src/lib/db/repository.ts` with interface + implementation:
    ```typescript
    interface IPMRepository {
      // Issues
      createIssue(data: CreateIssueInput): Issue;
      getIssue(id: string): Issue | null;
      listIssues(filter?: IssueFilter): Issue[];
      updateIssue(id: string, data: UpdateIssueInput): Issue;
      deleteIssue(id: string): void;
      
      // Issue-Session Links
      linkSession(issueId: string, sessionId: string, type?: string): void;
      unlinkSession(issueId: string, sessionId: string): void;
      
      // Boards
      createBoard(data: CreateBoardInput): Board;
      getBoard(id: string): Board | null;
      listBoards(): Board[];
      updateBoard(id: string, data: UpdateBoardInput): Board;
      deleteBoard(id: string): void;
      
      // Config
      getConfig(key: string): unknown;
      setConfig(key: string, value: unknown): void;
    }
    ```
  - Create `src/lib/db/__tests__/repository.test.ts` with tests FIRST
  - Use in-memory SQLite for tests (`:memory:`)
  - Implement each function to make tests pass

  **Must NOT do**:
  - DO NOT add pagination yet (MVP)
  - DO NOT add sorting options (MVP)
  - DO NOT add transactions (overkill for single-user)

  **Parallelizable**: NO (depends on 3)

  **References**:
  - Pattern: `src/contract/opencode/adapter.ts` (repository interface style)
  - Spec: `docs/SCHEMA.md` (TypeScript types and interface definitions)
  - Test pattern: Standard vitest with beforeEach setup

  **Acceptance Criteria**:
  - [ ] All repository functions have tests
  - [ ] `npm run test` → all tests pass
  - [ ] CRUD operations verified for issues, boards, config
  - [ ] Session linking creates join table entries
  - [ ] Delete issue cascades to children and links

  **Commit**: YES
  - Message: `feat(db): add storage-engine repository with TDD`
  - Files: `src/lib/db/repository.ts`, `src/lib/db/__tests__/repository.test.ts`
  - Pre-commit: `npm run test && npm run build`

---

- [ ] 5. Create Zod Schemas for API Validation

  **What to do**:
  - Create `src/contract/pm/schemas.ts` with Zod schemas:
    - `CreateIssueSchema`, `UpdateIssueSchema`
    - `CreateBoardSchema`, `UpdateBoardSchema`
    - `IssueFilterSchema`, `BoardFilterSchema`
    - `ConfigSchema`
  - Create `src/contract/pm/types.ts` with inferred TypeScript types
  - Ensure schemas match Drizzle table structures

  **Must NOT do**:
  - DO NOT add custom error messages (default Zod messages OK)
  - DO NOT add transform functions (keep simple)

  **Parallelizable**: NO (depends on 4 for type alignment)

  **References**:
  - Pattern: `src/contract/opencode/schemas.ts:5-22` (composable primitives)
  - Pattern: `src/contract/opencode/types.ts` (inferred types)
  - Spec: `docs/SCHEMA.md` (TypeScript types to validate against)

  **Acceptance Criteria**:
  - [ ] All input schemas validate correctly
  - [ ] Types inferred match repository interface
  - [ ] Manual: `CreateIssueSchema.parse({...})` → valid/throws as expected

  **Commit**: YES
  - Message: `feat(contract): add PM data layer Zod schemas`
  - Files: `src/contract/pm/schemas.ts`, `src/contract/pm/types.ts`
  - Pre-commit: `npm run build`

---

- [ ] 6. Create API Routes

  **What to do**:
  - Create `src/app/api/issues/route.ts`:
    - GET: List issues with optional filters
    - POST: Create new issue
  - Create `src/app/api/issues/[id]/route.ts`:
    - GET: Get single issue with sessions/labels
    - PATCH: Update issue
    - DELETE: Delete issue (cascade)
  - Create `src/app/api/boards/route.ts`:
    - GET: List boards
    - POST: Create board
  - Create `src/app/api/boards/[id]/route.ts`:
    - GET: Get board with filtered issues
    - PATCH: Update board
    - DELETE: Delete board
  - All routes use envelope format: `{ success: boolean, data?, error? }`
  - All routes validate input with Zod schemas

  **Must NOT do**:
  - DO NOT add rate limiting
  - DO NOT add request logging
  - DO NOT add CORS headers (same-origin only)

  **Parallelizable**: NO (depends on 5)

  **References**:
  - Pattern: `src/app/api/sessions/route.ts` (envelope format)
  - Next.js API: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  - Spec: `docs/SCHEMA.md` (API contracts section)

  **Acceptance Criteria**:
  - [ ] `GET /api/issues` returns `{ success: true, data: [] }`
  - [ ] `POST /api/issues` creates issue and returns it
  - [ ] `GET /api/boards/:id` returns board with filtered issues
  - [ ] Invalid input returns `{ success: false, error: { message } }`
  - [ ] Manual: Use browser dev tools or curl to test each endpoint

  **Commit**: YES
  - Message: `feat(api): add Issues and Boards CRUD routes`
  - Files: `src/app/api/issues/*`, `src/app/api/boards/*`
  - Pre-commit: `npm run build`

---

- [ ] 7. Connect Zustand Store to Storage-Engine

  **What to do**:
  - Update `src/features/kanban/utils/store.ts`:
    - Replace TODO comments with actual API calls
    - `addTask` → `POST /api/issues`
    - `addCol` → Update board column config
    - `updateCol` → Update board column config
    - `removeCol` → Update board column config
    - `removeTask` → `DELETE /api/issues/:id`
  - Update `kanban-board.tsx` to fetch from `/api/boards/:id` on mount
  - Add loading states for API operations

  **Must NOT do**:
  - DO NOT add optimistic updates (keep simple)
  - DO NOT add retry logic
  - DO NOT add offline support

  **Parallelizable**: NO (depends on 6)

  **References**:
  - `src/features/kanban/utils/store.ts:45-95` - TODO markers
  - `src/features/kanban/components/kanban-board.tsx:46-56` - useEffect to update

  **Acceptance Criteria**:
  - [ ] Create task → persists to database → survives refresh
  - [ ] Delete task → removes from database
  - [ ] Column changes → persists to board config
  - [ ] Manual: Create task, refresh page → task still there

  **Commit**: YES
  - Message: `feat(kanban): connect store to storage-engine`
  - Files: `src/features/kanban/utils/store.ts`, `src/features/kanban/components/kanban-board.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 8. Update Documentation

  **What to do**:
  - Update `docs/ROADMAP.md`:
    - Mark Phase 2 tasks as complete
    - Update status table
  - Verify `docs/SCHEMA.md` is complete (created in Task 0)
  - Update `docs/TECH.md`:
    - Add SQLite/Drizzle to stack
    - Update data flow diagram

  **Must NOT do**:
  - DO NOT create API documentation beyond SCHEMA.md
  - DO NOT add changelog

  **Parallelizable**: NO (final task, depends on 7)

  **References**:
  - `docs/ROADMAP.md` - Update Phase 2 section
  - `docs/SCHEMA.md` - Already created in Task 0, verify completeness

  **Acceptance Criteria**:
  - [ ] ROADMAP.md shows Phase 2 complete
  - [ ] SCHEMA.md documents all tables and API routes
  - [ ] Manual: Read docs → understand system without code

  **Commit**: YES
  - Message: `docs: update ROADMAP and TECH for Phase 2 completion`
  - Files: `docs/ROADMAP.md`, `docs/TECH.md`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `docs: add Phase 2 schema specification` | docs/SCHEMA.md | N/A |
| 1 | `build: add Drizzle, SQLite, and vitest dependencies` | package.json, vitest.config.ts | `npm run build` |
| 2 | `feat(db): add Drizzle schema for PM data layer` | schema.ts, drizzle.config.ts | `npm run build` |
| 3 | `feat(db): add singleton database connection` | connection.ts, .env.example | `npm run build` |
| 4 | `feat(db): add storage-engine repository with TDD` | repository.ts, tests | `npm run test` |
| 5 | `feat(contract): add PM data layer Zod schemas` | schemas.ts, types.ts | `npm run build` |
| 6 | `feat(api): add Issues and Boards CRUD routes` | api routes | `npm run build` |
| 7 | `feat(kanban): connect store to storage-engine` | store.ts, board.tsx | `npm run build` |
| 8 | `docs: update ROADMAP and TECH for Phase 2 completion` | docs/ | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
cd OpenKanban
npm run build      # Expected: Build succeeds
npm run test       # Expected: All tests pass
npm run dev        # Expected: App runs, API works
```

### Final Checklist
- [ ] SQLite database file exists at `data/kanban.db`
- [ ] All CRUD operations work via API
- [ ] Data persists across browser refreshes
- [ ] TDD: All repository functions have tests
- [ ] Documentation complete in `docs/SCHEMA.md`
- [ ] No Phase 2 TODO comments remaining in code
