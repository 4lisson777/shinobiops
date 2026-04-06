# Context: Mission Board

**ID**: CTX-FEAT-001  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002, CTX-FEAT-003

<!-- @context-meta
{
  "id": "CTX-FEAT-001",
  "category": "feature",
  "dependencies": ["CTX-CORE-002", "CTX-FEAT-003"],
  "tags": ["mission-board", "queue", "priority", "reorder", "support", "dev"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

The Mission Board is a shared priority queue of all open tickets and bugs, visible to both support and dev teams with role-specific controls. Items are ordered by severity then creation date, with manual reorder capability via a request/approval flow.

## Key Information

### Priority Ordering

Default sort order:
1. **Severity** (Critical > High > Medium > Low)
2. **Creation date** (oldest first within same severity)
3. **Manual override** via `priorityOrder` field — takes precedence when set

### Views

| View | Route | Roles | Extra Controls |
|------|-------|-------|----------------|
| Support Queue | `/support/queue` | Support Lead, Support Member | Request reorder |
| Dev Queue | `/dev/queue` | Tech Lead, Developer | Assign to me, filter by assignee |

### Dev-Specific Controls

- **Assign to me**: Developer claims a ticket (permanent — cannot self-unassign)
- **Assign to another dev**: Tech Lead only
- **Filters**: By type (Ticket/Bug/All), severity, assignee

### Reorder Request Flow

1. Support member clicks "Request reorder" on a ticket they did not open
2. Dialog prompts for desired position + optional reason
3. Ticket owner receives in-app notification
4. Owner can Approve or Decline
5. If approved: ticket moves, all see updated order
6. If declined: requester notified
7. **Support Lead override**: Can approve/decline any request; direct reorder shows "Reordered by Lead" badge + timestamp

### Ticket Card Display

Each card in the queue shows:
- Public ID (`TKT-XXXX` / `BUG-XXXX`) — copyable
- Title
- Type badge (Ticket vs Bug)
- Severity badge (belt-rank colors)
- Status
- Opener name
- Assignee (if any)
- Deadline
- Created timestamp

## Code References

- `apps/web/app/(protected)/support/queue/page.tsx` — Support queue page
- `apps/web/app/(protected)/dev/queue/page.tsx` — Dev queue page
- `apps/web/components/mission-board/mission-board.tsx` — Main board component
- `apps/web/components/mission-board/ticket-card.tsx` — Individual ticket card
- `apps/web/components/mission-board/mission-board-filters.tsx` — Filter controls
- `apps/web/components/mission-board/reorder-request-dialog.tsx` — Reorder dialog
- `apps/web/app/api/tickets/[id]/reorder/route.ts` — Reorder API
- `apps/web/app/api/reorder-requests/route.ts` — Reorder request CRUD
- `apps/web/app/api/reorder-requests/[id]/route.ts` — Approve/decline reorder

## Related Contexts

- [CTX-FEAT-003 Ticket Lifecycle](ticket-lifecycle.md) — Ticket statuses and CRUD
- [CTX-CORE-002 Data Model](../core/data-model.md) — Ticket and ReorderRequest entities
- [CTX-FEAT-004 Notifications](notifications.md) — Reorder request notifications

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
