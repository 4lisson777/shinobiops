import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await context.params

  // Verify the ticket exists before returning events
  const ticket = await db.ticket.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const events = await db.ticketEvent.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          ninjaAlias: true,
          role: true,
        },
      },
    },
  })

  return NextResponse.json({ events })
}
