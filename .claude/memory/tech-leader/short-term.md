# Tech Leader -- Short-Term Memory

## Current Task
- **Name:** Fix Two Production Runtime Errors (TypeError + Prisma pool timeout)
- **Plan folder:** `.claude/tasks/task-request-backend.md` (canonical)
- **Scope:** Backend-only (source-only fixes; no Docker/compose changes)
- **Status:** FIXES APPLIED -- requires `docker compose up --build web` to take effect
- **Key Findings:**
  - **Error 2 (pool timeout) root cause:** `apps/web/lib/db.ts` `getDb()` returned `createPrismaClient()` on every call in production. Combined with the Proxy that calls `getDb()` on every property access, every Prisma query leaked a fresh `mariadb.createPool({ connectionLimit: 8 })`. After ~18 queries, MySQL `max_connections=151` was exhausted. Verified live: `Threads_connected=152` with all in `Sleep` state.
  - **Error 1 (TypeError) root cause:** Minified frame `_3b12f0ce.js:1:6014` is `nameToColorIndex` in `apps/web/components/user-avatar.tsx`. `name.length` throws when `name` is undefined. Most likely path is the Header rendered server-side with `session.name` being undefined when sessions are stale or DB lookups for the user fail.
  - **Network is fine:** TCP `mysql:3306` is reachable from the web container; SSL is not the cause.
- **Fixes Applied:**
  - `apps/web/lib/db.ts`: cache PrismaClient in a module-level `let prismaInstance` for production (singleton).
  - `apps/web/components/user-avatar.tsx`: widen `name` to `string | null | undefined`; defensive returns in `nameToColorIndex` and `getInitials`.
  - `apps/web/components/layout/header.tsx`: pass `session.name ?? ""` for belt-and-suspenders.
- **TypeCheck:** Passes (`tsc --noEmit -p apps/web/tsconfig.json`).
- **Verification (post-rebuild):** `Threads_connected` should stabilize ≤ 9; no `pool timeout` or `'length'` TypeError in logs.

## Previous Task
- **Name:** Fix Docker Build Failing on `prisma generate` (DB_URL Missing)
- **Plan folder:** `ai-driven-project/prompt-engineering/20260427_docker-prisma-build-fix/`
- **Scope:** Backend-only (Dockerfile + compose + prisma.config.ts)
- **Status:** PLANNED -- awaiting backend engineer execution

## Previous Task
- **Name:** Complete SQLite-to-MySQL Migration Fix
- **Plan folder:** `ai-driven-project/prompt-engineering/20260426_sqlite-to-mysql-fix/`
- **Scope:** Backend-only (config fixes + migration creation)
- **Status:** PLANNED -- awaiting backend engineer execution

## Previous Task
- **Name:** Fix Four Runtime Bugs
- **Plan folder:** `ai-driven-project/prompt-engineering/20260425_runtime-bugfixes/`
- **Status:** PLANNED -- awaiting backend engineer execution

## Previous Task (paused)
- **Name:** Multitenancy Refactor
- **Plan folder:** `ai-driven-project/prompt-engineering/20260423_multitenancy-refactor/`
- **Scope:** Full-stack (multi-phase)
- **Status:** PLANNED -- awaiting backend Phase MT-1 execution first
