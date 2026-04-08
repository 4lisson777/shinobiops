# Short-Term Memory — Senior QA

## Last Task
- **Task:** QA — Ticket Notification Flow (QA role assign permission + notification regression)
- **Plan path:** No plan file — feature description provided directly in prompt
- **Date:** 2026-04-08

## Test Files Run
- `apps/web/tests/ticket-notification-flow/api.test.mjs` — 39 tests, all PASS (EXIT 0)

## Verification Results
- `npm run typecheck --force`: 0 errors (cache miss confirmed fresh compile)
- All 9 test suites PASS
- No implementation bugs found — both initial failures were test issues (slice size + fetch redirect mode)

## Initial Failures (Both Were Test Issues, Not Bugs)
1. Suite 1 — TECH_LEAD Responsável static check: `slice(idx, idx + 1500)` was too small; `isTechLead` JSX block is >1500 chars. Fixed to 3000.
2. Suite 3 — Unauthenticated auth guard: `fetch` default `redirect: "follow"` follows the 307 to `/login` (200 HTML). Fixed to `redirect: "manual"` to capture the raw 307.
