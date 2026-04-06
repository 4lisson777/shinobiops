import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
})

/**
 * PATCH /api/users/me/password — changes the current user's password.
 * Requires verification of the existing password before accepting the new one.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAuth()
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = PasswordChangeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true, isActive: true },
  })

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: { currentPassword: ["Incorrect current password"] },
      },
      { status: 400 }
    )
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: session.userId },
    data: { passwordHash: newHash },
  })

  return NextResponse.json({ message: "Password updated successfully" }, { status: 200 })
}
