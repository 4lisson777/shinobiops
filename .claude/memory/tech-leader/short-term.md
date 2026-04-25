# Tech Leader -- Short-Term Memory

## Current Task
- **Name:** Docker Architecture Audit and Optimization
- **Plan folder:** `ai-driven-project/prompt-engineering/20260425_docker-architecture-audit/`
- **Scope:** Infrastructure (Dockerfile, docker-compose.yml, .dockerignore, entrypoint.sh)
- **Status:** COMPLETED -- all 10 focus areas addressed
- **Result:** Image 556MB virtual / 119MB compressed (down from 1.32GB / 264MB). 55% compressed size reduction.

## Previous Task
- **Name:** Docker Best-Practice Optimizations
- **Status:** COMPLETED (superseded by this audit)

## Previous Task (paused)
- **Name:** Multitenancy Refactor
- **Plan folder:** `ai-driven-project/prompt-engineering/20260423_multitenancy-refactor/`
- **Scope:** Full-stack (multi-phase)
- **Status:** PLANNED -- awaiting backend Phase MT-1 execution first

## Key Docker Decisions
- Turbo prune for minimal workspace (only web deps installed)
- Isolated Prisma CLI in /prisma-cli (not full node_modules)
- NODE_PATH for prisma config resolution in entrypoint
- Standalone Next.js output as sole runtime source
- esbuild banner with createRequire for CJS->ESM compatibility (bcryptjs crypto)
- Prisma version extracted dynamically from installed package
- Healthcheck single source of truth in Dockerfile (removed from compose)
- init:true, log rotation, memory limits in compose
- Docs service removed from compose (commented out build in Dockerfile too)

## Multitenancy Architecture Notes (still relevant)
- Row-level tenant isolation with organizationId FK on all tenant-scoped models
- Keep SQLite (no DB engine change in this phase)
- Super admin is a boolean flag on User, not a Role enum value
- Session-implicit tenancy (no subdomains, no URL path prefixes)
- All ~40 API routes need to switch from raw `db` to `getTenantDb()`
