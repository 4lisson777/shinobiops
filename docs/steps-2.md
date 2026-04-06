# Phase 2 -- Ticket and Bug Forms, Priority Queue, Status Management

## Goal

Support members can create tickets and bug reports. Both teams can view the priority-ordered Mission Board queue. Developers can assign tickets and update statuses. The ticket detail page with timeline is functional.

---

## Features / Tasks

### 2.1 Prisma Schema -- Ticket, BugReport, TicketEvent, ReorderRequest

Extend the Prisma schema with the following models:

**Ticket:**
- id (UUID)
- publicId (string, unique -- format TKT-XXXX or BUG-XXXX)
- title (string, max 120)
- description (string, rich text)
- type (enum: TICKET, BUG)
- severity (enum: LOW, MEDIUM, HIGH, CRITICAL)
- status (enum: OPEN, IN_PROGRESS, WAITING_FOR_INFO, DONE, CANCELLED)
- deadline (datetime)
- priorityOrder (int -- position in queue)
- openedById (relation to User)
- assignedToId (relation to User, nullable)
- createdAt, updatedAt, resolvedAt (nullable)

**BugReport (one-to-one extension of Ticket where type=BUG):**
- id (UUID)
- ticketId (relation to Ticket)
- affectedModule (string)
- stepsToReproduce (string)
- expectedBehavior (string)
- actualBehavior (string)
- environment (enum: PRODUCTION, STAGING, OTHER)
- customerId (string, nullable)

**TicketEvent:**
- id (UUID)
- ticketId (relation to Ticket)
- eventType (enum: CREATED, STATUS_CHANGED, ASSIGNED, REASSIGNED, SEVERITY_CHANGED, DEADLINE_CHANGED, PRIORITY_REORDERED, REORDER_REQUESTED, REORDER_APPROVED, REORDER_DECLINED, HELP_REQUESTED, CHECKPOINT_MENTION, DONE, CANCELLED)
- actorId (relation to User)
- metadata (JSON)
- createdAt (immutable)

**ReorderRequest:**
- id (UUID)
- ticketId (relation to Ticket)
- requestedById (relation to User)
- requestedPosition (int)
- reason (string, nullable)
- status (enum: PENDING, APPROVED, DECLINED)
- resolvedById (relation to User, nullable)
- resolvedAt (datetime, nullable)
- createdAt

Run migration after schema changes.

### 2.2 Public ID Generation

- Create a utility to generate sequential IDs: `TKT-0001`, `TKT-0002`, `BUG-0001`, etc.
- IDs are zero-padded, 4 digits, auto-incrementing per type
- Query the max existing publicId for the type, increment by 1
- Handle concurrency (use a transaction to prevent duplicates)

### 2.3 Priority Order Calculation

- Create a utility that calculates initial priority order for new tickets:
  - Severity weight: CRITICAL=1, HIGH=2, MEDIUM=3, LOW=4
  - Within same severity, older tickets rank higher (lower priorityOrder number = higher priority)
- When a new ticket is inserted, calculate its position based on severity and shift existing items down as needed
- This is the default ordering; manual reorders override it

### 2.4 Create Ticket Form Page (`/support/ticket/new`)

- Access: SUPPORT_MEMBER, SUPPORT_LEAD
- Form fields: title (max 120 chars), description (textarea), severity (select), deadline (date picker)
- Client-side validation with Zod
- On submit: POST to `/api/tickets`
- Success: redirect to `/support/queue` with success toast
- Error: show validation errors inline

### 2.5 Create Bug Report Form Page (`/support/bug/new`)

- Access: SUPPORT_MEMBER, SUPPORT_LEAD
- Form fields: title, affected module, steps to reproduce (textarea), expected behavior, actual behavior, severity, deadline, environment (select), screenshots/attachments (file upload -- store locally or as base64 in v1), customer name/ID
- Client-side validation with Zod
- "Copy to ClickUp format" button: generates a Markdown block with all fields formatted for pasting into ClickUp
- On submit: POST to `/api/tickets` with `type: BUG` and bug-specific fields
- Success: redirect to `/support/queue`

### 2.6 Ticket CRUD API

**POST `/api/tickets`**
- Validate with Zod (different schemas for TICKET vs BUG type)
- Generate publicId
- Calculate initial priorityOrder
- Create Ticket (and BugReport if type=BUG) in a transaction
- Create a CREATED TicketEvent
- Return 201 with the created ticket

**GET `/api/tickets`**
- Query params: type, severity, status, assignedToId, openedById, search (title/publicId)
- Sort by priorityOrder ascending (default)
- Paginate with cursor or offset
- Return tickets with opener and assignee info

**GET `/api/tickets/[id]`**
- Fetch by internal id or publicId
- Include bug report details if type=BUG
- Include timeline events (ordered by createdAt)
- Include opener and assignee user info

**PATCH `/api/tickets/[id]`**
- Update status, severity, deadline, assignedToId
- Record a TicketEvent for each changed field
- Status transitions: validate allowed transitions
- Assignment: Developers can self-assign (ASSIGNED event); Tech Lead can assign to any dev (ASSIGNED or REASSIGNED event)
- When status changes to DONE or CANCELLED, set resolvedAt

**PATCH `/api/tickets/[id]/assign`**
- Developer self-assigns (sets assignedToId to their own userId, status to IN_PROGRESS)
- Tech Lead assigns to any developer
- Creates ASSIGNED or REASSIGNED TicketEvent
- Returns 403 if developer tries to assign to someone else

### 2.7 Mission Board -- Support View (`/support/queue`)

- Access: SUPPORT_MEMBER, SUPPORT_LEAD
- Display all open/in-progress tickets and bugs in priority order
- Each card shows: publicId (copyable), title, type badge (Ticket/Bug), severity badge (color-coded belt rank), status, deadline, opener name, assignee name (if any)
- Filter by: type (Ticket/Bug/All), severity, status
- Search by publicId or title
- "Request Reorder" button on tickets not owned by the current user (see Phase 4 for full flow -- stub the button here)

### 2.8 Mission Board -- Dev View (`/dev/queue`)

- Access: DEVELOPER, TECH_LEAD
- Same priority-ordered list as support view
- Additional controls:
  - "Assign to me" button on unassigned tickets
  - "Assign to..." dropdown (Tech Lead only) -- select a developer
  - Filter by: type, severity, assignee, status
- When a dev clicks "Assign to me", PATCH the ticket and refresh the list

### 2.9 Ticket Detail Page (`/ticket/[publicId]`)

- Access: all authenticated roles
- Header: publicId (copyable with click), title, type badge, severity badge, current status, opener (name + avatar), assignee (name + avatar), created date, deadline
- Body: full description
- Bug-specific section (if type=BUG): affected module, steps to reproduce, expected/actual behavior, environment, customer ID
- "Copy to ClickUp format" button (bugs only)
- Timeline feed: chronological list of all TicketEvent entries
  - Each event shows: icon, human-readable label, actor name + avatar, date/time
  - Event label examples: "Opened by Ana", "Assigned to Ryu by Jonin Tanaka", "Status changed from Open to In Progress by Ryu"
- Action buttons (role-dependent):
  - Dev: Update status dropdown (allowed transitions only)
  - Tech Lead: Update status, reassign, change severity, change deadline

### 2.10 My Items Page (`/support/my-items`)

- Access: SUPPORT_MEMBER, SUPPORT_LEAD
- Show all tickets and bugs opened by the current user
- Group by status: Open, In Progress, Waiting for Info, Done, Cancelled
- Each item: publicId, title, type, severity, status, assignee, timestamps
- Click navigates to ticket detail page

### 2.11 ClickUp Export Utility

- Create a utility function that takes a bug report object and returns a formatted Markdown string
- Template includes all bug fields in a structured format suitable for ClickUp
- "Copy to ClickUp format" button uses `navigator.clipboard.writeText()` and shows a "Copied!" toast

### 2.12 Zod Validation Schemas

- Create shared validation schemas at `packages/ui/src/lib/schemas/`:
  - `ticketSchema` -- for ticket creation/update
  - `bugReportSchema` -- extends ticket with bug fields
  - `ticketFilterSchema` -- for query params
- Reuse on both client (form validation) and server (API validation)

---

## Acceptance Criteria

- [ ] Prisma schema includes Ticket, BugReport, TicketEvent, and ReorderRequest models; migrations run cleanly
- [ ] Public IDs are generated correctly (TKT-XXXX, BUG-XXXX) with no duplicates
- [ ] A support member can create a ticket with all required fields
- [ ] A support member can create a bug report with all required and optional fields
- [ ] New tickets appear in the Mission Board in correct priority order (severity, then age)
- [ ] A developer can self-assign an unassigned ticket from the dev queue
- [ ] The Tech Lead can assign any ticket to any developer
- [ ] Status transitions are validated (no invalid jumps)
- [ ] Every state change creates an immutable TicketEvent
- [ ] The ticket detail page displays all fields, bug-specific fields (when applicable), and the full timeline
- [ ] "Copy to ClickUp format" produces a well-formatted Markdown string and copies to clipboard
- [ ] The "My Items" page shows the current support user's tickets grouped by status
- [ ] Filters and search work on both Mission Board views
- [ ] All API endpoints enforce role-based access control
- [ ] TypeScript compiles with zero errors; lint passes
