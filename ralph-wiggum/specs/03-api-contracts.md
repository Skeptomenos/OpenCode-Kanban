# Spec 3: API Contracts & Routes

> **Context:** Repository layer is tested and working.
> **Goal:** Expose data via type-safe Next.js API routes.
> **Time Estimate:** ~30 minutes

---

## 1. Zod Schemas

Create `OpenKanban/src/contract/pm/schemas.ts`:
- **CreateIssueSchema**: `type` (enum), `title`, `parentId` (optional), `metadata` (optional JSON).
- **UpdateIssueSchema**: Partial of create.
- **ConfigSchema**: Key/Value validation.

Create `OpenKanban/src/contract/pm/types.ts` exporting TypeScript types inferred from Zod schemas.

---

## 2. API Routes

Implement the following Route Handlers in `OpenKanban/src/app/api/`.
**Pattern**: Use the envelope format `{ success: true, data: ... }` or `{ success: false, error: ... }`.

### 2.1 Issues CRUD
- `GET /api/issues`: List issues. Support query params for filtering (type, parentId).
- `POST /api/issues`: Create issue. Validate body with `CreateIssueSchema`.
- `GET /api/issues/[id]`: Get single issue.
- `PATCH /api/issues/[id]`: Update issue.
- `DELETE /api/issues/[id]`: Delete issue.

### 2.2 Error Handling
- Wrap all db calls in try/catch.
- Return 400 for validation errors (Zod).
- Return 404 for not found.
- Return 500 for internal errors.

---

## 3. Verification
- Manual verification via `curl` or Thunder Client/Postman.
- **Create**: `POST /api/issues` -> 200 OK with ID.
- **List**: `GET /api/issues` -> 200 OK with array.
- **Get**: `GET /api/issues/[id]` -> 200 OK with object.
