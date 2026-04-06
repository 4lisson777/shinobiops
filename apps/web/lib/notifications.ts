import { NotificationType } from "@prisma/client"
import { db } from "@/lib/db"
import { emitShinobiEvent } from "@/lib/sse-emitter"

/**
 * Resolves which user IDs should receive a notification based on type.
 *
 * - TICKET_CREATED: active DEVs / TECH_LEADs with notifyTickets = true
 * - BUG_CREATED: active DEVs / TECH_LEADs with notifyBugs = true
 * - TICKET_DONE / TICKET_CANCELLED / TICKET_STATUS_CHANGED: the ticket opener
 * - TICKET_ASSIGNED: the assigned user
 * - HELP_REQUEST_NEW: all active DEVs / TECH_LEADs except the requester
 * - HELP_REQUEST_RESPONDED: the original requester
 * - CHECKPOINT_PROMPT: targeted per-user (pass userId via assignedToId)
 */
export async function getNotificationTargets(
  type: NotificationType,
  ticketOpenedById?: string,
  assignedToId?: string
): Promise<string[]> {
  switch (type) {
    case "TICKET_CREATED": {
      const users = await db.user.findMany({
        where: {
          role: { in: ["DEVELOPER", "TECH_LEAD"] },
          notifyTickets: true,
          isActive: true,
        },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }

    case "BUG_CREATED": {
      const users = await db.user.findMany({
        where: {
          role: { in: ["DEVELOPER", "TECH_LEAD"] },
          notifyBugs: true,
          isActive: true,
        },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }

    case "TICKET_DONE":
    case "TICKET_CANCELLED":
    case "TICKET_STATUS_CHANGED":
      return ticketOpenedById ? [ticketOpenedById] : []

    case "TICKET_ASSIGNED":
    case "HELP_REQUEST_RESPONDED":
    case "CHECKPOINT_PROMPT":
      return assignedToId ? [assignedToId] : []

    case "HELP_REQUEST_NEW": {
      // All active devs/tech leads except the requester (ticketOpenedById reused as requesterId)
      const users = await db.user.findMany({
        where: {
          role: { in: ["DEVELOPER", "TECH_LEAD"] },
          isActive: true,
          id: { not: ticketOpenedById },
        },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }

    default:
      return []
  }
}

interface CreateNotificationsParams {
  type: NotificationType
  title: string
  body: string
  ticketId?: string
  targetUserIds: string[]
}

/**
 * Bulk-creates Notification rows for all target users and emits an SSE
 * "notification:new" event per recipient so connected clients update in real time.
 */
export async function createAndEmitNotifications({
  type,
  title,
  body,
  ticketId,
  targetUserIds,
}: CreateNotificationsParams): Promise<void> {
  if (targetUserIds.length === 0) return

  await db.notification.createMany({
    data: targetUserIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      ticketId: ticketId ?? null,
    })),
  })

  for (const userId of targetUserIds) {
    emitShinobiEvent({
      type: "notification:new",
      payload: { userId, type, title, body, ticketId: ticketId ?? null },
    })
  }
}
