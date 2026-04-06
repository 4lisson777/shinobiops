# Context: Smoke Signals (Help Requests)

**ID**: CTX-FEAT-006  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002, CTX-FEAT-004

<!-- @context-meta
{
  "id": "CTX-FEAT-006",
  "category": "feature",
  "dependencies": ["CTX-CORE-002", "CTX-FEAT-004"],
  "tags": ["help-request", "smoke-signal", "collaboration", "developer"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

The Smoke Signal system allows any developer to broadcast a help request when stuck. All other devs receive a sound alert and notification with context. A responding dev clicks "I can help", setting their status to `Helping` and notifying the requester.

## Key Information

### Flow

1. Dev clicks "Send Smoke Signal" button (smoke bomb / shuriken icon)
2. Modal prompts for context message (required, max 280 chars)
3. All other developers receive: sound alert (Tone C) + notification banner with context
4. Any dev can click "I can help" → their status changes to `Helping`
5. Requester is notified that someone is coming to help

### Data Model

`HelpRequest` entity:
- `requestedById` → User who needs help
- `contextMessage` — brief description of the problem (max 280 chars)
- `responses` — array of `{ responderId, respondedAt }`

### Ninja Board Integration

- Requester's card may show a visual indicator that they sent a signal
- Responder's status changes to `Helping`
- Both updates are pushed via SSE in real-time

### Notification Routing

- Help request notifications are **always sent to all devs** (not configurable in v1.0)
- Requester is excluded from receiving their own signal

## Code References

- `apps/web/components/dev/smoke-signal-modal.tsx` — Smoke Signal prompt modal
- `apps/web/app/api/help-requests/route.ts` — Create help request
- `apps/web/app/api/help-requests/[id]/respond/route.ts` — Respond to help request

## Related Contexts

- [CTX-FEAT-002 Ninja Board](ninja-board.md) — Status changes to "Helping"
- [CTX-FEAT-004 Notifications](notifications.md) — Sound alert + notification delivery
- [CTX-CORE-002 Data Model](../core/data-model.md) — HelpRequest entity

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
