# Context: Ninja Board

**ID**: CTX-FEAT-002  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002, CTX-INFRA-003

<!-- @context-meta
{
  "id": "CTX-FEAT-002",
  "category": "feature",
  "dependencies": ["CTX-CORE-002", "CTX-INFRA-003"],
  "tags": ["ninja-board", "dev-team", "status", "tv-mode", "real-time"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

The Ninja Board is the primary real-time dashboard for the dev team, showing every developer as a card with their current status, assigned ticket, and task description. Includes an interactive version for devs and a read-only TV mode for office displays.

## Key Information

### Developer Card

Each card displays:
- Avatar (or initials fallback)
- Name + ninja alias
- **Current task** — free-text field, dev-editable at any time
- Assigned ticket/bug (title + severity badge)
- Status indicator: `Active` | `In Checkpoint` | `Blocked` | `Helping`

### Developer Status Update

Devs can click their own card anytime to update:
- Current task text (primary "what I'm doing now" signal)
- Status (Active, Blocked, etc.)
- No need to wait for a checkpoint

### TV Mode

Route: `/dev/tv` — public (no auth), internal network only.

Characteristics:
- Read-only, full-screen, no interactive controls
- Auto-refreshes every 30s (or live via SSE)
- Shows all dev cards + live count of open tickets/bugs by severity at top
- Minimal chrome — no header, sidebar, or notifications
- Tech Lead can enable/disable from Admin Dashboard

### Real-Time Updates

The Ninja Board receives live updates via SSE (Server-Sent Events):
- Developer status changes
- New ticket/bug assignments
- Checkpoint responses
- Help request status changes

## Code References

- `apps/web/app/(protected)/dev/page.tsx` — Ninja Board page (interactive)
- `apps/web/app/(public)/dev/tv/page.tsx` — TV mode page (read-only)
- `apps/web/components/dev/ninja-board.tsx` — Main board component
- `apps/web/components/dev/developer-card.tsx` — Individual dev card
- `apps/web/components/tv/tv-board.tsx` — TV mode board component
- `apps/web/hooks/use-sse.ts` — SSE connection hook for live updates

## Related Contexts

- [CTX-INFRA-003 Real-Time](../infrastructure/realtime.md) — SSE implementation details
- [CTX-FEAT-005 Checkpoints](checkpoints.md) — Status Scroll updates dev cards
- [CTX-FEAT-006 Smoke Signals](smoke-signals.md) — Help requests change dev status to "Helping"
- [CTX-CORE-002 Data Model](../core/data-model.md) — User entity with status fields

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
