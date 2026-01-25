# QUALITY.md

## 1. The "Always Works" Protocol
You are working on a running application. A broken build is a failed task.

1.  **Verify Before Commit**:
    - Run `npm run build` after *any* refactor or significant change.
    - If the build fails, you are not done.

2.  **No Slop**:
    - Do not comment out code to make it compile unless explicitly temporary.
    - Do not remove types just to satisfy the compiler. Fix the interface.
    - Do not leave "dead" imports or unused components that break the build.

4.  **Clean Code**:
    - **Meaningful Names**: Use descriptive variable/function names (`isSessionActive` vs `active`).
    - **Single Responsibility**: Components/functions should do one thing well.
    - **DRY (Don't Repeat Yourself)**: Abstract repeated logic into hooks or utilities.
    - **Early Returns**: Reduce nesting depth by returning early.
    - **Type Safety**: Avoid `any`. Define interfaces for all data structures.

## 2. Testing
- Use `npm run dev` to verify runtime behavior.
- Use `npm run lint` to catch static issues early.
