# Phase 3 -- Real-Time Notifications, Sound Alerts, Ninja Board with Live Task Status

## Goal

Implement the SSE-based real-time notification system, in-app notification center, sound alerts for distinct events, and the Ninja Board showing live developer status cards with current task indicators.

---

## Features / Tasks

### 3.1 SSE Infrastructure

- Create an SSE endpoint at `GET /api/sse`
- Authenticated: read session from cookie, identify the user
- Maintain a connection registry (in-memory Map of userId -> Response stream)
- Send keep-alive pings every 30 seconds to prevent timeouts
- Handle client disconnection (remove from registry, clean up)
- Create a server-side utility `broadcastEvent(userIds: string[], eventType: string, payload: object)` that pushes to all specified users' open connections
- Create a `broadcastToRole(role: Role, eventType: string, payload: object)` helper
- Handle the case where the server restarts (clients auto-reconnect via EventSource)

### 3.2 Client-Side SSE Hook

- Create a custom hook `useSSE()` at `apps/web/hooks/use-sse.ts`
- Connects to `/api/sse` using `EventSource`
- Parses incoming events and dispatches them (via a context or event emitter pattern)
- Auto-reconnects on connection loss with exponential backoff
- Provides typed event handlers for each notification type
- Integrate into the authenticated layout so it connects once on login

### 3.3 Notification Model and API

**Prisma Notification model** (already partially defined in Phase 1 schema -- ensure it exists):
- id (UUID)
- userId (relation to User)
- type (enum: TICKET_NEW, BUG_NEW, HELP_REQUEST, CHECKPOINT, STATUS_CHANGE, REORDER_REQUEST, REORDER_APPROVED, REORDER_DECLINED, TICKET_DONE, TICKET_CANCELLED, ASSIGNMENT)
- referenceId (string -- polymorphic reference to ticket, help request, etc.)
- message (string -- human-readable)
- isRead (boolean, default false)
- createdAt

**API Endpoints:**

**GET `/api/notifications`**
- Returns the current user's notifications, newest first
- Query params: unreadOnly (boolean), limit, offset
- Returns unread count in response headers or body

**PATCH `/api/notifications/[id]/read`**
- Mark a single notification as read

**POST `/api/notifications/read-all`**
- Mark all of the current user's notifications as read

### 3.4 Notification Creation Service

- Create a server-side service `apps/web/lib/notifications.ts` with functions:
  - `createNotification(userId, type, referenceId, message)` -- saves to DB and pushes via SSE
  - `notifyTicketCreated(ticket)` -- determines recipients based on type (Ticket vs Bug) and each dev's `notifyTickets`/`notifyBugs` settings, creates notifications, broadcasts
  - `notifyStatusChange(ticket, oldStatus, newStatus, actor)` -- notifies the opener
  - `notifyAssignment(ticket, assignee, actor)` -- notifies the assignee
  - `notifyTicketDone(ticket, actor)` -- notifies the opener
  - `notifyTicketCancelled(ticket, actor)` -- notifies the opener

### 3.5 Integrate Notifications into Ticket Lifecycle

- When a ticket is created (POST `/api/tickets`): call `notifyTicketCreated()`
- When status changes: call `notifyStatusChange()`
- When assigned: call `notifyAssignment()`
- When done/cancelled: call `notifyTicketDone()` or `notifyTicketCancelled()`

### 3.6 Notification Center UI

- Header bell icon with unread count badge
- Clicking the bell opens a dropdown/panel listing recent notifications
- Each notification shows: icon (based on type), message text, relative timestamp ("2m ago"), unread dot indicator
- Clicking a notification marks it as read and navigates to the referenced item (ticket detail page, etc.)
- "Mark all as read" button at the top of the panel
- Panel fetches from GET `/api/notifications`

### 3.7 Sound Alert System

- Create a sound manager utility at `apps/web/lib/sounds.ts`
- Bundle 5 distinct audio files in `public/sounds/`:
  - `tone-a.mp3` -- subtle chime (new Ticket)
  - `tone-b.mp3` -- urgent tone (new Bug)
  - `tone-c.mp3` -- sharp alert (Help Request)
  - `tone-d.mp3` -- soft pulse (Checkpoint reminder)
  - `tone-e.mp3` -- resolution sound (Ticket Done/Cancelled)
- Use the Web Audio API to play sounds
- Respect the user's `soundEnabled` profile setting
- Provide a `playSound(type: SoundType)` function
- Handle browser autoplay restrictions (require user interaction before first play -- show a dismissible banner if needed)

### 3.8 Sound Integration with SSE Events

- In the SSE hook, when a notification event arrives:
  - TICKET_NEW -> play Tone A
  - BUG_NEW -> play Tone B
  - HELP_REQUEST -> play Tone C
  - CHECKPOINT -> play Tone D
  - TICKET_DONE or TICKET_CANCELLED -> play Tone E
- Show a visual banner/toast in addition to the sound

### 3.9 Ninja Board Page (`/dev`)

- Access: DEVELOPER, TECH_LEAD
- Display all developers (role=DEVELOPER) as cards in a grid layout
- Each developer card shows:
  - Avatar (or initials fallback)
  - Name and ninja alias
  - Current task text (editable by the card owner)
  - Currently assigned ticket (publicId + title + severity badge), or "No active mission"
  - Status indicator: Active, In Checkpoint, Blocked, Helping
  - Visual distinction for each status (color-coded border or badge)

### 3.10 Developer Status Model

Add to Prisma schema or extend User:
- currentTask (string, nullable) -- free-text "what I'm doing now"
- currentStatus (enum: ACTIVE, IN_CHECKPOINT, BLOCKED, HELPING, default ACTIVE)

**API Endpoints:**

**PATCH `/api/users/me/status`**
- Update currentTask and/or currentStatus
- Broadcast status change via SSE to all connected dev team members

**GET `/api/developers`**
- Returns all users with role=DEVELOPER, including currentTask, currentStatus, and their latest assigned ticket
- Used by the Ninja Board to render cards

### 3.11 Ninja Board Live Updates

- The Ninja Board page subscribes to SSE events for developer status changes
- When any developer updates their status or task, all connected Ninja Board viewers see the change in real time
- SSE event type: `DEVELOPER_STATUS_UPDATED` with payload `{ userId, currentTask, currentStatus }`

### 3.12 Developer Self-Update Interaction

- A developer can click their own card on the Ninja Board
- A modal/inline editor appears to update:
  - Current task (text input)
  - Status (select: Active, Blocked)
- Saving triggers PATCH `/api/users/me/status` and broadcasts the change

### 3.13 Notification Banner on Ninja Board

- When a new ticket or bug arrives, show a temporary banner at the top of the Ninja Board:
  - "New Mission: TKT-0042 -- Server timeout on login (Critical)" with severity color
  - Banner auto-dismisses after 10 seconds or on click
  - Distinct styling for Ticket vs Bug

---

## Acceptance Criteria

- [ ] SSE endpoint maintains persistent connections for authenticated users
- [ ] Client-side SSE hook connects, auto-reconnects, and dispatches typed events
- [ ] Notifications are saved to the database when tickets are created, assigned, status-changed, done, or cancelled
- [ ] Notifications are pushed in real-time via SSE to the correct recipients
- [ ] The notification center (bell icon) shows unread count and lists recent notifications
- [ ] Clicking a notification navigates to the relevant ticket detail page
- [ ] "Mark all as read" clears the unread badge
- [ ] Sound alerts play for each event type (Ticket, Bug, Help, Checkpoint, Done) using distinct tones
- [ ] Sounds respect the user's mute preference
- [ ] The Ninja Board displays all developer cards with avatar, name, alias, current task, status, and assigned ticket
- [ ] A developer can update their task and status from the Ninja Board
- [ ] Status changes propagate in real-time to all Ninja Board viewers via SSE
- [ ] A banner notification appears on the Ninja Board when a new ticket/bug is created
- [ ] Notification recipients are correctly filtered by `notifyTickets` and `notifyBugs` user settings
- [ ] SSE connections are cleaned up when clients disconnect
- [ ] TypeScript compiles with zero errors; lint passes
