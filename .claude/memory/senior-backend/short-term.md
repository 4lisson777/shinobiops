# Short-Term Memory -- Senior Backend Engineer

## Current Task
Phase 5 backend implementation complete (all steps).

## Files Created / Modified

| File | Action |
|------|--------|
| `apps/web/prisma/schema.prisma` | Updated -- Added `TvConfig` model |
| `apps/web/prisma/migrations/20260406090904_add_tv_config/` | Created -- migration for TvConfig |
| `apps/web/app/api/admin/stats/route.ts` | Created -- GET admin stats |
| `apps/web/app/api/admin/users/route.ts` | Created -- GET admin users list (TECH_LEAD only, all fields) |
| `apps/web/app/api/admin/users/[id]/route.ts` | Created -- PATCH user role/isActive (with self-deactivation guard) |
| `apps/web/app/api/admin/users/[id]/avatar/route.ts` | Created -- POST avatar upload (sharp resize to 256x256 webp) |
| `apps/web/app/api/admin/checkpoints/config/route.ts` | Created -- Admin-namespaced GET/PATCH checkpoint config (TECH_LEAD only) |
| `apps/web/app/api/admin/checkpoints/history/route.ts` | Created -- GET checkpoint history with pagination |
| `apps/web/app/api/admin/tv-config/route.ts` | Created -- GET/PATCH TvConfig (TECH_LEAD only) |
| `apps/web/app/api/tv/data/route.ts` | Created -- Public GET TV mode data (503 when disabled) |
| `apps/web/lib/schemas/ticket-schemas.ts` | Updated -- Added createdFrom/createdTo/resolvedFrom/resolvedTo/sortBy/sortOrder to ticketFilterSchema |
| `apps/web/app/api/tickets/route.ts` | Updated -- GET uses new date range and sort params |
| `apps/web/lib/env.ts` | Created -- Environment variable validation at startup |
| `apps/web/lib/rate-limit.ts` | Created -- In-memory rate limiter (Map-based, globalThis singleton) |
| `apps/web/app/api/auth/login/route.ts` | Updated -- Added rate limiting (5/min/IP) |
| `apps/web/app/api/auth/register/route.ts` | Updated -- Added rate limiting (5/min/IP) |
| `apps/web/lib/session.ts` | Updated -- SameSite=strict in production |
| `apps/web/app/layout.tsx` | Updated -- Added `import "@/lib/env"` for startup validation |
| `apps/web/next.config.mjs` | Updated -- Added `output: "standalone"` for Docker |
| `apps/web/public/avatars/` | Created -- Directory for user avatar files |
| `Dockerfile` (monorepo root) | Created -- Multi-stage build: deps, builder, runner |
| `entrypoint.sh` (monorepo root) | Created -- Runs `prisma migrate deploy` then starts server |
| `docker-compose.yml` (monorepo root) | Created -- SQLite volume, .env, health check |

## Dependencies Added
- `sharp` (runtime) -- image resizing for avatar upload
- `@types/sharp` (dev) -- TypeScript types for sharp

## Pending Actions (require user to run if DB is reset)
- Migration already applied: `20260406090904_add_tv_config`
- If `prisma generate` is re-run: `cp -r apps/web/generated/prisma/client/* ...` (check the exact generated path)
