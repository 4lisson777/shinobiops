// Admin-namespaced alias for /api/checkpoints/config
// Delegates all logic to the shared config handler, but enforces TECH_LEAD on GET too.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const updateSchema = z.object({
  intervalMinutes: z.number().int().min(30).max(480).optional(),
  activeHoursStart: z.string().regex(timePattern, "Must be HH:MM format").optional(),
  activeHoursEnd: z.string().regex(timePattern, "Must be HH:MM format").optional(),
  isEnabled: z.boolean().optional(),
})

async function getOrCreateConfig() {
  const existing = await db.checkpointConfig.findFirst()
  if (existing) return existing
  return db.checkpointConfig.create({ data: {} })
}

export async function GET(): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD")
  if (error) return error

  const config = await getOrCreateConfig()
  return NextResponse.json({ config })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD")
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const current = await getOrCreateConfig()
  const config = await db.checkpointConfig.update({
    where: { id: current.id },
    data: parsed.data,
  })

  return NextResponse.json({ config })
}
