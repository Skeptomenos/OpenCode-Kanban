# Spec 1: Foundation & Base Schema

> **Context:** Phase 2 of OpenKanban (PM Data Layer).
> **Goal:** Set up the database infrastructure and define the core schema.
> **Time Estimate:** ~30 minutes

---

## 1. Dependencies & Infrastructure

### 1.1 Package Dependencies
Add the following to `OpenKanban/package.json`:
- `drizzle-orm` (ORM)
- `better-sqlite3` (SQLite driver)
- `@types/better-sqlite3` (Dev dep)
- `drizzle-kit` (Dev dep)
- `vitest` (Dev dep - for TDD in next steps)

### 1.2 Configuration
- Create `OpenKanban/vitest.config.ts` configured for Next.js environment.
- Create `OpenKanban/drizzle.config.ts` pointing to `src/lib/db/schema.ts` and `data/kanban.db`.
- Update `.env.example` with `DATABASE_PATH=./data/kanban.db`.

### 1.3 Database Connection
Create `OpenKanban/src/lib/db/connection.ts`:
- Implement a singleton pattern for the database connection (to survive HMR in dev).
- Initialize `better-sqlite3` with the path from env (default to `./data/kanban.db`).
- Export the `drizzle` instance.

---

## 2. Drizzle Schema Definition

Create `OpenKanban/src/lib/db/schema.ts` implementing the following tables.

### 2.1 Issues Table
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'project' | 'epic' | 'task'
  parentId: text('parent_id'), // Self-reference manually handled in logic/foreign keys
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('backlog'),
  metadata: text('metadata'), // JSON string
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```
*Note: Add self-reference foreign key if Drizzle SQLite supports it cleanly, otherwise manage via logic.*

### 2.2 Issue-Session Links
```typescript
import { primaryKey } from 'drizzle-orm/sqlite-core';

export const issueSessions = sqliteTable('issue_sessions', {
  issueId: text('issue_id').notNull().references(() => issues.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(), // External OpenCode ID
  linkType: text('link_type'),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.issueId, table.sessionId] }),
}));
```

### 2.3 Config Table
```typescript
export const config = sqliteTable('config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON
});
```

---

## 3. Verification
- Run `npm install`.
- Run `npm run build` to ensure native modules (`better-sqlite3`) bundle correctly with Next.js.
- Run `npx drizzle-kit push:sqlite` to generate the initial `data/kanban.db` file.
- Verify the database file exists.
