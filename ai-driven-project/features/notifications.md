# Context: Notifications

**ID**: CTX-FEAT-004  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-INFRA-003, CTX-CORE-002

<!-- @context-meta
{
  "id": "CTX-FEAT-004",
  "category": "feature",
  "dependencies": ["CTX-INFRA-003", "CTX-CORE-002"],
  "tags": ["notifications", "sound", "sse", "alerts", "web-audio", "bell"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

ShinobiOps has a multi-channel notification system: in-app notification center (bell icon with badge), browser notifications, and distinct sound alerts per event type. Delivered via SSE. Tech Lead configures per-developer notification routing.

## Key Information

### Notification Center

- Bell icon in the header with unread count badge
- Clicking a notification navigates to the relevant item
- All roles see their relevant notifications

### Sound Alert Mapping

| Event | Sound | Recipients |
|-------|-------|-----------|
| New Ticket | Tone A — subtle chime | Configured dev team members |
| New Bug | Tone B — urgent tone | Configured dev team members |
| Help Request | Tone C — sharp alert | All devs except requester |
| Checkpoint Reminder | Tone D — soft pulse | Individual dev (own browser) |
| Ticket Done/Cancelled | Tone E — resolution sound | Support opener (own browser) |

### Sound Implementation

- **Web Audio API** for playback
- Sound files bundled in the application (no external fetch)
- Per-user mute toggle in profile settings (client-side)

### Notification Routing (Admin-Configured)

The Tech Lead configures per-developer:
- **Ticket notifications**: toggle on/off
- **Bug notifications**: toggle on/off
- **Help request notifications**: Always sent to all devs (not configurable in v1.0)

### Notification Events by Role

**Support Team receives:**
- Ticket/bug marked as Done → opener notified
- Ticket status changed → opener notified
- Reorder request received → ticket owner notified
- Reorder request approved/declined → requester notified

**Dev Team receives:**
- New ticket arrives → sound + banner (if enabled for that dev)
- New bug arrives → distinct sound + banner (if enabled)
- Help request from teammate → sound + pop-up
- Checkpoint reminder → sound + prompt modal

### Delivery Mechanism

All real-time delivery via SSE (see CTX-INFRA-003). Notifications are also persisted in the `Notification` table for the notification center history.

## Code References

- `apps/web/components/layout/notification-center.tsx` — Bell icon + notification list
- `apps/web/components/layout/header.tsx` — Header containing notification center
- `apps/web/hooks/use-notifications.ts` — Notification state management hook
- `apps/web/hooks/use-sound-alerts.ts` — Web Audio API sound playback hook
- `apps/web/hooks/use-sse.ts` — SSE connection for real-time delivery
- `apps/web/app/api/notifications/route.ts` — Notification CRUD (list, create)
- `apps/web/app/api/notifications/[id]/read/route.ts` — Mark notification as read
- `apps/web/app/api/users/[id]/notifications/route.ts` — Per-user notification config
- `apps/web/components/admin/notification-routing.tsx` — Admin notification config UI
- `apps/web/app/(protected)/admin/notifications/page.tsx` — Admin notifications page

## Related Contexts

- [CTX-INFRA-003 Real-Time](../infrastructure/realtime.md) — SSE transport layer
- [CTX-CORE-002 Data Model](../core/data-model.md) — Notification entity
- [CTX-FEAT-005 Checkpoints](checkpoints.md) — Checkpoint reminder notifications
- [CTX-FEAT-006 Smoke Signals](smoke-signals.md) — Help request notifications

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
