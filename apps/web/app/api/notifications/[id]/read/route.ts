import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { session, error } = await requireAuth()
  if (error) return error

  const { id } = await context.params

  const notification = await db.notification.findUnique({ where: { id } })
  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  // Ownership check — users may only mark their own notifications as read
  if (notification.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await db.notification.update({
    where: { id },
    data: { isRead: true },
    include: {
      ticket: { select: { publicId: true } },
    },
  })

  return NextResponse.json({ notification: updated })
}
