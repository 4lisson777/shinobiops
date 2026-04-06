# Phase 4 -- Help Requests, Checkpoints, Reorder Request Flow

## Goal

Complete the collaboration loop: developers can send help requests (Smoke Signals), the checkpoint system (Status Scroll) prompts devs at intervals, and the priority reorder request flow is fully functional for support members.

---

## Features / Tasks

### 4.1 Prisma Schema -- HelpRequest and HelpResponse

**HelpRequest:**
- id (UUID)
- requestedById (relation to User)
- contextMessage (string, max 280 chars)
- ticketId (relation to Ticket, nullable -- optional reference to what they're stuck on)
- status (enum: OPEN, RESPONDED, CLOSED)
- createdAt

**HelpResponse:**
- id (UUID)
- helpRequestId (relation to HelpRequest)
- responderId (relation to User)
- respondedAt (datetime)

Run migration.

### 4.2 Smoke Signal -- Help Request UI

- "Send Smoke Signal" button visible on the Ninja Board and in the header for developers
- Icon: smoke bomb or shuriken motif
- Clicking opens a modal:
  - Context message (required, max 280 chars) -- "What are you stuck on?"
  - Optional: link to a ticket (dropdown of the dev's assigned tickets)
  - Submit button
- On submit: POST to `/api/help-requests`

### 4.3 Help Request API

**POST `/api/help-requests`**
- Access: DEVELOPER, TECH_LEAD
- Validate with Zod (contextMessage required, max 280)
- Create HelpRequest record
- Create a Notification for every other developer (all devs except the requester)
- Broadcast via SSE: `HELP_REQUEST` event with requester info and context message
- If a ticketId is provided, create a HELP_REQUESTED TicketEvent
- Play Tone C on recipient clients
- Return 201

**GET `/api/help-requests`**
- Returns recent help requests (last 24 hours or configurable)
- Include requester info, responses, status

**POST `/api/help-requests/[id]/respond`**
- Access: DEVELOPER, TECH_LEAD (not the requester)
- Create a HelpResponse record
- Update HelpRequest status to RESPONDED
- Set the responder's developer status to HELPING
- Notify the requester via SSE: "Ryu is coming to help!"
- Return 200

### 4.4 Help Request Notification on Ninja Board

- When a Smoke Signal arrives via SSE:
  - Show a prominent pop-up/overlay on the Ninja Board with the requester's name, avatar, and context message
  - "I can help" button on the pop-up -- clicking triggers POST `/api/help-requests/[id]/respond`
  - The pop-up remains until dismissed or until someone responds
- The requester's card on the Ninja Board shows a visual indicator that they've sent a help request

### 4.5 Checkpoint (Status Scroll) -- Schema and Config

**CheckpointConfig** (already in schema from section 9):
- id (single global record)
- intervalMinutes (int, min 30, max 480)
- activeHoursStart (string, e.g. "08:00")
- activeHoursEnd (string, e.g. "18:00")
- isEnabled (boolean)

**Checkpoint:**
- id (UUID)
- userId (relation to User)
- currentTask (string)
- isBlocked (boolean)
- notes (string, nullable)
- createdAt

Run migration. Seed a default CheckpointConfig (intervalMinutes=60, 08:00-18:00, enabled=false).

### 4.6 Checkpoint Scheduler

- Create a server-side scheduler that runs on an interval:
  - Read CheckpointConfig from the database
  - If enabled and current time is within active hours:
    - For each active developer, check if a checkpoint prompt is due (last checkpoint createdAt + interval < now)
    - Send a CHECKPOINT notification via SSE to that developer
    - Play Tone D on the developer's client
- Implementation options:
  - Use a `setInterval` in a singleton module that runs alongside the Next.js server
  - Or use an API route `POST /api/checkpoints/trigger` called by a cron job
  - Keep it simple -- the interval approach works fine for an internal tool

### 4.7 Checkpoint Prompt UI

- When a CHECKPOINT SSE event arrives on the developer's client:
  - Play Tone D
  - Show a modal dialog that cannot be easily dismissed:
    - "Status Scroll -- What are you working on?"
    - Current task (text input, pre-filled with their existing currentTask)
    - Blocked? (yes/no toggle)
    - Notes (optional textarea)
    - Submit button
  - On submit: POST to `/api/checkpoints`
  - If no response within 10 minutes, the developer's Ninja Board card shows "No response" indicator

### 4.8 Checkpoint API

**POST `/api/checkpoints`**
- Access: DEVELOPER
- Validate with Zod
- Create Checkpoint record
- Update the developer's currentTask and currentStatus (set to BLOCKED if isBlocked=true, ACTIVE otherwise)
- Broadcast developer status update via SSE
- Return 201

**GET `/api/checkpoints`**
- Access: TECH_LEAD
- Query params: userId, from (date), to (date)
- Returns checkpoint history for a developer or all developers
- Used by the admin checkpoint log page (Phase 5)

### 4.9 "No Response" Indicator

- Track when a checkpoint notification was sent (store in memory or a lightweight DB record)
- If 10 minutes pass without a POST to `/api/checkpoints` from that developer, broadcast a status update setting their card to "No Response"
- The Ninja Board card shows a warning badge: "No Response" with a timestamp
- The indicator clears once the developer submits a checkpoint or manually updates their status

### 4.10 Reorder Request Flow -- Full Implementation

This was stubbed in Phase 2. Now implement the complete flow.

**Request a Reorder:**
- Support member clicks "Request Reorder" on a ticket they did not open
- A dialog appears: target position (number input or drag target), reason (optional textarea)
- On submit: POST to `/api/tickets/[id]/reorder-request`

**POST `/api/tickets/[id]/reorder-request`**
- Access: SUPPORT_MEMBER, SUPPORT_LEAD
- Validate: requestedPosition (int), reason (string, optional)
- Create a ReorderRequest with status PENDING
- Create a REORDER_REQUESTED TicketEvent
- Notify the ticket owner (the support member who opened it) via SSE
- Return 201

**Approve/Decline:**
- The ticket owner (or Support Lead) sees a notification with the reorder request
- Clicking the notification or viewing the ticket detail shows the pending request with "Approve" and "Decline" buttons

**POST `/api/reorder-requests/[id]/resolve`**
- Body: `{ action: "APPROVE" | "DECLINE" }`
- Access: the ticket opener OR any user with role SUPPORT_LEAD
- If APPROVE:
  - Update the ticket's priorityOrder to the requested position
  - Shift other tickets' priorities accordingly
  - Update ReorderRequest status to APPROVED, set resolvedAt and resolvedById
  - Create REORDER_APPROVED TicketEvent
  - Notify the requester
  - If resolved by Support Lead, add "Reordered by Lead" metadata to the event
- If DECLINE:
  - Update ReorderRequest status to DECLINED, set resolvedAt and resolvedById
  - Create REORDER_DECLINED TicketEvent
  - Notify the requester
- Broadcast queue update via SSE so all Mission Board viewers see the new order

**GET `/api/tickets/[id]/reorder-requests`**
- Returns all reorder requests for a ticket (with status)
- Used on the ticket detail page to show pending/resolved requests

### 4.11 Support Lead Direct Reorder

- The Support Lead has an additional "Reorder" action on any ticket in the queue
- This bypasses the request flow -- the lead can directly change a ticket's priority position
- Creates a PRIORITY_REORDERED TicketEvent with metadata `{ reorderedByLead: true }`
- The ticket in the queue shows a "Reordered by Lead" badge with timestamp
- Broadcasts the queue change via SSE

### 4.12 Reorder Indicators in Queue

- Tickets that were recently reordered (within last 24 hours) show a subtle animation or badge
- "Reordered by Lead" badge is visible on tickets reordered by the Support Lead
- Pending reorder requests show a small indicator icon on the ticket card

---

## Acceptance Criteria

- [ ] A developer can send a Smoke Signal with a context message (max 280 chars)
- [ ] All other developers receive the help request as a sound alert + pop-up notification
- [ ] A developer can respond to a help request, which sets their status to "Helping" and notifies the requester
- [ ] The checkpoint scheduler sends prompts to developers at the configured interval within active hours
- [ ] A checkpoint prompt modal appears with sound and requires the developer to submit their status
- [ ] Checkpoint responses update the developer's Ninja Board card in real-time
- [ ] If a developer does not respond to a checkpoint within 10 minutes, their card shows "No Response"
- [ ] A support member can request a reorder for a ticket they did not open
- [ ] The ticket owner receives a notification about the reorder request
- [ ] The ticket owner (or Support Lead) can approve or decline the request
- [ ] Approved reorders update the queue order and notify all viewers via SSE
- [ ] The Support Lead can directly reorder any ticket, which shows a "Reordered by Lead" badge
- [ ] All reorder actions create immutable TicketEvent records
- [ ] Help requests optionally reference a ticket and create a HELP_REQUESTED TicketEvent
- [ ] TypeScript compiles with zero errors; lint passes
