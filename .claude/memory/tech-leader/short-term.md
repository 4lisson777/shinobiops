# Tech Leader -- Short-Term Memory

## Current Task
- **Name:** Ticket Notification Flow (QA Assignment UI)
- **Plan folder:** `ai-driven-project/prompt-engineering/20260408_ticket-notification-flow/`
- **Scope:** Frontend-only
- **Status:** PLANNED (awaiting frontend specialist execution)

## Key Decisions
- Backend is FULLY COMPLETE: ticket creation sends TICKET_CREATED persistent notifications to QA/TECH_LEAD; ticket assignment sends TICKET_ASSIGNED persistent notifications to assigned developer
- The ONLY gap is frontend: QA users cannot assign tickets because TicketActions component excludes QA role
- Backend assign endpoint already accepts QA role (requireRole("DEVELOPER", "TECH_LEAD", "QA"))
- Fix is isolated to two files: ticket detail page (fetch devs for QA too) and TicketActions component (show assignment dropdown for QA)
- QA should ONLY see the assignment dropdown, NOT status/severity/deadline controls (those remain TECH_LEAD only)

## Architecture Notes
- `apps/web/lib/notifications.ts`: getNotificationTargets() + createAndEmitNotificationsForTargets() -- both working correctly
- `apps/web/app/api/tickets/route.ts` POST: fires TICKET_CREATED notifications fire-and-forget -- working
- `apps/web/app/api/tickets/[id]/assign/route.ts` POST: fires TICKET_ASSIGNED notifications fire-and-forget -- working
- `apps/web/hooks/use-persistent-notifications.ts`: handles sound + browser notifications for requiresAck:true -- working
- `apps/web/components/tickets/ticket-actions.tsx`: QA excluded from actions panel (lines 97-106) -- THE GAP
- `apps/web/app/(protected)/ticket/[publicId]/page.tsx`: developers list only fetched for TECH_LEAD (lines 99-106) -- THE GAP
