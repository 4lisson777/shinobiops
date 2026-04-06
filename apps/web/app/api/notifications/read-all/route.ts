import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PATCH(): Promise<NextResponse> {
  const { session, error } = await requireAuth()
  if (error) return error

  const result = await db.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  })

  return NextResponse.json({ count: result.count })
}
