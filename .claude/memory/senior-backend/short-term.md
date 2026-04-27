# Short-Term Memory -- Senior Backend Engineer

## Current Task
Fix Docker build failing on `prisma generate` (DB_URL missing at build time) — Complete

## Files Modified

| File | Action |
|------|--------|
| `apps/web/prisma.config.ts` | Modified — replaced `env("DB_URL")` with `process.env.DB_URL ?? "mysql://placeholder:..."` |
| `Dockerfile` | Modified — removed `ARG DB_URL`, `ENV DB_URL=$DB_URL`, and redundant `RUN cd apps/web && npx prisma generate` from builder stage |
| `docker-compose.yml` | Modified — removed `web.build.args.DB_URL`, `web.environment.DB_URL`, `web.environment.DB_HOST`; runtime env injected solely via `env_file: apps/web/.env` |
| `apps/web/.env.example` | Modified — added all individual DB vars (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD); clarified Docker vs local host values |
| `.env.example` (root) | Modified — simplified to only the 3 vars the mysql service compose-time interpolation needs (DB_NAME, DB_USER, DB_PASSWORD) |
| `entrypoint.sh` | Modified — TCP probe now uses `DB_HOST`/`DB_PORT` directly instead of regex-parsing `DB_URL` |
