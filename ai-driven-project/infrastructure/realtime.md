# Context: Real-Time (SSE)

**ID**: CTX-INFRA-003  
**Category**: Infrastructure  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-003

<!-- @context-meta
{
  "id": "CTX-INFRA-003",
  "category": "infrastructure",
  "dependencies": ["CTX-CORE-003"],
  "tags": ["sse", "server-sent-events", "real-time", "streaming", "eventsource"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

Real-time updates are delivered via Server-Sent Events (SSE) over standard HTTP. No WebSocket infrastructure needed. The browser's `EventSource` API handles connection, reconnection, and message parsing. Used for notifications, Ninja Board updates, and checkpoint reminders.

## Key Information

### Architecture

- **Server**: Next.js API route at `/api/sse` creates a readable stream
- **Client**: `EventSource` browser API connects to the SSE endpoint
- **Authentication**: SSE endpoint validates session before streaming
- **Reconnection**: Handled automatically by browser's EventSource

### Event Types Streamed

| Event | Payload | Recipients |
|-------|---------|-----------|
| `ticket:new` | Ticket data | Configured dev team members |
| `bug:new` | Bug data | Configured dev team members |
| `ticket:status` | Ticket ID + new status | Opener + assignee |
| `ticket:assigned` | Ticket ID + assignee | All connected clients |
| `help:request` | HelpRequest data | All devs except requester |
| `help:response` | Responder info | Requester |
| `checkpoint:remind` | Config data | Individual dev |
| `checkpoint:response` | Checkpoint data | All connected clients (Ninja Board) |
| `dev:status` | Dev status update | All connected clients |

### Client-Side Hook

The `use-sse` hook manages:
- Connection lifecycle (connect on mount, disconnect on unmount)
- Event listener registration per event type
- Automatic reconnection on connection loss
- Integration with notification and sound alert hooks

### Fallback Strategy

If SSE is unavailable (browser limitation, proxy issue):
- Graceful degradation to polling
- TV mode uses 30-second auto-refresh as fallback

### Performance Targets

- Notification delivery: < 1 second from triggering event
- Connection overhead: minimal — single long-lived HTTP connection per client

## Code References

- `apps/web/app/api/sse/route.ts` — SSE streaming endpoint
- `apps/web/hooks/use-sse.ts` — Client-side SSE connection hook
- `apps/web/hooks/use-notifications.ts` — Consumes SSE events for notification center
- `apps/web/hooks/use-sound-alerts.ts` — Plays sounds on SSE events

## Related Contexts

- [CTX-FEAT-004 Notifications](../features/notifications.md) — Notification delivery via SSE
- [CTX-FEAT-002 Ninja Board](../features/ninja-board.md) — Live dev status updates via SSE
- [CTX-CORE-003 Authentication](../core/authentication.md) — SSE endpoint requires valid session

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
