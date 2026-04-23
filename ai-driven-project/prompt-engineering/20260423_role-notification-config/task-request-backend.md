# Backend Task: Role-Based Notification Configuration

## Description

Create a global, role-level notification configuration system. Currently, notification preferences (notifyTickets, notifyBugs) are per-user fields on the User model, and only DEVELOPER users are shown in the admin notification routing UI. The new feature introduces a `RoleNotificationConfig` model where the TECH_LEAD can configure **per role** whether that role should:

1. Receive live notifications (with sound) when a new ticket/bug is created.
2. Receive a notification when a ticket/bug is assigned to a user of that role.

This replaces the per-user `notifyTickets` / `notifyBugs` fields with a more flexible per-role approach. All five roles (TECH_LEAD, DEVELOPER, QA, SUPPORT_LEAD, SUPPORT_MEMBER) should have a config row.

## Acceptance Criteria

- [ ] A new `RoleNotificationConfig` model exists in the Prisma schema with fields for: role (unique), notifyOnCreation (boolean), notifyOnAssignment (boolean)
- [ ] A seed or migration initializer ensures one config row per role exists with sensible defaults (see Business Logic)
- [ ] GET /api/admin/role-notification-config returns all role configs (TECH_LEAD only)
- [ ] PATCH /api/admin/role-notification-config allows updating one or more role configs in a single request (TECH_LEAD only)
- [ ] The notification targeting logic in `lib/notifications.ts` (`getNotificationTargets`) is updated to consult `RoleNotificationConfig` instead of (or in addition to) the per-user notifyTickets/notifyBugs flags
- [ ] For TICKET_CREATED / BUG_CREATED: only users whose role has `notifyOnCreation = true` AND whose personal per-user flag (notifyTickets / notifyBugs) is true should receive the notification. The role-level config acts as a "gate" -- if the role has notifyOnCreation disabled, no user of that role gets creation notifications regardless of their personal preference.
- [ ] For TICKET_ASSIGNED: only if the assignee's role has `notifyOnAssignment = true` should the assigned user receive the assignment notification
- [ ] The per-user notifyTickets / notifyBugs fields on User remain as a secondary, user-level toggle (the role config is the primary gate)
- [ ] Zod validation on the PATCH endpoint
- [ ] All existing notification flows (ticket creation, bug creation, ticket assignment) continue to work correctly with the new layered approach

## API Endpoints

### GET /api/admin/role-notification-config
- **Method**: GET
- **Auth**: TECH_LEAD only
- **Purpose**: Returns all role notification configs
- **Response shape**: `{ configs: Array<{ role, notifyOnCreation, notifyOnAssignment }> }`

### PATCH /api/admin/role-notification-config
- **Method**: PATCH
- **Auth**: TECH_LEAD only
- **Purpose**: Update one or more role configs
- **Request body shape**: `{ configs: Array<{ role, notifyOnCreation?, notifyOnAssignment? }> }`
- **Response shape**: `{ configs: Array<{ role, notifyOnCreation, notifyOnAssignment }> }`

## Data Models

### New Model: RoleNotificationConfig
- `id` (String, cuid, PK)
- `role` (Role enum, unique) -- one row per role
- `notifyOnCreation` (Boolean, default varies by role)
- `notifyOnAssignment` (Boolean, default varies by role)
- `updatedAt` (DateTime, @updatedAt)

Table name: `role_notification_configs`

### Default Values per Role

| Role | notifyOnCreation | notifyOnAssignment |
|------|------------------|--------------------|
| TECH_LEAD | true | true |
| DEVELOPER | true | true |
| QA | true | false |
| SUPPORT_LEAD | false | false |
| SUPPORT_MEMBER | false | false |

Rationale: TECH_LEAD and DEVELOPER are the primary recipients of new ticket notifications and assignment notifications. QA receives creation notifications (for triage) but is not typically assigned tickets. Support roles create tickets but do not receive creation/assignment notifications by default (they receive status-change notifications instead).

## Business Logic

### Notification Targeting Update

The `getNotificationTargets` function in `lib/notifications.ts` must be updated:

**For TICKET_CREATED / BUG_CREATED:**
1. First, load all `RoleNotificationConfig` rows where `notifyOnCreation = true` to get the list of eligible roles.
2. Then query users whose role is in that eligible list AND whose personal flag (notifyTickets for TICKET_CREATED, notifyBugs for BUG_CREATED) is true AND who are active.
3. Apply the existing persistent vs normal split (QA + TECH_LEAD = persistent, DEVELOPER = normal).

**For TICKET_ASSIGNED:**
1. Load the assigned user's role.
2. Check `RoleNotificationConfig` for that role to see if `notifyOnAssignment` is true.
3. If yes, send the persistent notification to the assignee. If no, skip.

### Seed / Migration

- Add a Prisma migration for the new model.
- In the seed file (`prisma/seed.ts`), ensure default configs are upserted for all roles.
- Also add a runtime "ensure defaults exist" check in the GET endpoint (or a utility function) so that if new roles are added to the enum without re-seeding, configs are auto-created.

### Edge Cases

- If a RoleNotificationConfig row is missing for a role, treat it as if both flags are false (fail-closed).
- If all roles have notifyOnCreation = false, no creation notifications are sent (this is valid).
- The existing per-user notification config admin page and API (`/api/users/[id]/notifications`) should continue to work. The role-level config is an additional layer.

## Rules to Follow

- Use requireRole("TECH_LEAD") for all admin endpoints.
- Validate with Zod schemas.
- Follow existing API patterns (NextRequest/NextResponse, JSON responses, error objects).
- Use db (Prisma) from @/lib/db.
- Keep the notification targeting function efficient -- avoid N+1 queries.
- The UI is PT-BR but API responses and code are EN-US.

## Communication File

`.claude/communication/20260423_role-notification-config.md`
