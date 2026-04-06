# Context: Database

**ID**: CTX-INFRA-002  
**Category**: Infrastructure  
**Last Updated**: 2026-04-05  
**Dependencies**: None

<!-- @context-meta
{
  "id": "CTX-INFRA-002",
  "category": "infrastructure",
  "dependencies": [],
  "tags": ["sqlite", "prisma", "database", "wal", "migrations", "orm"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

ShinobiOps uses SQLite 3 as its database via Prisma ORM. File-based, no external database server required. WAL mode enabled for concurrent reads during writes. Data persists on a Docker named volume at `/app/prisma/data`.

## Key Information

### SQLite Configuration

Required pragmas (applied at connection time):

```sql
PRAGMA journal_mode = WAL;       -- Concurrent reads with writes
PRAGMA foreign_keys = ON;        -- Enforce relational integrity
PRAGMA synchronous = NORMAL;     -- Safe performance balance
PRAGMA busy_timeout = 5000;      -- Prevent SQLITE_BUSY under concurrency
```

### Prisma ORM

- **Schema file**: `prisma/schema.prisma` (in apps/web)
- **Auto-generated types**: Type-safe queries for all models
- **Migrations**: `npx prisma migrate dev` (development), `npx prisma migrate deploy` (production)
- **Prisma Studio**: `npx prisma studio` — visual database explorer (dev only)
- **Raw SQL**: `$queryRaw()` available when ORM is insufficient

### Data Persistence

- SQLite file stored at path specified by `DATABASE_URL` environment variable
- Default: `file:./data/prisma.db`
- In Docker: mounted volume at `/app/prisma/data`
- File survives container restarts and upgrades
- No external database dependency — fully self-contained

### Key Commands

```bash
npx prisma generate          # Generate Prisma client from schema
npx prisma migrate dev       # Create and apply migrations (dev)
npx prisma migrate deploy    # Apply pending migrations (production)
npx prisma studio            # Visual database explorer
npx prisma db push           # Push schema without migration files
```

### Security

- SQLite file not exposed outside Docker container
- No network-accessible database port
- All access through Prisma client in server-side code only

## Code References

- `apps/web/lib/db.ts` — Database connection setup and utilities
- `apps/web/lib/types.ts` — Type definitions (mirrors Prisma-generated types)
- `docs/TECH-STACK.md` (Section 4) — Database specification

## Related Contexts

- [CTX-CORE-002 Data Model](../core/data-model.md) — Schema entities and relationships
- [CTX-INFRA-001 Deployment](deployment.md) — Docker volume for data persistence

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
