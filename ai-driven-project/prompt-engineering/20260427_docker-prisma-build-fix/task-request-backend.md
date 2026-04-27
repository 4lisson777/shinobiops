# Backend Task: Fix Docker Build Failing on `prisma generate` (DB_URL Missing)

> See canonical copy at `/home/alisson/web/personal/vectorops/.claude/tasks/task-request-backend.md`.
> This file is a pointer for the project's plan-folder convention.

## Quick Summary

`docker compose up --build` fails in the `builder` stage during `prisma generate` because `prisma.config.ts` calls `env("DB_URL")` eagerly, throwing when the var is unset. The runtime app does NOT actually need `DB_URL` (it uses `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` directly via `PrismaMariaDb`). The Docker build ARG plumbing is also broken because docker-compose interpolates build args from compose-time env, not service-level `env_file`.

## Recommended Fix (Option A)

1. Make `apps/web/prisma.config.ts` tolerate missing `DB_URL` with a placeholder fallback so `prisma generate` works without DB credentials.
2. Remove `ARG DB_URL` / `ENV DB_URL=$DB_URL` from the `Dockerfile` builder stage.
3. Remove the redundant explicit `RUN npx prisma generate` (Turbo runs it via `db:generate` dependency).
4. Remove `web.build.args.DB_URL` and the `web.environment.DB_URL` / `DB_HOST` lines from `docker-compose.yml` — rely on `env_file: apps/web/.env`.
5. Update `.env.example` files to reflect the simplified setup.

## Full Plan

See `/home/alisson/web/personal/vectorops/.claude/tasks/task-request-backend.md` for the complete acceptance criteria, validation steps, alternatives considered, and engineer notes.
