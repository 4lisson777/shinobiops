# Short-Term Memory -- Senior Backend Engineer

## Current Task
Feature: Role-Based Notification Config (20260423_role-notification-config) — Complete

## Files Created / Modified

| File | Action |
|------|--------|
| `apps/web/prisma/schema.prisma` | Updated -- added RoleNotificationConfig model |
| `apps/web/prisma/migrations/20260423000000_add_role_notification_config/migration.sql` | Created -- CREATE TABLE role_notification_configs |
| `apps/web/app/api/admin/role-notification-config/route.ts` | Created -- GET + PATCH endpoints |
| `apps/web/lib/notifications.ts` | Updated -- getNotificationTargets now consults RoleNotificationConfig as primary gate |
| `apps/web/prisma/seed.ts` | Updated -- upserts default configs for all 5 roles |
| `ai-driven-project/features/notifications.md` | Updated -- added role-level gate docs |
| `ai-driven-project/core/data-model.md` | Updated -- added RoleNotificationConfig entity |
| `ai-driven-project/master-context.md` | Updated -- version 3.3.0, updated CTX-FEAT-004 |
| `.claude/communication/20260423_role-notification-config.md` | Updated -- full API docs for frontend |

## DB Actions Applied
- `npx prisma migrate dev` applied migration `20260423000000_add_role_notification_config`
- `npx prisma generate` regenerated Prisma client with `RoleNotificationConfig` model
- `npx prisma db seed` ran seed — 5 role configs upserted with default values
