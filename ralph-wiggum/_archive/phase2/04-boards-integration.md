# Spec 4: Boards & Integration

> **Context:** API is ready.
> **Goal:** Implement Boards and connect the frontend store.
> **Time Estimate:** ~30 minutes

---

## 1. Boards Schema & API

### 1.1 Schema Update
Update `src/lib/db/schema.ts` to include `boards`:
```typescript
export const boards = sqliteTable('boards', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  filters: text('filters').notNull(), // JSON
  columnConfig: text('column_config').notNull(), // JSON
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```
*Run `drizzle-kit push:sqlite` to apply changes.*

### 1.2 Repository & API
- Add `createBoard`, `getBoard`, `updateBoard`, `deleteBoard` to Repository.
- Create `/api/boards` and `/api/boards/[id]` routes.

---

## 2. Store Integration

Update `OpenKanban/src/features/kanban/utils/store.ts`.

### 2.1 API Client
- Replace `console.warn` TODOs with `fetch` calls to `/api/issues` and `/api/boards`.
- **addTask**: Call `POST /api/issues`. On success, update local state.
- **updateCol/addCol**: Update the current Board's `columnConfig` and call `PATCH /api/boards/[id]`.

### 2.2 Initialization
- Update `kanban-board.tsx`:
  - On mount, fetch the active board (or list boards and pick first).
  - Populate store with Board configuration and Issues.

---

## 3. Documentation
- Update `docs/ROADMAP.md` marking Phase 2 as complete.
- Update `docs/TECH.md` with SQLite/Drizzle details.

---

## 4. Final Verification
- Start app: `npm run dev`.
- Create a Board.
- Create Tasks.
- Move Tasks (verify persistence if `updateIssue` is called).
- Refresh page -> Data should persist.
