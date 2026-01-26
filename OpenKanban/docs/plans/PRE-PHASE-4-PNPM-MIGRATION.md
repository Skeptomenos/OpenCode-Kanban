# Pre-Phase 4: Tooling Migration Plan (pnpm)

> **Status**: Approved
> **Owner**: Sisyphus
> **Date**: 2026-01-26

## 1. Objective
Standardize the project on `pnpm` to improve installation speed, enforce stricter dependency boundaries (by removing hoisting), and ensure consistent environments across the team.

## 2. Context
- **Current State**: Project uses `npm` (with `package-lock.json`) and has `bun.lock` artifacts. `.npmrc` currently enables `shamefully-hoist=true` to mimic npm's flat node_modules structure.
- **Goal**: Move to strict `pnpm` (no hoisting) and remove all non-pnpm artifacts.

## 3. Execution Plan

### Step 1: Cleanup
Remove all legacy package manager artifacts to ensure a clean slate.
- [ ] Delete `node_modules/`
- [ ] Delete `package-lock.json`
- [ ] Delete `bun.lock`

### Step 2: Strict Configuration
Enforce pnpm's strict dependency resolution.
- [ ] Edit `OpenKanban/.npmrc`
- [ ] Remove line: `shamefully-hoist=true`

### Step 3: Installation
Install dependencies using pnpm.
- [ ] Run `pnpm install`
- [ ] Verify `pnpm-lock.yaml` is generated

### Step 4: Validation
Ensure the application still builds and conforms to quality standards under strict mode.
- [ ] Run `pnpm run build` -> Must exit with code 0
- [ ] Run `pnpm run lint` -> Must exit with code 0

### Step 5: Documentation
Update project references to reflect the new tooling.
- [ ] Update `OpenKanban/README.md` (Replace `npm install`/`npm run` with `pnpm install`/`pnpm run`)
- [ ] Update `OpenKanban/docs/ROADMAP.md` (Mark Pre-Phase 4 as complete)

## 4. Rollback Plan
If `pnpm run build` fails due to missing phantom dependencies (dependencies used but not declared in package.json):
1. Identify the missing dependency from the build error.
2. Explicitly install it: `pnpm add [package-name]`.
3. Retry build.
4. If failures persist and are unresolvable:
   - Restore `shamefully-hoist=true` in `.npmrc`.
   - Document the issue in `docs/ISSUES.md`.
