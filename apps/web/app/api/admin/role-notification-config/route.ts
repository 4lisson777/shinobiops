import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"
import { Role } from "@/generated/prisma/client"

// All roles that must have a config row
const ALL_ROLES: Role[] = [
  "TECH_LEAD",
  "DEVELOPER",
  "QA",
  "SUPPORT_LEAD",
  "SUPPORT_MEMBER",
]

// Default values per role per spec
const ROLE_DEFAULTS: Record<Role, { notifyOnCreation: boolean; notifyOnAssignment: boolean }> = {
  TECH_LEAD: { notifyOnCreation: true, notifyOnAssignment: true },
  DEVELOPER: { notifyOnCreation: true, notifyOnAssignment: true },
  QA: { notifyOnCreation: true, notifyOnAssignment: false },
  SUPPORT_LEAD: { notifyOnCreation: false, notifyOnAssignment: false },
  SUPPORT_MEMBER: { notifyOnCreation: false, notifyOnAssignment: false },
}

/**
 * Ensures all 5 role config rows exist in the DB.
 * Inserts only the missing ones, preserving existing customizations.
 * Called on every GET so that adding a new role to the enum auto-provisions its row.
 */
async function ensureDefaultConfigsExist(): Promise<void> {
  const existing = await db.roleNotificationConfig.findMany({
    select: { role: true },
  })
  const existingRoles = new Set(existing.map((r) => r.role))

  const missing = ALL_ROLES.filter((role) => !existingRoles.has(role))
  if (missing.length === 0) return

  await db.roleNotificationConfig.createMany({
    data: missing.map((role) => ({
      role,
      notifyOnCreation: ROLE_DEFAULTS[role].notifyOnCreation,
      notifyOnAssignment: ROLE_DEFAULTS[role].notifyOnAssignment,
    })),
  })
}

const patchSchema = z.object({
  configs: z
    .array(
      z.object({
        role: z.enum(["TECH_LEAD", "DEVELOPER", "QA", "SUPPORT_LEAD", "SUPPORT_MEMBER"]),
        notifyOnCreation: z.boolean().optional(),
        notifyOnAssignment: z.boolean().optional(),
      })
    )
    .min(1, "At least one config entry is required"),
})

export async function GET(): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD")
  if (error) return error

  await ensureDefaultConfigsExist()

  const configs = await db.roleNotificationConfig.findMany({
    select: { role: true, notifyOnCreation: true, notifyOnAssignment: true },
    orderBy: { role: "asc" },
  })

  return NextResponse.json({ configs })
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

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Ensure default rows exist before patching so upsert won't fail on missing rows
  await ensureDefaultConfigsExist()

  // Apply each config update; use upsert so partial updates against newly-added roles
  // work even if ensureDefaultConfigsExist raced with the request
  await Promise.all(
    parsed.data.configs.map((entry) => {
      const { role, ...fields } = entry
      // Only include fields that were actually provided in the request
      const updateData: { notifyOnCreation?: boolean; notifyOnAssignment?: boolean } = {}
      if (fields.notifyOnCreation !== undefined) updateData.notifyOnCreation = fields.notifyOnCreation
      if (fields.notifyOnAssignment !== undefined) updateData.notifyOnAssignment = fields.notifyOnAssignment

      return db.roleNotificationConfig.upsert({
        where: { role },
        update: updateData,
        create: {
          role,
          notifyOnCreation: fields.notifyOnCreation ?? ROLE_DEFAULTS[role].notifyOnCreation,
          notifyOnAssignment: fields.notifyOnAssignment ?? ROLE_DEFAULTS[role].notifyOnAssignment,
        },
      })
    })
  )

  // Return the full updated list so the frontend can refresh its state in one round trip
  const configs = await db.roleNotificationConfig.findMany({
    select: { role: true, notifyOnCreation: true, notifyOnAssignment: true },
    orderBy: { role: "asc" },
  })

  return NextResponse.json({ configs })
}
