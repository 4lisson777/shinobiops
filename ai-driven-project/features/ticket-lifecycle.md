# Context: Ticket Lifecycle

**ID**: CTX-FEAT-003  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002

<!-- @context-meta
{
  "id": "CTX-FEAT-003",
  "category": "feature",
  "dependencies": ["CTX-CORE-002"],
  "tags": ["ticket", "bug", "lifecycle", "status", "timeline", "crud", "clickup"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

Covers the full lifecycle of tickets and bugs: creation forms, status transitions, assignment, the immutable event timeline, detail pages, and ClickUp export for bugs. Two entry points — ticket form and bug report form — feed into a unified priority queue.

## Key Information

### Ticket Creation

**Ticket form** (`/support/ticket/new`):
- Title (max 120 chars, required)
- Description (rich text, required)
- Severity (Low/Medium/High/Critical, required)
- Deadline (date picker, required)
- Attachments (optional)

**Bug report form** (`/support/bug/new`):
- All ticket fields plus:
- Affected module/screen (required)
- Steps to reproduce (numbered list, required)
- Expected behavior (required)
- Actual behavior (required)
- Environment (Production/Staging/Other, required)
- Customer name or ID (optional)

### On Submit Behavior

- Status set to `OPEN`
- `publicId` auto-generated: `TKT-XXXX` or `BUG-XXXX`
- Inserted into priority queue by severity then creation time
- Sound + visual notification fires on dev team views

### Status Transitions

```
OPEN → IN_PROGRESS    (dev assigns/starts)
OPEN → CANCELLED      (any authorized user)
IN_PROGRESS → WAITING_FOR_INFO  (dev needs info)
IN_PROGRESS → DONE    (dev resolves)
IN_PROGRESS → CANCELLED
WAITING_FOR_INFO → IN_PROGRESS  (info received)
```

### Assignment Rules

- **Assign to me**: Any developer (permanent — cannot self-unassign)
- **Reassign**: Tech Lead only
- Assignment triggers `ASSIGNED` or `REASSIGNED` timeline event

### Immutable Timeline (TicketEvent)

Every state change is recorded as an immutable `TicketEvent` with:
- Event type (see CTX-CORE-002 for full enum)
- Actor (who performed the action)
- Metadata (JSON: old/new values)
- Timestamp (never modified)

### Ticket Detail Page

Route: `/ticket/:publicId` (e.g., `/ticket/TKT-0042`)

Content:
- Header: public ID (copyable), title, type/severity badges, status, opener, assignee, dates
- Full description; for bugs: all bug-specific fields
- ClickUp export button (bugs only)
- Chronological timeline feed of all events

### ClickUp Export (Bugs Only)

"Copy to ClickUp format" button generates a pre-formatted Markdown block with all bug fields for pasting into ClickUp. No API integration — copy-to-clipboard only.

### My Items Page

Route: `/support/my-items` — personal history of all tickets/bugs opened by the user, grouped by status.

## Code References

- `apps/web/app/(protected)/support/ticket/new/page.tsx` — New ticket page
- `apps/web/app/(protected)/support/bug/new/page.tsx` — New bug page
- `apps/web/app/(protected)/support/my-items/page.tsx` — My items page
- `apps/web/app/(protected)/ticket/[publicId]/page.tsx` — Ticket detail page
- `apps/web/components/support/ticket-form.tsx` — Ticket creation form
- `apps/web/components/support/bug-form.tsx` — Bug report form
- `apps/web/components/support/my-items-list.tsx` — Personal history list
- `apps/web/components/ticket/ticket-detail.tsx` — Detail view component
- `apps/web/components/ticket/ticket-header.tsx` — Detail page header
- `apps/web/components/ticket/ticket-timeline.tsx` — Timeline feed component
- `apps/web/app/api/tickets/route.ts` — Ticket CRUD (list, create)
- `apps/web/app/api/tickets/[id]/route.ts` — Ticket CRUD (get, update)
- `apps/web/app/api/tickets/[id]/assign/route.ts` — Assignment endpoint
- `apps/web/app/api/tickets/[id]/events/route.ts` — Timeline events endpoint
- `apps/web/app/api/bugs/route.ts` — Bug CRUD (list, create)
- `apps/web/app/api/bugs/[id]/route.ts` — Bug CRUD (get, update)
- `apps/web/app/api/bugs/[id]/clickup-export/route.ts` — ClickUp format export

## Related Contexts

- [CTX-CORE-002 Data Model](../core/data-model.md) — Ticket, BugReport, TicketEvent entities
- [CTX-FEAT-001 Mission Board](mission-board.md) — Queue display and reorder flow
- [CTX-FEAT-004 Notifications](notifications.md) — Ticket status change notifications

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
