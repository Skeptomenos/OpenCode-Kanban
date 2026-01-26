# Spec 3.6.2: Error Handling & Observability

> **Context:** Improving system reliability and debugging visibility.
> **Reference:** `OpenKanban/docs/phase3.5-issues3.md` (Categories B, C)
> **Goal:** Robust error logging and query handling.
> **Time Estimate:** ~30 minutes

---

## 1. Request Logging (Issue B.2)

### 1.1 Middleware or Helper
Since Next.js App Router doesn't have global middleware for this easily inside routes, update `src/app/api/issues/route.ts` and others:
- In `POST/PUT/PATCH`, when `request.json()` fails:
  - Log error with `logger.warn`.
  - Include IP/User agent if available (optional).

---

## 2. Unsafe Repository Fallback (Issue B.3)

### 2.1 Update getConfig
Location: `src/lib/db/repository.ts`
- Remove the `as T` cast when no schema is provided.
- Return `unknown` by default, or require schema for typed access.
- **Decision**: Change signature to `getConfig(key: string): unknown` and `getConfig<T>(key: string, schema: ZodSchema<T>): T`.

---

## 3. Query Client Config (Issue C.1)

### 3.1 Global Error Handling
Location: `src/lib/query-client.ts`
- Add `throwOnError` to default options.
- Condition: Throw if error status >= 500 (server errors). Client errors (4xx) should be handled in UI.

---

## 4. Verification
- `npm run test` -> Repository tests should pass.
- Manual: Trigger 500 error -> Error boundary catches it.
