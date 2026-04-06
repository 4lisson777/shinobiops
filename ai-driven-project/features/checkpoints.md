# Context: Checkpoints (Status Scroll)

**ID**: CTX-FEAT-005  
**Category**: Feature  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002, CTX-FEAT-004

<!-- @context-meta
{
  "id": "CTX-FEAT-005",
  "category": "feature",
  "dependencies": ["CTX-CORE-002", "CTX-FEAT-004"],
  "tags": ["checkpoint", "status-scroll", "interval", "blocked", "dev-status"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

The checkpoint system (themed as "Status Scroll") sends periodic prompts to developers asking them to report their current task, whether they're blocked, and optional notes. Configurable by the Tech Lead with interval and active hours. Responses update the Ninja Board cards.

## Key Information

### Checkpoint Flow

1. System sends checkpoint prompt at configured interval
2. Sound alert (Tone D) plays + modal appears on dev's browser
3. Dev fills in: current task, blocked (yes/no), optional notes
4. Submission updates their Ninja Board card
5. If no response within 10 minutes: card shows "No response" indicator

### Configuration (Tech Lead Only)

| Setting | Constraints |
|---------|------------|
| Enable/disable globally | Boolean toggle |
| Interval | Min 30 minutes, max 8 hours (480 min) |
| Active hours window | e.g., 08:00–18:00 (checkpoints only fire within window) |

Single global `CheckpointConfig` record — one configuration applies to all developers.

### Response Data

Each checkpoint response creates a `Checkpoint` record:
- `currentTask` — what the dev is working on
- `isBlocked` — boolean flag
- `notes` — optional additional context
- `userId` — which developer responded
- `createdAt` — timestamp

### Tech Lead View

- View per-developer log of all checkpoint responses
- Accessible from Admin Dashboard → Checkpoint Configuration page

### Ninja Board Integration

When a dev submits a checkpoint:
- Their card status updates to `In Checkpoint` during submission
- Task text and blocked status are reflected on their card
- Live update pushed via SSE to all connected clients

## Code References

- `apps/web/components/dev/status-scroll-modal.tsx` — Checkpoint prompt modal
- `apps/web/components/admin/checkpoint-config.tsx` — Admin config UI
- `apps/web/app/(protected)/admin/checkpoints/page.tsx` — Admin checkpoints page
- `apps/web/app/api/checkpoints/route.ts` — Checkpoint CRUD (submit, list)
- `apps/web/app/api/checkpoints/config/route.ts` — Checkpoint configuration endpoint

## Related Contexts

- [CTX-FEAT-002 Ninja Board](ninja-board.md) — Checkpoint responses update dev cards
- [CTX-FEAT-004 Notifications](notifications.md) — Checkpoint reminder sound alert
- [CTX-CORE-002 Data Model](../core/data-model.md) — Checkpoint, CheckpointConfig entities

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
