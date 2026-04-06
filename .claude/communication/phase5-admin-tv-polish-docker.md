# Communication: Phase 5 -- Admin, TV Mode, Polish, Docker

## Status
- Backend: [x] Complete
- Frontend: [x] Complete
- QA: [x] Complete — 3 fixes applied (see QA summary in this file)

## Shared Context

Phase 5 is the final phase of ShinobiOps. Phases 1-4 are complete. Two Phase 5 tasks are already done: 5.3 (Notification routing page) and 5.13 (Error pages).

The backend must be done first because the frontend depends on these new API endpoints:
- `/api/admin/stats` (Command Dojo dashboard)
- `/api/admin/users` + PATCH + avatar upload (Team management)
- `/api/admin/checkpoints/history` (Checkpoint history table)
- `/api/tv/data` (TV mode)
- `/api/admin/tv-config` (TV mode admin settings)
- Extended `/api/tickets` filters (admin log page)

Existing infrastructure that still works:
- Auth: `requireAuth()`, `requireRole()` from `@/lib/auth`
- DB: `db` from `@/lib/db`
- SSE: fully implemented, TV mode can use polling instead
- Notifications: fully implemented
- Checkpoint config API already exists at `/api/checkpoints/config`

---

## Backend -> Frontend

### Schema Changes

**New model: `TvConfig`**
- Table: `tv_config`
- Fields: `id` (cuid PK), `isEnabled` (boolean, default true), `refreshInterval` (int, default 30 seconds)
- Migration: `20260406090904_add_tv_config`

### API Endpoints Created / Modified

---

#### GET `/api/admin/stats`
- Auth: TECH_LEAD only
- Response:
```json
{
  "ticketsByStatus": [{ "status": "OPEN", "count": 5 }],
  "ticketsBySeverity": [{ "severity": "HIGH", "count": 3 }],
  "assignedCount": 7,
  "unassignedCount": 2,
  "avgResolutionTime7d": 12.5,
  "avgResolutionTime30d": 18.3,
  "developerWorkload": [
    {
      "userId": "abc",
      "name": "Jane Dev",
      "ninjaAlias": "shadow-fox",
      "avatarUrl": "/avatars/abc.webp",
      "openTicketCount": 3
    }
  ]
}
```
- Notes: ticketsBySeverity only counts tickets with status OPEN | IN_PROGRESS | WAITING_FOR_INFO. Resolution times are in hours.

---

#### GET `/api/admin/users`
- Auth: TECH_LEAD only
- Query params: `role?` (TECH_LEAD | DEVELOPER | SUPPORT_LEAD | SUPPORT_MEMBER), `isActive?` (true | false), `search?` (searches name OR email, case-insensitive partial match)
- Response:
```json
{
  "users": [
    {
      "id": "abc",
      "name": "Jane Dev",
      "email": "jane@example.com",
      "role": "DEVELOPER",
      "avatarUrl": "/avatars/abc.webp",
      "ninjaAlias": "shadow-fox",
      "isActive": true,
      "notifyTickets": true,
      "notifyBugs": true,
      "soundEnabled": true,
      "devStatus": "ACTIVE",
      "currentTask": "Working on auth",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### PATCH `/api/admin/users/[id]`
- Auth: TECH_LEAD only
- Body: `{ role?: Role, isActive?: boolean }`
- Guard: Cannot set `isActive: false` on your own account (returns 422)
- Returns 404 if user not found
- Response: `{ "user": { ...same shape as GET /api/admin/users item... } }`

---

#### POST `/api/admin/users/[id]/avatar`
- Auth: TECH_LEAD only
- Content-Type: `multipart/form-data`
- Form field: `avatar` (File — PNG, JPEG, or WEBP only)
- Resizes to max 256x256, converts to WebP, stores at `public/avatars/{userId}.webp`
- Also updates `user.avatarUrl` to `/avatars/{userId}.webp` in the database
- Response: `{ "avatarUrl": "/avatars/{userId}.webp" }`
- Error 400: non-image file type or missing `avatar` field
- Error 404: user not found

---

#### GET `/api/admin/checkpoints/config`
- Auth: TECH_LEAD only (stricter than `/api/checkpoints/config` which allows any authenticated user to GET)
- Response: `{ "config": { "id": "...", "intervalMinutes": 60, "activeHoursStart": "09:00", "activeHoursEnd": "18:00", "isEnabled": true } }`

#### PATCH `/api/admin/checkpoints/config`
- Auth: TECH_LEAD only
- Body: `{ intervalMinutes?: number (30-480), activeHoursStart?: string (HH:MM), activeHoursEnd?: string (HH:MM), isEnabled?: boolean }`
- Response: `{ "config": { ...updated config... } }`

---

#### GET `/api/admin/checkpoints/history`
- Auth: TECH_LEAD only
- Query params: `userId?`, `from?` (ISO datetime), `to?` (ISO datetime), `page?` (default 1), `limit?` (default 20, max 100)
- Response:
```json
{
  "checkpoints": [
    {
      "id": "abc",
      "userId": "xyz",
      "currentTask": "Working on auth",
      "isBlocked": false,
      "notes": null,
      "createdAt": "2026-01-01T12:00:00.000Z",
      "user": {
        "id": "xyz",
        "name": "Jane Dev",
        "ninjaAlias": "shadow-fox",
        "avatarUrl": "/avatars/xyz.webp"
      }
    }
  ],
  "total": 42,
  "page": 1
}
```

---

#### GET `/api/tickets` (extended)
New optional query params added on top of existing ones:
- `createdFrom`: ISO datetime string — filter tickets created on/after this date
- `createdTo`: ISO datetime string — filter tickets created on/before this date
- `resolvedFrom`: ISO datetime string — filter tickets resolved on/after this date
- `resolvedTo`: ISO datetime string — filter tickets resolved on/before this date
- `sortBy`: `createdAt` | `resolvedAt` | `severity` | `status` | `priorityOrder` (default: `priorityOrder`)
- `sortOrder`: `asc` | `desc` (default: `asc`)

All existing params (`type`, `severity`, `status`, `assignedToId`, `openedById`, `search`, `page`, `limit`) still work unchanged.

---

#### GET `/api/tv/data`
- Auth: **None** (public endpoint)
- Returns 503 `{ "error": "TV mode is disabled" }` when `TvConfig.isEnabled` is false
- Response:
```json
{
  "developers": [
    {
      "id": "abc",
      "name": "Jane Dev",
      "ninjaAlias": "shadow-fox",
      "avatarUrl": "/avatars/abc.webp",
      "devStatus": "ACTIVE",
      "currentTask": "Fixing auth bug",
      "assignedTicket": {
        "publicId": "TKT-0001",
        "title": "Login broken",
        "severity": "HIGH",
        "type": "TICKET",
        "status": "IN_PROGRESS"
      }
    }
  ],
  "ticketCounts": { "LOW": 2, "MEDIUM": 5, "HIGH": 3, "CRITICAL": 1 },
  "bugCounts": { "LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 0 },
  "refreshInterval": 30
}
```
- `assignedTicket` is `null` if no open ticket is assigned
- Only returns users with role DEVELOPER or TECH_LEAD and `isActive: true`
- `refreshInterval` is in seconds — frontend should use this to schedule polling

---

#### GET `/api/admin/tv-config`
- Auth: TECH_LEAD only
- Response: `{ "config": { "id": "...", "isEnabled": true, "refreshInterval": 30 } }`

#### PATCH `/api/admin/tv-config`
- Auth: TECH_LEAD only
- Body: `{ isEnabled?: boolean, refreshInterval?: number (10-300) }`
- Creates a default config record if none exists
- Response: `{ "config": { "id": "...", "isEnabled": true, "refreshInterval": 30 } }`

---

### Other Backend Changes

#### Rate Limiting (auth endpoints)
- `POST /api/auth/login` and `POST /api/auth/register` are now rate-limited
- Limit: 5 requests per 60 seconds per IP
- Returns 429 `{ "error": "Too many requests. Please try again later." }` when exceeded
- IP extracted from `x-forwarded-for` header, then `x-real-ip`, then fallback to "unknown"
- Implementation: in-memory Map (`lib/rate-limit.ts`) — resets on server restart

#### Secure Cookie (session)
- In production (`NODE_ENV=production`): cookie uses `SameSite=Strict` (previously `lax`)
- `Secure` flag was already set for production — unchanged

#### Environment Validation (`lib/env.ts`)
- Required vars: `SESSION_SECRET`, `DATABASE_URL`
- App throws at startup if either is missing
- Imported via `@/lib/env` in `app/layout.tsx`

#### Docker
- `Dockerfile` at monorepo root: multi-stage build (deps, builder, runner) using `node:20-slim`
- `entrypoint.sh` at monorepo root: runs `prisma migrate deploy` then `node apps/web/server.js`
- `docker-compose.yml` at monorepo root: SQLite volume at `./data`, reads `.env`, health check on `/api/health`, restart policy
- `next.config.mjs` updated: `output: "standalone"` added for Docker support

---

## Frontend Implementation Notes

### Components Implemented
- `UserAvatar` at `apps/web/components/user-avatar.tsx` — shared avatar component used across all pages
- `CommandDojoOverview` — fetches `/api/admin/stats` and `/api/admin/tv-config` client-side on mount
- `TeamManagement` — role change (PATCH), active toggle (PATCH), avatar upload (POST multipart)
- `CheckpointConfig` — config PATCH + history GET with ISO datetime from/to params
- `TicketLog` — extended `/api/tickets` with sortBy, pagination, clickable rows
- `TvBoard` — public `/api/tv/data`, dynamic polling interval from server response
- GlobalSearch — debounced `/api/tickets?search=...&limit=8` dropdown + Ctrl+K shortcut

### Loading Skeletons
- `/admin/loading.tsx`, `/dev/loading.tsx`, `/support/queue/loading.tsx`, `/ticket/[publicId]/loading.tsx`

### Verified
- `npm run typecheck` — 0 errors
- `npm run lint` — 0 errors (warnings are pre-existing)

---

## Frontend -> Backend

### Data Shapes Expected
- Stats: `{ ticketsByStatus: Array<{status, count}>, ticketsBySeverity: Array<{severity, count}>, assignedCount: number, unassignedCount: number, avgResolutionTime7d: number, avgResolutionTime30d: number, developerWorkload: Array<{ userId, name, ninjaAlias, avatarUrl, openTicketCount }> }`
- Users list: `{ users: Array<{ id, name, email, role, ninjaAlias, avatarUrl, isActive, devStatus, currentTask, updatedAt, ... }> }`
- Checkpoint history: `{ checkpoints: Array<{ id, userId, currentTask, isBlocked, notes, createdAt, user: { id, name, ninjaAlias, avatarUrl } }>, total: number, page: number }`
- TV data: `{ developers: Array<{ id, name, ninjaAlias, avatarUrl, devStatus, currentTask, assignedTicket: {...} | null }>, ticketCounts: { LOW, MEDIUM, HIGH, CRITICAL }, bugCounts: { LOW, MEDIUM, HIGH, CRITICAL }, refreshInterval: number }`
- TV config: `{ config: { id, isEnabled, refreshInterval } }`
