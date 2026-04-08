# Frontend Task: Enable QA Ticket Assignment UI

## Description

The notification flow for ticket creation and assignment is fully wired on the backend. However, the QA role is missing from the frontend UI for ticket assignment. QA users need the ability to assign tickets to developers from the ticket detail page so that the existing backend notification flow (TICKET_ASSIGNED -> developer gets persistent notification with sound + browser alert) actually gets triggered by QA actions.

Currently, only TECH_LEAD users see the "Responsavel" (assignee) dropdown in the TicketActions component. QA users see nothing — the component returns null for them. The backend assign endpoint already accepts QA role (requireRole("DEVELOPER", "TECH_LEAD", "QA")), so only the frontend needs to change.

## Acceptance Criteria

- [ ] QA users can see and use the ticket assignment dropdown on the ticket detail page (`/ticket/[publicId]`)
- [ ] QA users can assign an unassigned ticket to any active DEVELOPER or TECH_LEAD
- [ ] QA users can reassign a ticket that is already assigned to a different developer
- [ ] QA users CANNOT change ticket status, severity, or deadline (those remain TECH_LEAD only)
- [ ] The assignment dropdown shows all active developers (same list that TECH_LEAD currently sees)
- [ ] After assignment, the page refreshes and the assigned developer receives a persistent notification (existing backend behavior)
- [ ] Developers can still self-assign unassigned tickets via the "Atribuir a mim" button (no regression)
- [ ] TECH_LEAD retains full capabilities (status, severity, deadline, reassign) — no regression

## Pages / Components to Modify

### 1. `apps/web/app/(protected)/ticket/[publicId]/page.tsx` (Server Component)
- Currently fetches the developers list ONLY when `session.role === "TECH_LEAD"` (line 99-106)
- Must also fetch the developers list when `session.role === "QA"`
- The developers query should also include TECH_LEAD users as valid assignment targets (currently only fetches DEVELOPER role)

### 2. `apps/web/components/tickets/ticket-actions.tsx` (Client Component)
- Currently the component returns null if the user is not TECH_LEAD and not a DEVELOPER who can act (line 104-106)
- Must add QA as a role that can see the actions panel
- QA should see ONLY the "Responsavel" (assignee) dropdown — NOT status, severity, or deadline controls
- QA assignment should call the same `handleReassign` function that TECH_LEAD uses (calls `POST /api/tickets/[id]/assign`)

## Mock Data

No mock data needed — this modifies existing UI components that already work with real data.

## Design Reference

- Follow the existing TicketActions component styling (same card container, same Select components from shadcn/ui)
- QA's view should look like a simplified version of TECH_LEAD's action panel: just the "Responsavel" dropdown
- Keep the same label ("Responsavel"), same developer list format (name + ninjaAlias), same "Nao Atribuido" option

## Rules to Follow

- Use existing shadcn/ui Select component from `@workspace/ui/components/select`
- Do not duplicate the handleReassign logic — reuse it
- Keep "use client" directive on TicketActions (already present)
- Server component changes in page.tsx should remain minimal — just extend the role check for developer fetching
- Maintain TypeScript strict mode compliance
- Keep PT-BR labels consistent with existing UI text

## Communication File
N/A (frontend-only task; backend is already complete)
