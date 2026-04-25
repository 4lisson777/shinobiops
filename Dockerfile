# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 0 — Turbo Prune
# Creates a minimal workspace with only the packages needed by the target app.
# This avoids installing unnecessary dependencies (e.g., docs packages when
# building web) and produces a tighter lockfile for faster npm ci.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS pruner
WORKDIR /app

RUN npm install -g turbo@^2
COPY . .
RUN turbo prune web --docker

# ---------------------------------------------------------------------------
# Stage 1 — Install Dependencies
# Uses the pruned lockfile from Stage 0 so only web's transitive deps are
# installed. BuildKit cache mount keeps npm's download cache across builds,
# avoiding redundant network fetches on rebuilds.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# python3, make, g++ — required by native addons (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy only the pruned package manifests and lockfile (from turbo prune /json).
# This layer is cached as long as dependencies don't change.
COPY --from=pruner /app/out/json/ ./

# Deterministic install from pruned lockfile.
# --mount=type=cache keeps npm's HTTP cache between builds for faster rebuilds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------------------------------------------------------------------------
# Stage 2 — Build
# Copies only the source files needed by web (from turbo prune /full), builds
# the Next.js app, compiles the production seed script. Also installs the
# Prisma CLI into an isolated directory for runtime migrations.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app ./
# Overlay only the source files turbo prune identified as necessary
COPY --from=pruner /app/out/full/ ./

# Generate Prisma client before building
RUN cd apps/web && npx prisma generate

ENV SKIP_ENV_VALIDATION=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build with Turbo. Cache mount persists .turbo across builds for faster
# incremental rebuilds in CI.
RUN --mount=type=cache,target=/app/.turbo \
    npx turbo build --filter=web

# Compile production seed to plain JS so it can run with node in the runner
# stage (tsx is a dev dependency and won't exist there).
# - ESM format: required because the generated Prisma client uses import.meta.url
#   (import.meta.url is natively supported in ESM output, unlike CJS)
# - bcryptjs + generated Prisma client: bundled inline (pure JS / TS types stripped)
# - better-sqlite3 + @prisma/*: kept external (native modules, resolved at runtime)
# Banner creates `require` for CJS modules (like bcryptjs) that need it in ESM.
# Without this, bcryptjs can't access Node's crypto module for salt generation.
RUN node_modules/.bin/esbuild apps/web/prisma/seed.prod.ts \
  --bundle \
  --platform=node \
  --format=esm \
  --banner:js="import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" \
  --external:better-sqlite3 \
  --external:@prisma/adapter-better-sqlite3 \
  --external:@prisma/client \
  --outfile=apps/web/prisma/seed.prod.mjs

# Install Prisma CLI into an isolated directory for runtime migrations.
# This avoids copying the entire workspace node_modules (835MB) into the
# runner. Only the Prisma CLI and its transitive deps are installed (~205MB).
# Version is extracted from the installed prisma package to stay in sync.
RUN --mount=type=cache,target=/root/.npm \
    PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version") && \
    mkdir -p /prisma-cli && \
    echo "{\"dependencies\":{\"prisma\":\"$PRISMA_VER\",\"@prisma/config\":\"$PRISMA_VER\"}}" > /prisma-cli/package.json && \
    cd /prisma-cli && npm install --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 3 — Production Runner
# Minimal runtime image. Uses Next.js standalone output (which includes its
# own pruned node_modules with only runtime deps). The Prisma CLI is installed
# in an isolated /prisma-cli directory solely for `prisma migrate deploy`.
#
# Size breakdown:
#   Standalone output + node_modules:   ~79MB
#   Prisma CLI (/prisma-cli):          ~205MB
#   Static assets + prisma schema:        ~3MB
#   Total:                              ~287MB
#   vs. old approach:                   ~910MB
# ---------------------------------------------------------------------------
FROM node:20-alpine AS web-runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:./prisma/data/vectorops.db"

# --- Next.js standalone output (includes server.js + minimal node_modules) ---
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public

# --- Prisma runtime files (schema, migrations, generated client, seed) ---
COPY --from=builder --chown=node:node /app/apps/web/prisma ./apps/web/prisma
COPY --from=builder --chown=node:node /app/apps/web/prisma.config.ts ./apps/web/prisma.config.ts
COPY --from=builder --chown=node:node /app/apps/web/generated ./apps/web/generated

# --- Prisma CLI for `prisma migrate deploy` at container startup ---
# Isolated in /prisma-cli to avoid polluting the standalone node_modules.
COPY --from=builder --chown=node:node /prisma-cli/node_modules /prisma-cli/node_modules

# Ensure the data directory exists with node ownership so Docker initialises
# the named volume with the correct permissions (container runs as node user).
RUN mkdir -p /app/apps/web/prisma/data && chown node:node /app/apps/web/prisma/data

# Copy entrypoint
COPY --chown=node:node entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Non-root user — limits damage if the app process is compromised
USER node

EXPOSE 3000

# Container-level health check — Docker verifies the app is actually
# responding, not just that the process is alive. Compose can override this.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/entrypoint.sh"]
