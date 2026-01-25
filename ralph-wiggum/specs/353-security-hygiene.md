# Spec 3.5.3: Security & Hygiene

> **Context:** Phase 3.5 Refactor. Final cleanup and security preparation.
> **Reference:** `coding_principles/security.md`
> **Goal:** Secure the foundation and enforce coding standards.
> **Time Estimate:** ~30 minutes

---

## 1. BOLA Stubbing

### 1.1 Repository Update
- Update `IPMRepository` interface methods to accept optional `ownerId?: string`.
- Update `SqlitePMRepository` implementation (ignore it for now).

### 1.2 Service Update
- Update `IssueService` and `BoardService` to accept `ownerId` in constructor or method args.
- Pass a dummy ID (e.g. `"local-owner"`) from Route Handlers.

---

## 2. Linting & Exports

### 2.1 ESLint Config
- Install `eslint-plugin-import`.
- Update `eslint.config.mjs`:
  ```javascript
  rules: {
    "import/no-default-export": "error"
  }
  ```
- Override: Allow default export in `page.tsx` and `layout.tsx` (Next.js requirement).

### 2.2 Refactor Exports
- Search for `export default`.
- Convert to named exports (`export function Component()`).
- Update imports in consumer files.

---

## 3. Date Handling

### 3.1 Utility
- Create `src/lib/date-utils.ts`.
- Export `now() { return Date.now(); }` (wrapper).
- Replace direct `Date.now()` calls in Repository.

---

## 4. Verification
- `npm run lint` -> Passes with new rules.
- `grep "Date.now()"` -> Should only match `date-utils.ts`.
