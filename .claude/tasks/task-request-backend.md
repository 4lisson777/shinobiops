# Backend Task: Fix Two Production Runtime Errors

## Description

After the Docker networking fix (`DB_HOST=mysql:3306` instead of `mysql:3308`), two runtime errors are firing repeatedly in the `vectorops-web-1` container, leaving the app unhealthy:

1. **`TypeError: Cannot read properties of undefined (reading 'length')`** — server-rendered, fires multiple times per page load.
2. **`prisma:error pool timeout: failed to retrieve a connection from pool after 10000ms (pool connections: active=0 idle=0 limit=8)`** — every Prisma operation fails.

Both have a single root cause behind the second error, and an independent cause behind the first.

## Root Cause Analysis

### Error 2 — Pool timeout / "Too many connections"

`apps/web/lib/db.ts` exports `db` as a `Proxy` over `getDb()`. In production it returns `createPrismaClient()` (a brand new client) on **every property access**:

```ts
export function getDb(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma ??= createPrismaClient()
    return globalThis.__prisma
  }
  return createPrismaClient()  // ← LEAK: new client every call in production
}
```

The Proxy:

```ts
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb()  // ← called on EVERY property read on `db`
    ...
  },
})
```

So `db.user.findMany(...)` in production:
1. `db.user` → triggers Proxy `get`, calls `getDb()`, **creates a brand-new `PrismaClient`** with a fresh `mariadb.createPool({ connectionLimit: 8 })`
2. The pool eagerly opens TCP/MySQL handshake connections in the background
3. The client is never `.disconnect()`ed; once the request finishes the pool is leaked

**Live evidence collected** (inside the running containers):

```
docker exec vectorops-mysql-1 mysql -uroot -e "SHOW STATUS LIKE 'Threads_connected'"
  → Threads_connected = 152
docker exec vectorops-mysql-1 mysql -uroot -e "SHOW VARIABLES LIKE 'max_connections'"
  → max_connections = 151
docker exec vectorops-mysql-1 mysql -uroot -e "SELECT user,count(*) FROM information_schema.PROCESSLIST GROUP BY user"
  → vectorops: 151 (all in 'Sleep' state)
```

A direct test from inside the web container reproduces the underlying MySQL error before pool timeout kicks in:

```
ERR (conn:1496, no: 1040, SQLState: 08004) Too many connections
Code: ER_CON_COUNT_ERROR Errno: 1040
```

So the pool can never establish a connection because MySQL has refused all new ones — exactly because previous request handlers leaked dozens of pools. After ~18 unique queries, max_connections is exhausted; from there on every request times out at 10 s.

### Error 1 — `TypeError: ... reading 'length'`

The minified frame points at `_3b12f0ce._.js:1:6014`. Inspecting the chunk at that offset reveals:

```js
function(a){let b=0;for(let c=0;c<a.length;c++)b=a.charCodeAt(c)+((b<<5)-b);return Math.abs(b)%e.length}
```

This is the body of `nameToColorIndex(name)` from `apps/web/components/user-avatar.tsx`. When `name` is `undefined`, `name.length` throws.

`UserAvatar` is rendered server-side in:
- `apps/web/components/layout/header.tsx` (`name={session.name}`) — runs on every protected page
- `apps/web/app/(protected)/ticket/[publicId]/page.tsx` (opener / assignee)
- `apps/web/components/tickets/ticket-timeline.tsx` (`name={event.actor.name}`)

The most likely trigger is the Header path: when the Prisma pool is exhausted (Error 2), `(protected)/layout.tsx` swallows the DB error and proceeds. In some flows `session.name` can also be undefined (e.g., the cookie was sealed before `name` was added to `SessionData`, or the user just authenticated via an incomplete code path) — and the Header passes it straight to `UserAvatar` with no fallback.

Either way, **`UserAvatar` should defensively handle undefined / empty `name`** so a single bad row in the DB or a transient session anomaly does not crash an entire server-rendered page.

## Acceptance Criteria

- [ ] In production, exactly one `PrismaClient` instance exists per Node process (singleton). Repeated property reads on `db` do NOT create new clients.
- [ ] `db.user.findMany()` succeeds in the running container after the fix is rebuilt and redeployed (verified by hitting any protected page that previously timed out).
- [ ] `Threads_connected` on the MySQL container stabilizes at ≤ 8 after a few requests (matching `connectionLimit: 8`), instead of climbing to 151.
- [ ] `UserAvatar` no longer throws when `name` is undefined / null / empty; it falls back to "?" initials and the first color in the palette.
- [ ] Header passes a guaranteed non-undefined name (or the prop allows undefined and renders safely).
- [ ] `npm run typecheck` and `npm run lint` pass.

## Files to Change

### 1. `apps/web/lib/db.ts` — fix the connection leak

Make the production branch reuse a singleton across the entire process, not just dev. Keep the Proxy so import-time evaluation does not eagerly open a pool (this still matters for `next build`).

Behavior required:

- One `PrismaClient` per process in production (cached on a module-level variable, NOT on `globalThis` for prod — that would survive across Next.js HMR cycles unnecessarily, but in prod there is no HMR so a module-level `let` is fine).
- In development, keep the existing `globalThis.__prisma` cache (HMR safety).
- The `db` Proxy should call `getDb()` once per property access (cheap when cached) and bind functions to the cached client. The current shape is correct; only `getDb()` needs to change.
- Do NOT call `prisma.$connect()` eagerly — let the pool initialize on first use.

Pseudocode:

```ts
let prismaInstance: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma ??= createPrismaClient()
    return globalThis.__prisma
  }
  prismaInstance ??= createPrismaClient()
  return prismaInstance
}
```

That single line change (`return createPrismaClient()` → `prismaInstance ??= createPrismaClient(); return prismaInstance`) is the entire fix for Error 2.

### 2. `apps/web/components/user-avatar.tsx` — defensive against undefined names

- Widen the `name` prop type to `string | null | undefined`.
- Treat empty / whitespace-only / null / undefined as "unknown user": initials = "?", color index = 0.
- Both `nameToColorIndex` and `getInitials` must accept and short-circuit on empty input — no `.length` / `.trim()` on undefined.
- Avatar `alt` attribute should still pass a string (use `name ?? ""`).

### 3. (Optional, defensive) `apps/web/components/layout/header.tsx`

- Pass `name={session.name ?? ""}` so even if a session's `name` is missing, the avatar still renders.
- This is now redundant with fix #2 but adds belt-and-suspenders.

## Out of Scope

- **No changes to `Dockerfile` or `docker-compose.yml`.** The user has just adjusted Docker networking and a rebuild is expensive. All fixes are pure source changes; they take effect after `docker compose up --build web`.
- **No changes to MySQL `max_connections`.** Raising the limit would only mask the leak. Fix #1 reduces sustained connections to 8 (the configured pool size).
- **No SSL changes.** I tested with and without SSL; both reproduce identically once max_connections is hit. SSL is not the cause.
- **No `prisma.config.ts` or `entrypoint.sh` changes.** Those touch CLI / migrations, not runtime.

## Verification Steps (post-fix, after rebuild)

1. `docker compose up --build web`
2. Hit `/login`, log in, navigate to `/dev` and `/support/queue`. Pages should render normally.
3. `docker exec vectorops-mysql-1 mysql -uroot -pvectorops -e "SHOW STATUS LIKE 'Threads_connected'"` should report a stable value ≤ 9 (8 pool + 1 admin).
4. `docker logs vectorops-web-1 --tail 100` should be free of `pool timeout` and `TypeError ... 'length'` lines.
5. Optionally, manually corrupt a session cookie (or log in with a user whose `name` field is empty) — the Header should render the "?" avatar without crashing.

## Communication File

N/A — backend-only, no frontend coordination needed.
