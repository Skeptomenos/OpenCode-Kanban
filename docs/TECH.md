# TECH.md

## 1. Stack & Architecture

- **Framework**: Next.js 16 (App Router).
- **Language**: TypeScript (strict mode).
- **Styling**: Tailwind CSS v4 + Shadcn UI.
- **State**: Zustand (`src/features/kanban/utils/store.ts`).
- **Drag & Drop**: `@dnd-kit` (headless, accessible).
- **Database**: SQLite with Drizzle ORM.
- **Validation**: Zod schemas for API contracts.
- **Testing**: Vitest (TDD workflow).

---

## 2. Database Layer (Phase 2)

### 2.1 Technology Stack

| Component | Package | Version |
|-----------|---------|---------|
| Database | SQLite | embedded via better-sqlite3 |
| ORM | drizzle-orm | 0.45.1 |
| Driver | better-sqlite3 | 12.6.2 |
| Migrations | drizzle-kit | 0.31.8 |

### 2.2 Database Location

```
OpenKanban/data/kanban.db  # SQLite file
```

Configurable via `DATABASE_PATH` environment variable (defaults to `./data/kanban.db`).

### 2.3 Connection Pattern

The database uses a singleton pattern to survive Next.js HMR (Hot Module Replacement):

```typescript
// src/lib/db/connection.ts
const globalWithDb = globalThis as GlobalWithDb;

if (globalWithDb.__kanbanDb) {
  return globalWithDb.__kanbanDb;  // Reuse in dev
}
```

**Key Features:**
- Auto-creates database file and directory on first run.
- Enables foreign key enforcement (`PRAGMA foreign_keys = ON`).
- Uses WAL mode for concurrent read/write (`PRAGMA journal_mode = WAL`).
- Creates schema tables via `CREATE TABLE IF NOT EXISTS` (no migration files needed for MVP).

### 2.4 Schema Tables

| Table | Purpose |
|-------|---------|
| `issues` | All work items (projects, epics, tasks) with hierarchy via `parent_id` |
| `issue_sessions` | Links issues to OpenCode session IDs |
| `labels` | Tagging system (name + color) |
| `issue_labels` | Many-to-many issue ↔ label mapping |
| `boards` | Saved filter views with column configuration |
| `config` | Key-value store for extensible settings |

See `OpenKanban/docs/SCHEMA.md` for complete schema documentation.

### 2.5 Repository Pattern

All database operations go through `SqlitePMRepository`:

```typescript
// src/lib/db/repository.ts
interface IPMRepository {
  // Issues
  createIssue(data: CreateIssueInput): Issue;
  getIssue(id: string): Issue | null;
  listIssues(filter?: IssueFilter): Issue[];
  updateIssue(id: string, data: UpdateIssueInput): Issue;
  deleteIssue(id: string): void;  // Cascades to children
  
  // Sessions
  linkSession(issueId: string, sessionId: string, type?: string): void;
  unlinkSession(issueId: string, sessionId: string): void;
  getSessionLinks(issueId: string): IssueSession[];
  
  // Boards
  createBoard(data: CreateBoardInput): Board;
  getBoard(id: string): Board | null;
  listBoards(): Board[];
  updateBoard(id: string, data: UpdateBoardInput): Board;
  deleteBoard(id: string): void;
  
  // Config
  getConfig(key: string): unknown;
  setConfig(key: string, value: unknown): void;
  deleteConfig(key: string): void;
}
```

---

## 3. Data Flow

### 3.1 PM Data (Issues, Boards)

```
UI Component
    ↓ fetch()
API Route (/api/issues, /api/boards)
    ↓ Zod validation
Repository (SqlitePMRepository)
    ↓ Drizzle ORM
SQLite (data/kanban.db)
```

### 3.2 Session Data (Read-Only)

```
~/.local/share/opencode/storage/
    ↓ fs.readdir/readFile
session-loader.ts
    ↓
API Route (/api/sessions)
    ↓
UI Component
```

Session data remains **read-only**. The PM layer stores only session IDs for linking.

---

## 4. API Routes

All routes use the envelope format:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { message: string, code?: string } }
```

### 4.1 Issues API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/issues` | List issues (filterable by type, status, parentId) |
| POST | `/api/issues` | Create issue |
| GET | `/api/issues/[id]` | Get single issue with session links |
| PATCH | `/api/issues/[id]` | Update issue |
| DELETE | `/api/issues/[id]` | Delete issue (cascades to children) |

### 4.2 Boards API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/boards` | List all boards |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/[id]` | Get board with filtered issues |
| PATCH | `/api/boards/[id]` | Update board (name, filters, columnConfig) |
| DELETE | `/api/boards/[id]` | Delete board |

### 4.3 Session Links API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/issues/[id]/sessions` | Get linked session IDs |
| POST | `/api/issues/[id]/sessions` | Link a session to issue |
| DELETE | `/api/issues/[id]/sessions/[sessionId]` | Unlink session |

---

## 5. Key Constraints

- **Client Components**: Used for interactive parts (`KanbanBoard`, `Sidebar`).
- **Server Components**: Used for initial data fetching layout (`layout.tsx`).
- **Imports**: Never import server-only modules (`fs`, `path`, `better-sqlite3`) into Client Components. Use API routes as the bridge.
- **Native Modules**: `better-sqlite3` requires Node.js runtime. Next.js config excludes it from webpack bundling.
- **Single User**: SQLite is designed for single-user local access. No connection pooling needed.

---

## 6. Testing

### 6.1 Test Framework

- **Runner**: Vitest 4.0.18
- **Environment**: jsdom (for React components)
- **Coverage**: Repository layer has 42 tests

### 6.2 Database Testing

Tests use in-memory SQLite (`:memory:`) for isolation:

```typescript
// Each test gets a fresh database
beforeEach(() => {
  const sqlite = new Database(':memory:');
  // Initialize schema...
  repo = new SqlitePMRepository(db);
});
```

### 6.3 Running Tests

```bash
cd OpenKanban
npx vitest run                    # Run all tests
npx vitest run --coverage         # With coverage
npx vitest watch                  # Watch mode
```

---

## 7. File Locations

| Purpose | Path |
|---------|------|
| Database file | `OpenKanban/data/kanban.db` |
| Drizzle schema | `OpenKanban/src/lib/db/schema.ts` |
| DB connection | `OpenKanban/src/lib/db/connection.ts` |
| Repository | `OpenKanban/src/lib/db/repository.ts` |
| Repository tests | `OpenKanban/src/lib/db/__tests__/repository.test.ts` |
| Zod schemas | `OpenKanban/src/contract/pm/schemas.ts` |
| PM types | `OpenKanban/src/contract/pm/types.ts` |
| API routes | `OpenKanban/src/app/api/issues/`, `OpenKanban/src/app/api/boards/` |
| Drizzle config | `OpenKanban/drizzle.config.ts` |
| Vitest config | `OpenKanban/vitest.config.ts` |
