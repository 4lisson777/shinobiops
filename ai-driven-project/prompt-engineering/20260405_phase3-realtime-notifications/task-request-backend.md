# Backend Task: Phase 3 -- Real-Time Notifications, Sound Alerts Infrastructure, and Developer Status API

## Description
Implement the server-side infrastructure for real-time notifications via SSE, persisted notification records, developer status tracking, and wire notification emission into existing ticket/bug API routes. This is the foundational layer that enables the frontend to display live notifications, play sound alerts, and show developer status on the Ninja Board.

## Acceptance Criteria
- [ ] Prisma schema updated with `Notification` model, `DevStatus` enum, `NotificationType` enum, and new User fields (`devStatus`, `currentTask`, `notifications` relation). Migration runs cleanly.
- [ ] Global SSE EventEmitter singleton exists at `apps/web/lib/sse-emitter.ts` using `globalThis.__sseEmitter` guard pattern (same as `lib/db.ts`)
- [ ] Notification utility at `apps/web/lib/notifications.ts` correctly resolves target users based on notification type and user preferences, bulk-creates Notification rows, and emits SSE events per recipient
- [ ] SSE route at `/api/sse` streams events to authenticated users with 25-second heartbeat, per-user event filtering, and proper cleanup on disconnect
- [ ] `GET /api/notifications` returns paginated notifications for the current user with `unreadCount`
- [ ] `PATCH /api/notifications/[id]/read` marks a single notification as read (ownership-checked)
- [ ] `PATCH /api/notifications/read-all` marks all unread notifications as read for the current user
- [ ] `GET/PATCH /api/users/[id]/notifications` allows TECH_LEAD to view/update notification preferences per user
- [ ] `PATCH /api/users/me/status` allows DEVELOPER/TECH_LEAD to update their `devStatus` and `currentTask`, emitting an SSE event
- [ ] Creating a ticket via `POST /api/tickets` emits `TICKET_CREATED` or `BUG_CREATED` notifications (fire-and-forget)
- [ ] Updating ticket status via `PATCH /api/tickets/[id]` emits `TICKET_STATUS_CHANGED`, `TICKET_DONE`, or `TICKET_CANCELLED` notifications as appropriate
- [ ] Assigning a ticket via `POST /api/tickets/[id]/assign` emits `TICKET_ASSIGNED` notification to the assignee
- [ ] `SafeUser` type in `apps/web/lib/types.ts` includes `devStatus` and `currentTask`
- [ ] `Ticket` model in Prisma has `notifications Notification[]` relation added
- [ ] All new routes follow existing auth/validation patterns: `requireAuth()`, Zod schemas, proper error responses

## API Endpoints

### SSE Stream
- **GET /api/sse** -- Authenticated SSE stream. Returns `text/event-stream`. Sends heartbeat comments every 25s. Filters `notification:new` events to the target userId only. Filters `developer:status_changed` to DEVELOPER/TECH_LEAD roles.

### Notifications
- **GET /api/notifications** -- Returns `{ notifications: Notification[], unreadCount: number }`. Supports `?limit=N` (max 50, default 20) and `?unread=true` filter.
- **PATCH /api/notifications/[id]/read** -- Marks notification as read. Verifies `notification.userId === session.userId`.
- **PATCH /api/notifications/read-all** -- Marks all unread notifications as read for the current user.

### User Notification Preferences
- **GET /api/users/[id]/notifications** -- TECH_LEAD only. Returns `{ notifyTickets, notifyBugs }` for the specified user.
- **PATCH /api/users/[id]/notifications** -- TECH_LEAD only. Updates `{ notifyTickets?, notifyBugs? }` for the specified user.

### Developer Status
- **PATCH /api/users/me/status** -- DEVELOPER or TECH_LEAD only. Body: `{ devStatus?: DevStatus, currentTask?: string }`. Updates the user record and emits `developer:status_changed` SSE event.

## Data Models

### New Enum: DevStatus
Values: `ACTIVE`, `IN_CHECKPOINT`, `BLOCKED`, `HELPING`

### New Enum: NotificationType
Values: `TICKET_CREATED`, `BUG_CREATED`, `TICKET_ASSIGNED`, `TICKET_STATUS_CHANGED`, `TICKET_DONE`, `TICKET_CANCELLED`

### New Model: Notification
Fields: `id` (cuid), `userId`, `type` (NotificationType), `title`, `body`, `ticketId` (optional, relation to Ticket), `isRead` (default false), `createdAt`. Indexed on `[userId, isRead]`. Table name: `notifications`.

### Modified Model: User
Add fields: `devStatus` (DevStatus, optional, default ACTIVE), `currentTask` (String, optional), `notifications` (Notification[] relation).

### Modified Model: Ticket
Add relation: `notifications Notification[]`

## Business Logic

### Notification Targeting (`getNotificationTargets`)
- `TICKET_CREATED` -- All active users with role DEVELOPER or TECH_LEAD where `notifyTickets = true` and `isActive = true`
- `BUG_CREATED` -- All active users with role DEVELOPER or TECH_LEAD where `notifyBugs = true` and `isActive = true`
- `TICKET_DONE` / `TICKET_CANCELLED` -- The ticket's `openedById` user (the support member who created it)
- `TICKET_ASSIGNED` -- The `assignedToId` user
- `TICKET_STATUS_CHANGED` -- The ticket's `openedById` user

### SSE Event Types
- `notification:new` -- Payload includes the full notification object. Filtered: only sent to the notification's target userId.
- `developer:status_changed` -- Payload includes `{ userId, devStatus, currentTask }`. Filtered: only sent to users with DEVELOPER or TECH_LEAD role.
- `ticket:assigned` -- Payload includes basic ticket + assignee info. Sent to DEVELOPER/TECH_LEAD roles.

### SSE Emitter
- Use `globalThis.__sseEmitter` guard pattern (identical to existing `lib/db.ts` pattern for Prisma)
- `setMaxListeners(200)` to support many concurrent SSE connections
- Export `ShinobiEvent` interface: `{ type: string, payload: Record<string, unknown> }`
- Export `emitShinobiEvent(event: ShinobiEvent): void`

### Fire-and-Forget Pattern
When wiring notifications into ticket routes, call `createAndEmitNotifications(...)` without `await` (fire-and-forget with `.catch(console.error)`) so the main request is not blocked by notification creation.

## Rules to Follow
- Auth pattern: use `requireAuth()` from `@/lib/auth` which returns `{ session, error }` -- if error, return it immediately
- DB access: use `db` from `@/lib/db` (Prisma singleton)
- Validation: use Zod schemas, place reusable schemas in `@/lib/schemas/`
- Error responses: follow existing patterns in other API routes (check `apps/web/app/api/tickets/route.ts` for reference)
- All new API routes must check role authorization where specified
- Run `npx prisma migrate dev --name phase3_notifications_devstatus` from `apps/web/` after schema changes

## Communication File
`.claude/communication/phase3-realtime-notifications.md`

## Key Existing Files to Reference
- `apps/web/lib/db.ts` -- globalThis singleton pattern to replicate for SSE emitter
- `apps/web/lib/auth.ts` -- `requireAuth()` pattern
- `apps/web/app/api/tickets/route.ts` -- existing ticket creation route to wire notifications into
- `apps/web/app/api/tickets/[id]/route.ts` -- existing ticket update route
- `apps/web/app/api/tickets/[id]/assign/route.ts` -- existing ticket assign route
- `apps/web/lib/types.ts` -- SafeUser type to update
- `apps/web/prisma/schema.prisma` -- current schema to extend

## Detailed Plan Reference
Full implementation spec: `/home/alisson/.claude/plans/starry-zooming-acorn.md` (steps 1-5 and step 12)
