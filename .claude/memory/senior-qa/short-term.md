# Short-Term Memory — Senior QA

## Last Task
- **Task:** QA — Role-Based Notification Configuration
- **Plan path:** `ai-driven-project/prompt-engineering/20260423_role-notification-config/`
- **Communication file:** `.claude/communication/20260423_role-notification-config.md`
- **Date:** 2026-04-23

## Test Files Created
- `apps/web/tests/role-notification-config/api.test.mjs` — 76 tests, all PASS (EXIT 0)

## Verification Results
- `npm run typecheck`: 0 errors (cache miss on web package — confirmed fresh compile)
- `npm run lint`: 0 errors (3 warnings — all pre-existing patterns: `process`/`global` not in ESLint browser env, same as existing test files)
- All 76 tests PASS in final run

## Initial Test Failures and Fixes
1. Suites 10-13 — Role guard tests: POST /api/tickets returns 403 for TECH_LEAD because that route requires SUPPORT_MEMBER/SUPPORT_LEAD/QA. Fixed to use `cookies.support` for ticket creation throughout.
2. Suite 42 — Assignment notification: `cookies.dev` is Matheus, but `usersBody.users[0]` is Guilherme (alphabetical sort). Fixed to use `/api/users/me` with `cookies.dev` to get the same user identity for both the assignment and the notification check.
3. Suite 43 — TICKET_DONE regression: tickets start as OPEN; transition to DONE requires OPEN→IN_PROGRESS→DONE (two steps). Fixed to call PATCH twice.

## Bug Found During QA (Real Bug in Implementation)
- **BUG-001** (High): `/api/users` route missing `QA` from the role filter enum.
  - `apps/web/app/api/users/route.ts:10` — `z.enum(["TECH_LEAD", "DEVELOPER", "SUPPORT_LEAD", "SUPPORT_MEMBER"])` does NOT include `"QA"`.
  - **Impact**: `NotificationRouting` component calls `/api/users?role=QA&isActive=true` for each eligible role. Since QA has `notifyOnCreation=true` by default, this request is always made and always returns 400. The per-user routing table will show an error state for any admin session where QA's `notifyOnCreation` is enabled.
  - Verified with `curl`: returns `{"error":"Invalid query parameters","details":{"role":["Invalid enum value. Expected 'TECH_LEAD' | 'DEVELOPER' | 'SUPPORT_LEAD' | 'SUPPORT_MEMBER', received 'QA'"]}}`.
  - **Fix required**: Add `"QA"` to the enum in the `usersFilterSchema` and include `QA` in DEV_ROLES handling or add a separate non-DEV path.
