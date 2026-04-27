# Backend Task: Complete SQLite-to-MySQL Migration Fix

## Description
The ShinobiOps project was partially migrated from SQLite to MySQL. The Prisma schema, seed files, docker-compose, and most configuration files already reference MySQL/MariaDB correctly. However, the app fails at runtime in Docker because:

1. The Next.js standalone build output still contains stale SQLite dependencies (`better-sqlite3`, `@prisma/adapter-better-sqlite3`) instead of the MySQL ones (`mariadb`, `@prisma/adapter-mariadb`)
2. There are no Prisma migration files for MySQL (the old SQLite migration was deleted but no MySQL replacement was created)

The error seen in Docker:
```
Datasource "db": SQLite database "vectorops.db" at "file:./prisma/data/vectorops.db"
Production seed failed: TypeError: Cannot open database because the directory does not exist
    at new Database (/app/node_modules/better-sqlite3/lib/database.js:65:9)
    at createBetterSQLite3Client (file:///app/node_modules/@prisma/adapter-better-sqlite3/dist/index.mjs:623:14)
```

## Root Cause Analysis (completed by Tech Leader)

After investigating all files, here is what was found:

**Already correct (no changes needed):**
- `apps/web/prisma/schema.prisma` -- uses `provider = "mysql"` with proper `@db.VarChar`, `@db.Text` annotations
- `apps/web/prisma.config.ts` -- uses `process.env.DATABASE_URL!` (MySQL URL format)
- `apps/web/lib/db.ts` -- uses `PrismaMariaDb` adapter from `@prisma/adapter-mariadb`
- `apps/web/prisma/seed.ts` -- uses `PrismaMariaDb` adapter, no SQLite pragmas
- `apps/web/prisma/seed.prod.ts` -- uses `PrismaMariaDb` adapter, no SQLite pragmas
- `apps/web/.env.example` -- has MySQL connection string format
- `apps/web/.env` -- has MySQL connection string
- `docker-compose.yml` -- has MySQL 8.4 service, correct `DATABASE_URL`
- `entrypoint.sh` -- waits for MySQL, runs `prisma migrate deploy`, no SQLite code
- `apps/web/package.json` -- has `@prisma/adapter-mariadb`, no `better-sqlite3`
- `Dockerfile` -- uses `--external:@prisma/adapter-mariadb` and `--external:mariadb` in esbuild
- `scripts/backup-db.sh` -- uses `mysqldump`

**Problems found (need fixing):**

### Problem 1: Next.js standalone output has stale SQLite dependencies
The `.next/standalone/node_modules/` directory contains:
- `better-sqlite3` (should NOT be there)
- `@prisma/adapter-better-sqlite3` (should NOT be there)
- Missing: `@prisma/adapter-mariadb`
- Missing: `mariadb`

Next.js standalone mode traces imports to determine which `node_modules` to include. If it doesn't detect `mariadb` and `@prisma/adapter-mariadb` as needed, they won't be included. The fix is to add `serverExternalPackages` to `next.config.mjs` so Next.js explicitly includes these packages in the standalone output.

### Problem 2: No MySQL migrations exist
The old SQLite migration at `apps/web/prisma/migrations/20260425220513_init/migration.sql` was deleted (it contained SQLite DDL). The `migration_lock.toml` was also deleted. A new MySQL baseline migration needs to be created.

## Acceptance Criteria
- [ ] Next.js `next.config.mjs` includes `serverExternalPackages` for `@prisma/adapter-mariadb` and `mariadb`
- [ ] A clean MySQL migration exists at `apps/web/prisma/migrations/` with correct MySQL DDL
- [ ] The migration lock file (`migration_lock.toml`) specifies `provider = "mysql"`
- [ ] `npm run build` in the web app produces a standalone output that contains `mariadb` and `@prisma/adapter-mariadb` (not `better-sqlite3`)
- [ ] Docker build succeeds and the app starts without SQLite errors
- [ ] The seed scripts run correctly against MySQL

## Fix Instructions

### Fix 1: Update next.config.mjs
File: `apps/web/next.config.mjs`

Add `serverExternalPackages` to ensure Next.js traces the MariaDB/MySQL packages into the standalone output. The packages that need to be listed:
- `@prisma/adapter-mariadb`
- `mariadb`

This tells Next.js standalone bundler to include these native/binary packages in the output `node_modules`.

### Fix 2: Create MySQL baseline migration
The project needs a fresh MySQL migration. Steps:

1. Ensure MySQL is running locally (via docker-compose or standalone)
2. Run `prisma migrate dev --name init` from `apps/web/` with the MySQL `DATABASE_URL` to generate the MySQL DDL migration
3. This will create:
   - `apps/web/prisma/migrations/<timestamp>_init/migration.sql` with MySQL-flavored CREATE TABLE statements
   - `apps/web/prisma/migrations/migration_lock.toml` with `provider = "mysql"`

IMPORTANT: The migration SQL must use MySQL syntax (VARCHAR, INT, DATETIME, ENGINE=InnoDB, etc.), NOT SQLite syntax (TEXT for everything, no engine specification).

If MySQL is not available locally, you can use `prisma migrate diff` to generate the SQL from scratch:
```
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```
Then manually create the migration directory and files.

### Fix 3: Verify and rebuild
After the above fixes:
1. Run `npm run build` from the monorepo root (or `turbo build --filter=web`)
2. Verify the standalone output at `apps/web/.next/standalone/node_modules/` contains `mariadb` and `@prisma/adapter-mariadb`
3. Verify it does NOT contain `better-sqlite3` or `@prisma/adapter-better-sqlite3`

## Files to Modify
1. `apps/web/next.config.mjs` -- add `serverExternalPackages`
2. `apps/web/prisma/migrations/` -- create new MySQL baseline migration directory and files

## Files to Verify (no changes expected, just confirm)
- `apps/web/prisma/schema.prisma`
- `apps/web/lib/db.ts`
- `apps/web/prisma.config.ts`
- `apps/web/prisma/seed.ts`
- `apps/web/prisma/seed.prod.ts`
- `docker-compose.yml`
- `Dockerfile`
- `entrypoint.sh`
- `apps/web/.env.example`

## Rules to Follow
- KISS: Minimal changes only. Do not refactor unrelated code.
- Test the migration SQL before committing. If MySQL is available, run it against the database.
- The migration should be a single `init` migration (fresh baseline for MySQL).
- Do not modify the Prisma schema -- it's already correct for MySQL.

## Communication File
N/A (backend-only task)
