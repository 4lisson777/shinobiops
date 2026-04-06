import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

const patchSchema = z.object({
  isEnabled: z.boolean().optional(),
  refreshInterval: z.number().int().min(10).max(300).optional(),
})

async function getOrCreateTvConfig() {
  const existing = await db.tvConfig.findFirst()
  if (existing) return existing
  return db.tvConfig.create({ data: {} })
}

export async function GET(): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD", "QA")
  if (error) return error

  const config = await getOrCreateTvConfig()
  return NextResponse.json({ config })
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD", "QA")
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

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const current = await getOrCreateTvConfig()
  const config = await db.tvConfig.update({
    where: { id: current.id },
    data: parsed.data,
  })

  return NextResponse.json({ config })
}
