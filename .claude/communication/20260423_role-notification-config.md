# Communication: Role-Based Notification Configuration

## Status
- Backend: [x] Complete
- Frontend: [x] Complete
- QA: [ ] Not started

## Shared Context

This feature adds role-level notification configuration as a layer ABOVE the existing per-user notification preferences. The architecture is:

1. **Role-level gate** (new `RoleNotificationConfig` model): determines if a role CAN receive a given notification type at all
2. **User-level toggle** (existing `notifyTickets` / `notifyBugs` on User): individual opt-in/out within roles that have the gate enabled

Both must be true for a user to receive a creation notification. Assignment notifications only check the role-level gate.

### Roles in the system
TECH_LEAD, DEVELOPER, QA, SUPPORT_LEAD, SUPPORT_MEMBER

### Existing notification infrastructure
- SSE-based real-time delivery via `lib/sse-emitter.ts`
- Persistent notifications (requiresAck) for QA/TECH_LEAD on creation, and for assignee on assignment
- Normal notifications for DEVELOPER on creation
- Sound alerts via Web Audio API
- Notification center with bell icon in header

### Key files both agents need to know
- `apps/web/lib/notifications.ts` -- notification targeting logic (backend modified)
- `apps/web/components/admin/notification-routing.tsx` -- existing per-user config UI (frontend modifies)
- `apps/web/app/(protected)/admin/notifications/page.tsx` -- admin page (frontend modifies)
- `apps/web/prisma/schema.prisma` -- Prisma schema (backend modified)

---

## Backend -> Frontend

### API Endpoints Created

#### GET /api/admin/role-notification-config
- **Auth**: TECH_LEAD only (401 if unauthenticated, 403 if wrong role)
- **Method**: GET
- **Response 200**:
```json
{
  "configs": [
    { "role": "DEVELOPER", "notifyOnCreation": true, "notifyOnAssignment": true },
    { "role": "QA", "notifyOnCreation": true, "notifyOnAssignment": false },
    { "role": "SUPPORT_LEAD", "notifyOnCreation": false, "notifyOnAssignment": false },
    { "role": "SUPPORT_MEMBER", "notifyOnCreation": false, "notifyOnAssignment": false },
    { "role": "TECH_LEAD", "notifyOnCreation": true, "notifyOnAssignment": true }
  ]
}
```
- **Notes**: Ordered alphabetically by role. Automatically provisions missing rows on every GET call (safe to call on page load).

#### PATCH /api/admin/role-notification-config
- **Auth**: TECH_LEAD only (401 if unauthenticated, 403 if wrong role)
- **Method**: PATCH
- **Request body**:
```json
{
  "configs": [
    { "role": "DEVELOPER", "notifyOnCreation": false },
    { "role": "QA", "notifyOnCreation": true, "notifyOnAssignment": true }
  ]
}
```
  - `configs` array is required and must have at least 1 entry.
  - `role` is required per entry; must be one of: `TECH_LEAD`, `DEVELOPER`, `QA`, `SUPPORT_LEAD`, `SUPPORT_MEMBER`.
  - `notifyOnCreation` and `notifyOnAssignment` are both optional booleans. Only provided fields are updated (partial update).
  - You can send a single config or all 5 at once.
- **Response 200** (full list, same shape as GET):
```json
{
  "configs": [
    { "role": "DEVELOPER", "notifyOnCreation": false, "notifyOnAssignment": true },
    ...
  ]
}
```
- **Response 400** on validation failure:
```json
{
  "error": "Validation failed",
  "details": { "configs": ["..."] }
}
```

### Database Changes

- **New model**: `RoleNotificationConfig` — table `role_notification_configs`
- **Fields**: `id` (cuid PK), `role` (Role enum, unique), `notifyOnCreation` (bool), `notifyOnAssignment` (bool), `updatedAt` (DateTime @updatedAt)
- **Migration applied**: yes — `20260423000000_add_role_notification_config`
- **Prisma client regenerated**: yes
- **Seed updated**: yes — `prisma/seed.ts` now upserts all 5 role configs with sensible defaults

### Default values seeded

| Role | notifyOnCreation | notifyOnAssignment |
|------|------------------|--------------------|
| TECH_LEAD | true | true |
| DEVELOPER | true | true |
| QA | true | false |
| SUPPORT_LEAD | false | false |
| SUPPORT_MEMBER | false | false |

### Notification Logic Changes

`getNotificationTargets()` in `apps/web/lib/notifications.ts` was updated:

- **TICKET_CREATED / BUG_CREATED**: Now loads `RoleNotificationConfig` from DB first. Builds a set of eligible roles (those with `notifyOnCreation = true`). Only users in eligible roles AND with personal flag (`notifyTickets` / `notifyBugs`) set to true are targeted. If no roles have creation enabled, returns empty arrays immediately (no DB user query).
- **TICKET_ASSIGNED**: Now fetches the assignee's role, checks `RoleNotificationConfig` for `notifyOnAssignment`. Sends persistent notification to assignee only if their role has `notifyOnAssignment = true`. If the config row is missing (fail-closed), no notification is sent.
- All other notification types (`TICKET_DONE`, `TICKET_CANCELLED`, `TICKET_STATUS_CHANGED`, `HELP_REQUEST_*`, `CHECKPOINT_PROMPT`) are unchanged.

### Important implementation details for frontend

1. **Ordering**: The GET response is ordered alphabetically by role name. Suggest displaying in a fixed order in the UI (e.g., TECH_LEAD first).
2. **Partial PATCH is supported**: You can send just one config entry to update a single role without affecting others. Recommended pattern: send only the changed config on each toggle.
3. **No `id` field in responses**: The API intentionally omits `id` and `updatedAt` from responses (only `role`, `notifyOnCreation`, `notifyOnAssignment`).
4. **The per-user routing section below the role config**: The frontend should filter the per-user routing table to only show users whose role has `notifyOnCreation = true`. This gives visual feedback that users in disabled roles won't receive creation notifications regardless of their personal settings.
5. **Assignment notification column**: The per-user notification table does not have a separate assignment column — assignment notification is role-level only (no per-user override).

---

## Frontend -> Backend

### Implementation notes

- The `/api/users?role=ROLE&isActive=true` endpoint is called once per eligible role in parallel (Promise.all). This means N requests where N = number of roles with notifyOnCreation=true. Currently max 5 calls; acceptable for admin page.
- The per-user notification preferences (`notifyTickets`/`notifyBugs`) are still fetched from `/api/users/[id]/notifications` as before — one request per user, parallel.
- The per-user routing table re-fetches automatically when `eligibleRoles` changes (role toggle flipped in the role config section) — no page reload needed.

### Files created/modified
- `apps/web/components/admin/role-notification-config.tsx` (new)
- `apps/web/components/admin/admin-notifications-content.tsx` (new)
- `apps/web/components/admin/notification-routing.tsx` (modified)
- `apps/web/app/(protected)/admin/notifications/page.tsx` (modified)
