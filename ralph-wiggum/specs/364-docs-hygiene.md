# Spec 3.6.4: Documentation & Hygiene

> **Context:** Final cleanup of documentation and config warnings.
> **Reference:** `OpenKanban/docs/phase3.5-issues3.md` (Categories F, G)
> **Goal:** Clean console output and accurate docs.
> **Time Estimate:** ~15 minutes

---

## 1. Documentation (G.1, G.2)

### 1.1 Sync
- Check `docs/ROADMAP.md`: Ensure "Phase 3.5" is marked complete.
- Check `README.md`: Ensure Next.js version is 16.

### 1.2 Consolidation (G.3)
- Verify `docs/` vs `OpenKanban/docs/`.
- If `docs/` exists at root, move unique files to `OpenKanban/docs/` and delete root `docs/` (Update `AGENTS.md` to reflect new path).

---

## 2. NPM Config (G.1)

### 2.1 Fix Warning
- Open `package.json` (or `.npmrc`).
- Remove `shamefully-hoist` (pnpm specific) if using npm.

---

## 3. Pseudo-Barrels (G.2)

### 3.1 Refactor
- Check `src/features/kanban/utils/index.ts`.
- If it contains logic, move logic to `helpers.ts` and re-export in `index.ts`.

---

## 4. Verification
- `npm install` -> No warning.
- `ls docs/` -> Does not exist (if moved).
