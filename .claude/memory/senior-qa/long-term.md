# Long-Term Memory — Senior QA

## Project Testing Infrastructure
- Playwright is NOT installed — no `node_modules/@playwright` found
- No test files exist (no `*.spec.ts`, `*.test.ts`, `tests/` or `e2e/` dirs)
- Testing is via static checks (`npm run typecheck`, `npm run lint`) only for Phases 1-5
- If tests are added, use: `apps/web/tests/` as the target directory

## Established Lint/TypeCheck Patterns
- Run from repo root: `npm run typecheck` and `npm run lint` via Turbo
- Cache hit means no code changes since last run; cache miss means fresh check
- Turbo warns about `NODE_ENV`, `SESSION_SECRET`, `DATABASE_URL`, `PORT` not in `turbo.json` — these are pre-existing and acceptable
- `db.ts` has an Unused eslint-disable directive on line 13 — pre-existing from Phase 2

## Known Pre-Existing Warnings (not regressions)
- `apps/web/components/tickets/ticket-card.tsx:60` — `currentUserId` unused
- `apps/web/hooks/use-notifications.ts:31` — setState in effect (react-hooks/set-state-in-effect)
- `apps/web/lib/db.ts:13` — Unused eslint-disable directive
- `apps/web/lib/db.ts:6,20` — NODE_ENV turbo env var
- `apps/web/lib/session.ts:16,19` — SESSION_SECRET, NODE_ENV turbo env vars
- `apps/web/lib/sse-emitter.ts:26` — NODE_ENV turbo env var
- `apps/web/middleware.ts:61` — SESSION_SECRET turbo env var (line shifted +1 after Phase 5 fix)
- `apps/web/prisma.config.ts:6` — DATABASE_URL turbo env var
- `apps/web/lib/env.ts:19-22` — SESSION_SECRET, DATABASE_URL, NODE_ENV, PORT turbo env vars (new in Phase 5)
- `apps/web/lib/rate-limit.ts:21` — NODE_ENV turbo env var (new in Phase 5, after eslint-disable fix)
- `packages/ui/src/hooks/use-local-storage.ts:4` — 2 unused-vars warnings

## Phase-Specific Findings

### Phase 3 (2026-04-06)
**Bugs fixed:**
1. `apps/web/app/api/tickets/route.ts:163` — Dead-code ternary `isBug ? "ticket:created" : "ticket:created"` (both branches identical). Fixed to just `"ticket:created"`.
2. `apps/web/app/api/tickets/[id]/route.ts:2` — Unused `Severity` import from `@prisma/client`. Removed.
3. `apps/web/lib/sse-emitter.ts:19-21` — Unused `eslint-disable-next-line no-var` comment. Removed.

### Phase 5 (2026-04-06)
**Bugs fixed:**
1. `apps/web/lib/rate-limit.ts:14` — Unused `eslint-disable-next-line no-var` comment. Removed. Same pattern as sse-emitter.ts — the no-var rule does not apply to TypeScript `declare global {}` ambient declarations.
2. `apps/web/components/layout/header.tsx:203` — Unused `e` parameter in `handleBlur()` (GlobalSearch). Removed parameter entirely (not needed, function doesn't use the event).
3. **CRITICAL: `apps/web/middleware.ts`** — `/api/tv/` was not in `PUBLIC_API_PREFIXES`. Unauthenticated requests to `/api/tv/data` (the TV board's polling endpoint) were being redirected to `/login` by middleware, breaking TV mode entirely for office displays without sessions. Fixed by adding `/api/tv/` to `PUBLIC_API_PREFIXES`.

## Recurring Pattern: declare global + eslint-disable-next-line no-var
Files that use `declare global { var X }` for HMR singleton pattern should NOT have `// eslint-disable-next-line no-var` because the `no-var` rule doesn't fire on TypeScript ambient declarations. This has been fixed in: sse-emitter.ts (Phase 3), rate-limit.ts (Phase 5).

## API Shapes Verified (Phase 5)
- `GET /api/admin/stats` returns correct shape: ticketsByStatus, ticketsBySeverity, assignedCount, unassignedCount, avgResolutionTime7d/30d, developerWorkload
- `GET /api/admin/users` returns `{ users: [...] }` with all required fields
- `PATCH /api/admin/users/[id]` has self-deactivation guard (422), 404 for missing user
- `POST /api/admin/users/[id]/avatar` uses sharp, max 256x256, WebP output
- `GET /api/tv/data` returns `{ developers, ticketCounts, bugCounts, refreshInterval }`, 503 when disabled
- `GET/PATCH /api/admin/tv-config` creates default record if none exists
- `GET/PATCH /api/admin/checkpoints/config` TECH_LEAD-only admin alias
- `GET /api/admin/checkpoints/history` pagination with from/to datetime filters
- `GET /api/tickets` extended with createdFrom/createdTo/resolvedFrom/resolvedTo/sortBy/sortOrder

## Schema Verified (Phase 5)
- `TvConfig` model: id, isEnabled (default true), refreshInterval (default 30s) — migration `20260406090904_add_tv_config`

## Middleware Auth Pattern (Important)
`apps/web/middleware.ts` has two lists:
- `PUBLIC_PATHS` — page routes that skip auth (e.g., `/login`, `/dev/tv`)
- `PUBLIC_API_PREFIXES` — API prefixes that skip auth (e.g., `/api/auth/`, `/api/health`, `/api/tv/`)
When adding a new public API endpoint, it MUST be added to `PUBLIC_API_PREFIXES` or auth redirect will break it.
