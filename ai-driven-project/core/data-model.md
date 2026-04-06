# Context: Data Model

**ID**: CTX-CORE-002  
**Category**: Core  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-INFRA-002

<!-- @context-meta
{
  "id": "CTX-CORE-002",
  "category": "core",
  "dependencies": ["CTX-INFRA-002"],
  "tags": ["prisma", "schema", "database", "entities", "enums"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

The data model uses Prisma ORM with SQLite 3. It defines 8 core entities covering users, tickets/bugs, help requests, checkpoints, notifications, and an immutable event timeline. All IDs are UUIDs internally; tickets have human-readable public IDs (`TKT-XXXX` / `BUG-XXXX`).

## Key Information

### Enums

| Enum | Values |
|------|--------|
| `Role` | `TECH_LEAD`, `DEVELOPER`, `SUPPORT_LEAD`, `SUPPORT_MEMBER` |
| `TicketType` | `TICKET`, `BUG` |
| `Severity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `TicketStatus` | `OPEN`, `IN_PROGRESS`, `WAITING_FOR_INFO`, `DONE`, `CANCELLED` |
| `Environment` | `PRODUCTION`, `STAGING`, `OTHER` |
| `ReorderStatus` | `PENDING`, `APPROVED`, `DECLINED` |
| `NotificationType` | `TICKET_NEW`, `BUG_NEW`, `HELP_REQUEST`, `CHECKPOINT`, `STATUS_CHANGE`, `REORDER_REQUEST`, etc. |
| `EventType` | `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `REASSIGNED`, `SEVERITY_CHANGED`, `DEADLINE_CHANGED`, `PRIORITY_REORDERED`, `REORDER_REQUESTED`, `REORDER_APPROVED`, `REORDER_DECLINED`, `HELP_REQUESTED`, `CHECKPOINT_MENTION`, `DONE`, `CANCELLED` |

### Entity Summary

#### User
Core user entity for all roles. Fields: `id`, `name`, `email`, `passwordHash`, `role`, `avatarUrl?`, `ninjaAlias` (auto-generated, overridable), `isActive`, `notifyTickets`, `notifyBugs`, `createdAt`, `updatedAt`.

#### Ticket
Unified entity for both tickets and bugs. Fields: `id` (UUID), `publicId` (`TKT-XXXX` or `BUG-XXXX`, auto-incrementing, immutable), `title`, `description`, `type`, `severity`, `status`, `deadline`, `priorityOrder` (integer for manual reorder), `openedById` → User, `assignedToId?` → User, `createdAt`, `updatedAt`, `resolvedAt?`.

#### BugReport (extends Ticket)
Additional fields for bug-type tickets: `affectedModule`, `stepsToReproduce`, `expectedBehavior`, `actualBehavior`, `environment`, `customerId?`.

#### ReorderRequest
Priority change requests in the queue. Fields: `id`, `ticketId` → Ticket, `requestedById` → User, `requestedPosition`, `reason?`, `status` (PENDING/APPROVED/DECLINED), `resolvedAt?`, `createdAt`.

#### HelpRequest (Smoke Signal)
Developer help requests. Fields: `id`, `requestedById` → User, `contextMessage` (max 280 chars), `createdAt`. Has nested responses: `responderId` → User, `respondedAt`.

#### Checkpoint (Status Scroll)
Developer status updates. Fields: `id`, `userId` → User, `currentTask`, `isBlocked`, `notes?`, `createdAt`.

#### CheckpointConfig
Single global configuration record. Fields: `id`, `intervalMinutes` (30–480), `activeHoursStart`, `activeHoursEnd`, `isEnabled`.

#### Notification
User notifications. Fields: `id`, `userId` → User, `type`, `referenceId` (polymorphic), `message`, `isRead`, `createdAt`.

#### TicketEvent (Immutable Timeline)
Every state change on a ticket. Fields: `id`, `ticketId` → Ticket, `eventType`, `actorId` → User, `metadata` (JSON: old/new values), `createdAt` (immutable — never updated).

### Key Relationships

```
User 1──N Ticket (openedBy)
User 1──N Ticket (assignedTo)
User 1──N HelpRequest
User 1──N Checkpoint
User 1──N Notification
Ticket 1──1 BugReport (optional extension)
Ticket 1──N ReorderRequest
Ticket 1──N TicketEvent
```

### Public ID Format

| Type | Format | Example | Sequence |
|------|--------|---------|----------|
| Ticket | `TKT-XXXX` | `TKT-0042` | Auto-incrementing per type, zero-padded |
| Bug | `BUG-XXXX` | `BUG-0017` | Auto-incrementing per type, zero-padded |

IDs are permanent and never reused.

## Code References

- `apps/web/lib/types.ts` — TypeScript type definitions
- `apps/web/lib/db.ts` — Database connection and utilities
- `apps/web/prisma/schema.prisma` — Full Prisma schema (Ticket, BugReport, TicketEvent, ReorderRequest models added in Phase 2)
- `apps/web/lib/ticket-id.ts` — Public ID generation utility (TKT-XXXX / BUG-XXXX, sequential, transaction-safe)
- `apps/web/lib/priority-order.ts` — Priority order calculation utility (severity weight based)
- `apps/web/lib/schemas/ticket-schemas.ts` — Zod validation schemas for ticket operations
- `docs/PRD.md` (Section 9) — Authoritative data model specification

## Related Contexts

- [CTX-INFRA-002 Database](../infrastructure/database.md) — SQLite configuration and Prisma setup
- [CTX-FEAT-003 Ticket Lifecycle](../features/ticket-lifecycle.md) — Ticket CRUD and status transitions
- [CTX-CORE-003 Authentication](authentication.md) — User entity and role-based access

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
| 2026-04-05 | Phase 2: Added Ticket, BugReport, TicketEvent, ReorderRequest models and enums to schema; added utility libs | Senior Backend Agent |
