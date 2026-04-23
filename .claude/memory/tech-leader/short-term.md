# Tech Leader -- Short-Term Memory

## Current Task
- **Name:** Role-Based Notification Configuration
- **Plan folder:** `ai-driven-project/prompt-engineering/20260423_role-notification-config/`
- **Scope:** Full-stack
- **Status:** PLANNED (awaiting backend engineer execution first)

## Key Decisions
- Introducing a new `RoleNotificationConfig` model with per-role toggles for creation and assignment notifications
- Role-level config acts as a primary gate; existing per-user notifyTickets/notifyBugs remain as a secondary toggle
- Both gates must be true for a user to receive creation notifications
- Assignment notifications only check the role-level gate (no per-user override for assignments)
- Default: TECH_LEAD and DEVELOPER get both; QA gets creation only; SUPPORT_LEAD and SUPPORT_MEMBER get neither
- Backend must go first because frontend needs the API endpoints
- Existing NotificationRouting component will be updated to show users from ALL roles that have notifyOnCreation enabled (not just DEVELOPER)

## Architecture Notes
- New model: RoleNotificationConfig with fields role (unique), notifyOnCreation, notifyOnAssignment
- New endpoints: GET + PATCH at /api/admin/role-notification-config (TECH_LEAD only)
- `lib/notifications.ts` getNotificationTargets() must be updated to query RoleNotificationConfig
- Frontend adds new component `role-notification-config.tsx` to admin notifications page
- Communication file at `.claude/communication/20260423_role-notification-config.md`
