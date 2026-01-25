# OpenKanban Data Schema Specification

> **Version:** 1.0  
> **Status:** Approved (Momus reviewed)  
> **Last Updated:** 2026-01-25

This document defines the data model for OpenKanban's PM Data Layer. It serves as the authoritative reference for database schema, TypeScript types, and API contracts.

---

## 1. Design Principles

### 1.1 Single Issue Type with Nesting
All work items (Projects, Epics, Tasks) are stored as a single `Issue` type with a `type` discriminator. Hierarchy is achieved via `parentId` references, enabling unlimited nesting depth.

### 1.2 Boards as Filtered Views
Boards do not "contain" issues. A Board is a saved filter query with custom column configuration. Issues can appear on multiple boards simultaneously.

### 1.3 Sessions as Evidence
OpenCode sessions are linked to issues as external references. Session data remains read-only in `~/.local/share/opencode/storage/`. Only session IDs are stored in the PM database.

### 1.4 Configurable Statuses
Statuses are not hardcoded. They are stored in a config table and can be extended per-project.

---

## 2. Database Schema (SQLite + Drizzle)

### 2.1 Issues Table

The core entity representing all work items.

```sql
CREATE TABLE issues (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,                    -- 'project' | 'epic' | 'task' | extensible
  parent_id     TEXT REFERENCES issues(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'backlog',  -- References config.statuses
  metadata      TEXT,                             -- JSON blob for type-specific data
  created_at    INTEGER NOT NULL,                 -- Unix timestamp (ms)
  updated_at    INTEGER NOT NULL                  -- Unix timestamp (ms)
);

-- Index for hierarchy queries
CREATE INDEX idx_issues_parent ON issues(parent_id);
CREATE INDEX idx_issues_type ON issues(type);
CREATE INDEX idx_issues_status ON issues(status);
```

**Drizzle Schema:**
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  parentId: text('parent_id').references(() => issues.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'),
  metadata: text('metadata'),  // JSON string
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

### 2.2 Issue-Session Links Table

Many-to-many relationship between issues and OpenCode sessions.

```sql
CREATE TABLE issue_sessions (
  issue_id    TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,          -- OpenCode session ID (external reference)
  link_type   TEXT,                   -- 'planning' | 'execution' | null
  created_at  INTEGER NOT NULL,
  PRIMARY KEY (issue_id, session_id)
);
```

**Drizzle Schema:**
```typescript
export const issueSessions = sqliteTable('issue_sessions', {
  issueId: text('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  linkType: text('link_type'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.issueId, table.sessionId] }),
}));
```

### 2.3 Labels Table

Simple tagging system for issues.

```sql
CREATE TABLE labels (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  color  TEXT           -- Hex color code (e.g., '#FF5733')
);

CREATE TABLE issue_labels (
  issue_id  TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  label_id  TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, label_id)
);
```

**Drizzle Schema:**
```typescript
export const labels = sqliteTable('labels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
});

export const issueLabels = sqliteTable('issue_labels', {
  issueId: text('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  labelId: text('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.issueId, table.labelId] }),
}));
```

### 2.4 Boards Table

Saved filter views with custom column layouts.

```sql
CREATE TABLE boards (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  filters       TEXT NOT NULL,        -- JSON: BoardFilters
  column_config TEXT NOT NULL,        -- JSON: ColumnConfig[]
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
```

**Drizzle Schema:**
```typescript
export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filters: text('filters').notNull(),        // JSON string
  columnConfig: text('column_config').notNull(),  // JSON string
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

### 2.5 Config Table

Key-value store for extensible settings.

```sql
CREATE TABLE config (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL    -- JSON
);
```

**Initial Config Entries:**
```json
{
  "issue_types": ["project", "epic", "task"],
  "statuses": [
    { "id": "backlog", "name": "Backlog", "category": "todo" },
    { "id": "in_progress", "name": "In Progress", "category": "in_progress" },
    { "id": "done", "name": "Done", "category": "done" }
  ]
}
```

---

## 3. TypeScript Types

### 3.1 Core Issue Type

```typescript
export type Issue = {
  id: string;
  type: string;                      // 'project' | 'epic' | 'task' | extensible
  parentId: string | null;
  title: string;
  description?: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: number;                 // Unix timestamp (ms)
  updatedAt: number;
};

// With relations (for API responses)
export type IssueWithRelations = Issue & {
  sessionIds: string[];
  labelIds: string[];
  children?: Issue[];
};
```

### 3.2 Issue Input Types

```typescript
export type CreateIssueInput = {
  type: string;
  parentId?: string;
  title: string;
  description?: string;
  status?: string;                   // Defaults to 'backlog'
  metadata?: Record<string, unknown>;
};

export type UpdateIssueInput = Partial<Omit<CreateIssueInput, 'type'>>;

export type IssueFilter = {
  types?: string[];
  statuses?: string[];
  parentId?: string | null;          // null = root issues only
  labelIds?: string[];
};
```

### 3.3 Board Types

```typescript
export type Board = {
  id: string;
  name: string;
  filters: BoardFilters;
  columnConfig: ColumnConfig[];
  createdAt: number;
  updatedAt: number;
};

export type BoardFilters = {
  types?: string[];
  statuses?: string[];
  parentId?: string;
  labelIds?: string[];
};

export type ColumnConfig = {
  id: string;
  title: string;
  statusMappings: string[];          // Which statuses appear in this column
};

export type CreateBoardInput = {
  name: string;
  filters?: BoardFilters;
  columnConfig?: ColumnConfig[];
};

export type UpdateBoardInput = Partial<CreateBoardInput>;
```

### 3.4 Config Types

```typescript
export type IssueTypeConfig = {
  id: string;
  name: string;
  icon?: string;
  allowedParentTypes?: string[];     // e.g., 'epic' can only be under 'project'
};

export type StatusConfig = {
  id: string;
  name: string;
  category: 'todo' | 'in_progress' | 'done';
  color?: string;
};
```

---

## 4. API Contracts

### 4.1 Response Envelope

All API responses use this format:

```typescript
type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: { message: string; code?: string } };
```

### 4.2 Issues API

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/issues` | Query: `?type=&status=&parentId=` | `APIResponse<IssueWithRelations[]>` |
| GET | `/api/issues/:id` | - | `APIResponse<IssueWithRelations>` |
| POST | `/api/issues` | `CreateIssueInput` | `APIResponse<Issue>` |
| PATCH | `/api/issues/:id` | `UpdateIssueInput` | `APIResponse<Issue>` |
| DELETE | `/api/issues/:id` | - | `APIResponse<{ deleted: true }>` |

### 4.3 Boards API

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| GET | `/api/boards` | - | `APIResponse<Board[]>` |
| GET | `/api/boards/:id` | - | `APIResponse<Board & { issues: IssueWithRelations[] }>` |
| POST | `/api/boards` | `CreateBoardInput` | `APIResponse<Board>` |
| PATCH | `/api/boards/:id` | `UpdateBoardInput` | `APIResponse<Board>` |
| DELETE | `/api/boards/:id` | - | `APIResponse<{ deleted: true }>` |

### 4.4 Session Links API

| Method | Endpoint | Request Body | Response |
|--------|----------|--------------|----------|
| POST | `/api/issues/:id/sessions` | `{ sessionId: string, linkType?: string }` | `APIResponse<{ linked: true }>` |
| DELETE | `/api/issues/:id/sessions/:sessionId` | - | `APIResponse<{ unlinked: true }>` |

---

## 5. Hierarchy Rules

### 5.1 Default Type Hierarchy

| Type | Allowed Parents | Can Have Children |
|------|-----------------|-------------------|
| `project` | None (root only) | Yes |
| `epic` | `project` | Yes |
| `task` | `epic`, `task` | Yes (subtasks) |

### 5.2 Enforcement

Hierarchy rules are enforced at the **application layer**, not the database. This allows flexibility for custom hierarchies while providing sensible defaults.

### 5.3 Cascade Behavior

- Deleting a parent issue **cascades** to all children
- Deleting an issue removes all session links and label associations
- Deleting a label removes all issue-label associations

---

## 6. Metadata Schemas (Optional)

Type-specific metadata is stored as JSON. These are recommended schemas (not enforced in MVP):

### 6.1 Project Metadata
```typescript
{
  icon?: string;           // Emoji or icon name
  color?: string;          // Brand color
  archived?: boolean;
}
```

### 6.2 Epic Metadata
```typescript
{
  priority?: 'low' | 'medium' | 'high';
  targetDate?: number;     // Unix timestamp
}
```

### 6.3 Task Metadata
```typescript
{
  storyPoints?: number;
  assignee?: string;
  dueDate?: number;        // Unix timestamp
}
```

---

## 7. File Locations

| File | Purpose |
|------|---------|
| `OpenKanban/data/kanban.db` | SQLite database file |
| `src/lib/db/schema.ts` | Drizzle schema definitions |
| `src/lib/db/connection.ts` | Database singleton |
| `src/lib/db/repository.ts` | CRUD operations |
| `src/contract/pm/schemas.ts` | Zod validation schemas |
| `src/contract/pm/types.ts` | TypeScript type exports |

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-25 | Initial schema design |
