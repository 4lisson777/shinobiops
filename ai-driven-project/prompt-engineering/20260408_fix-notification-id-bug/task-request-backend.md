# Backend Task: Fix Notification ID Missing from SSE Payload

## Description

Critical bug: `createAndEmitNotifications()` in `apps/web/lib/notifications.ts` uses `db.notification.createMany()` which does not return inserted IDs in Prisma with SQLite. The SSE payload is emitted without a real notification `id`. This causes the frontend to generate fake IDs like `pending-1234`, making the acknowledge endpoint (`PATCH /api/notifications/[id]/acknowledge`) return 404. Notifications reappear on every page load indefinitely for QA and TECH_LEAD users.

## Acceptance Criteria

- [ ] `createAndEmitNotifications()` returns real DB `id` values in the SSE payload for every notification
- [ ] Each SSE `notification:new` event payload includes the `id` field matching the database record
- [ ] The frontend fallback `pending-${Date.now()}` path is never triggered under normal operation
- [ ] TypeScript compiles cleanly (`npm run typecheck` passes)
- [ ] No regressions in the `createAndEmitNotificationsForTargets` wrapper function

## Fix Location

**File:** `apps/web/lib/notifications.ts`
**Function:** `createAndEmitNotifications` (lines 125-152)

## Required Change

Replace `db.notification.createMany()` with individual `db.notification.create()` calls in a loop so that each call returns the created record's `id`. Include that `id` in the `emitShinobiEvent` payload.

Keep the loop sequential (not `Promise.all`) to avoid overwhelming SQLite with concurrent writes. The number of target users per notification event is small (typically 1-5), so sequential is acceptable.

## Low-Priority Cleanup

Delete the dead file `apps/web/public/message_24.mp3` (82 KB). It is not referenced by any source code -- only mentioned in QA memory files.

## Business Logic

- The `createAndEmitNotificationsForTargets` wrapper calls `createAndEmitNotifications` twice (normal + persistent). Both calls benefit from this fix automatically.
- No changes needed to any API routes, the frontend hook, or the SSE emitter -- they already handle `id` in the payload correctly.

## Rules to Follow

- No rules directory exists. Follow existing code conventions in the file.
- Keep the function signature and interface unchanged.
- Do not add new dependencies.

## Communication File

N/A (backend-only fix, no multi-agent coordination needed)
