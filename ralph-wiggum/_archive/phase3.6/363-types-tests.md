# Spec 3.6.3: Type Safety & Tests

> **Context:** Fixing low-severity type casts and setting up component testing.
> **Reference:** `OpenKanban/docs/phase3.5-issues3.md` (Categories D, E)
> **Goal:** Eliminate `as` casts and enable UI testing.
> **Time Estimate:** ~45 minutes

---

## 1. Type Safety Fixes (Category D)

### 1.1 Form Context (D.2)
- Update `src/components/ui/form.tsx`:
  - Verify if A.5 from previous phase was fully applied. If not, apply `null` check pattern.

### 1.2 Chart Casts (D.1)
- Update `src/components/ui/chart.tsx`:
  - Add type guards for `payload` instead of `as string`.

### 1.3 Singleton Cast (D.3)
- Ensure JSDoc exists (done in 357, check verification).

---

## 2. Component Testing Setup (Issue E.2)

### 2.1 Dependencies
- Install `@testing-library/react` `@testing-library/dom` `jsdom`.
- Update `vitest.config.ts`: environment `jsdom`.

### 2.2 Smoke Test
- Create `src/components/ui/__tests__/button.test.tsx`.
- Render button, check text.

---

## 3. Verification
- `npm run lint` -> Pass.
- `npm run test` -> New component test passes.
