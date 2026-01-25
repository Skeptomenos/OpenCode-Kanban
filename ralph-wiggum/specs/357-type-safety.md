# Spec 3.5.7: Type Safety Hardening

> **Context:** Post-implementation audit found several unsafe type casts that could lead to runtime errors.
> **Reference:** `OpenKanban/docs/phase3.5-issues2.md` (Category A)
> **Goal:** Eliminate unsafe casts and enforce runtime checks.
> **Time Estimate:** ~30 minutes

---

## 1. Repository Config Safety (Issue A.1)

### 1.1 Update Repository Interface
Update `src/lib/db/repository.ts`:
- Update `getConfig` signature to accept optional Zod schema.
- `getConfig<T>(key: string, schema?: z.ZodType<T>): T | undefined`

### 1.2 Implementation
- In `SqlitePMRepository.getConfig`:
- Parse JSON from DB.
- If `schema` is provided, use `schema.safeParse()`.
- Return validated data or `undefined` (log error if parse fails).

---

## 2. Singleton Type Safety (Issue A.2)

### 2.1 Documentation
Update `src/lib/db/connection.ts`:
- Add JSDoc to `globalWithDb` explaining the Next.js dev-mode singleton pattern necessity.

---

## 3. FormData Handling (Issue A.3)

### 3.1 Component Refactor
Update `src/features/projects/components/create-project-dialog.tsx`:
- Remove `as string` casts.
- Use type guards:
  ```typescript
  const nameVal = formData.get('name');
  if (typeof nameVal !== 'string') return; // or toast error
  ```

---

## 4. Dnd-Kit IDs (Issue A.4)

### 4.1 Kanban Board Refactor
Update `src/features/kanban/components/kanban-board.tsx`:
- Replace `as string` casts for `overId`.
- Use `String(overId)` or `active.id.toString()` to ensure safe conversion.

---

## 5. Form Context (Issue A.5)

### 5.1 Context Safety
Update `src/components/ui/form.tsx`:
- Change context type to `FormFieldContextValue | null`.
- Initialize with `null`.
- In hook `useFormField`, check for null and throw error if missing (fail fast).

---

## 6. Verification
- `npm run build` -> Must pass.
- Manual: Create project (verifies FormData).
- Manual: Drag task (verifies dnd-kit IDs).
