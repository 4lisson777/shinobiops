# Communication: Phase 3 -- Real-Time Notifications, Sound Alerts, and Ninja Board

## Status
- Backend: [x] Complete
- Frontend: [x] Complete
- QA: [x] Complete (2026-04-06) — all 23 checks pass, 3 minor issues fixed

## Shared Context
Phase 3 adds the real-time coordination layer to ShinobiOps. The backend creates the SSE infrastructure, notification persistence, and developer status APIs. The frontend consumes these via a shared SSE connection, displaying live notifications with sound alerts and an interactive Ninja Board.

The detailed implementation plan is at `/home/alisson/.claude/plans/starry-zooming-acorn.md`.

## Backend -> Frontend

### Backend Implementation Complete
All backend tasks (steps 1–11 of the implementation order) are done. TypeScript compiles with zero errors.

Files created/updated:
- `apps/web/prisma/schema.prisma` — Added `DevStatus`, `NotificationType` enums; `Notification` model; `devStatus`, `currentTask`, `notifications` fields to `User`; `notifications` relation to `Ticket`
- `apps/web/lib/sse-emitter.ts` — NEW: Global EventEmitter singleton
- `apps/web/lib/notifications.ts` — NEW: `getNotificationTargets` + `createAndEmitNotifications`
- `apps/web/app/api/sse/route.ts` — Implemented SSE stream
- `apps/web/app/api/notifications/route.ts` — Implemented GET
- `apps/web/app/api/notifications/[id]/read/route.ts` — Implemented PATCH
- `apps/web/app/api/notifications/read-all/route.ts` — NEW: PATCH all
- `apps/web/app/api/users/[id]/notifications/route.ts` — Implemented GET/PATCH
- `apps/web/app/api/users/me/status/route.ts` — NEW: PATCH devStatus/currentTask
- `apps/web/app/api/tickets/route.ts` — Wired TICKET_CREATED / BUG_CREATED notifications
- `apps/web/app/api/tickets/[id]/route.ts` — Wired TICKET_STATUS_CHANGED / TICKET_DONE / TICKET_CANCELLED
- `apps/web/app/api/tickets/[id]/assign/route.ts` — Wired TICKET_ASSIGNED notifications
- `apps/web/lib/types.ts` — Added `devStatus` and `currentTask` to `SafeUser`

### Prisma Migration
Migration `20260406030430_phase3_notifications_devstatus` has been applied. Run `npx prisma generate` if you reset the DB.

**Important:** The root `node_modules/.prisma/client` must be kept in sync with `apps/web/node_modules/.prisma/client` (both were updated). If you re-run `prisma generate`, copy the output again: `cp -r apps/web/node_modules/.prisma/client/* node_modules/.prisma/client/`

### SSE Event Format
Events are sent as SSE `data:` lines with JSON payloads:
```
data: {"type":"notification:new","payload":{...notification object...}}

data: {"type":"developer:status_changed","payload":{"userId":"...","devStatus":"ACTIVE","currentTask":"..."}}

data: {"type":"ticket:assigned","payload":{...ticket + assignee info...}}
```

Heartbeat sent every 25s as SSE comment: `": heartbeat\n\n"`

### API Endpoints (final shapes)

#### `GET /api/sse`
- Auth required. Returns `text/event-stream`.
- Filters `notification:new` to matching `userId` only.
- Filters `developer:status_changed` to DEVELOPER/TECH_LEAD roles only.

#### `GET /api/notifications?limit=N&unread=true`
Returns:
```typescript
{
  notifications: Array<{
    id: string
    userId: string
    type: "TICKET_CREATED" | "BUG_CREATED" | "TICKET_ASSIGNED" | "TICKET_STATUS_CHANGED" | "TICKET_DONE" | "TICKET_CANCELLED"
    title: string
    body: string
    ticketId: string | null
    isRead: boolean
    createdAt: string // ISO date
    ticket: { publicId: string } | null
  }>
  unreadCount: number
}
```
- `limit`: 1–50, default 20
- `unread=true`: filter to unread only (unreadCount still reflects total unread regardless of filter)

#### `PATCH /api/notifications/[id]/read`
Returns:
```typescript
{ notification: { ...full notification with ticket: { publicId } } }
```
- 403 if `notification.userId !== session.userId`
- 404 if not found

#### `PATCH /api/notifications/read-all`
Returns:
```typescript
{ count: number } // number of records updated
```

#### `GET /api/users/[id]/notifications`
TECH_LEAD only. Returns:
```typescript
{ notifyTickets: boolean, notifyBugs: boolean }
```

#### `PATCH /api/users/[id]/notifications`
TECH_LEAD only. Body: `{ notifyTickets?: boolean, notifyBugs?: boolean }`. Returns same shape.

#### `PATCH /api/users/me/status`
DEVELOPER or TECH_LEAD only. Body:
```typescript
{ devStatus?: "ACTIVE" | "IN_CHECKPOINT" | "BLOCKED" | "HELPING", currentTask?: string }
```
Returns: `{ devStatus: string | null, currentTask: string | null }`
Also emits `developer:status_changed` SSE event.

### Notification Object Shape
```typescript
{
  id: string
  userId: string
  type: "TICKET_CREATED" | "BUG_CREATED" | "TICKET_ASSIGNED" | "TICKET_STATUS_CHANGED" | "TICKET_DONE" | "TICKET_CANCELLED"
  title: string
  body: string
  ticketId: string | null
  isRead: boolean
  createdAt: string // ISO date
  ticket: { publicId: string } | null
}
```

### SafeUser Type (updated)
`apps/web/lib/types.ts` — `SafeUser` now includes:
```typescript
devStatus: "ACTIVE" | "IN_CHECKPOINT" | "BLOCKED" | "HELPING" | null
currentTask: string | null
```

### NinjaBoard Query Support
`GET /api/users?role=DEVELOPER&isActive=true` already supports role/isActive filters from Phase 2. However, the response does NOT currently include `devStatus`, `currentTask`, or the user's active assigned ticket. The frontend will need these for the Ninja Board developer cards.

**Frontend action required:** Either the frontend fetches additional data per card, or a backend endpoint specifically for Ninja Board data can be added in a follow-up. The simplest approach: update `GET /api/users` response to include `devStatus` and `currentTask` (currently the `userSelect` constant in that route omits them).

### Schema Deviations from Plan
None. Implementation matches the spec exactly.

## Frontend -> Backend
- Frontend expects all date fields as ISO strings in JSON responses
- Frontend expects notification objects to include `ticket.publicId` when ticketId is present (for navigation to `/ticket/{publicId}`) — **confirmed, backend includes this**
- NinjaBoard needs `GET /api/users?role=DEVELOPER&isActive=true` to return users with `devStatus`, `currentTask`, and their first active assigned ticket -- **see note above in NinjaBoard Query Support section**

## Frontend Implementation Notes (Phase 3 Complete — 2026-04-06)

### Files Implemented
- `apps/web/hooks/use-sse.ts` — EventSource + exponential backoff (max 30s, 10 retries), handlerRef pattern
- `apps/web/lib/sse-context.tsx` — SSEProvider + useSSEContext (fan-out to Set<Subscriber>)
- `apps/web/hooks/use-sound-alerts.ts` — Web Audio API oscillators, 5 tones, lazy AudioContext
- `apps/web/hooks/use-notifications.ts` — fetch + SSE subscription + markRead/markAllRead
- `apps/web/components/layout/app-shell.tsx` — Wrapped with SSEProvider
- `apps/web/components/layout/notification-center.tsx` — Bell + Popover + sound alerts
- `apps/web/components/layout/header.tsx` — Replaced static bell with NotificationCenter
- `apps/web/components/dev/developer-card.tsx` — Full interactive card (status dropdown, inline task edit)
- `apps/web/components/dev/ninja-board.tsx` — SSE-reactive grid, stats bar
- `apps/web/app/(protected)/dev/page.tsx` — Server component (Prisma query, serialize to DevCardData[])
- `apps/web/components/admin/notification-routing.tsx` — Table + Switch toggles, parallel pref fetch
- `apps/web/app/(protected)/admin/notifications/page.tsx` — Admin page rendering NotificationRouting

### Known Gaps / Follow-up
- `GET /api/users?role=DEVELOPER` does NOT return `devStatus`, `currentTask`, or `assignedTickets`. The NinjaBoard's `refetchDevs()` function calls this endpoint but will receive incomplete data. A backend update to the users route is needed to include these fields for refetch to work correctly. Initial page load uses server-side Prisma which includes all fields.
- The `GET /api/users` response shape is assumed to include `{ users: [...] }` — verify this matches the actual backend implementation.

### TypeScript: zero errors, lint: zero errors (warnings only from pre-existing files)
