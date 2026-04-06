import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import sharp from "sharp"
import { db } from "@/lib/db"
import { requireRole } from "@/lib/auth"

type RouteContext = { params: Promise<{ id: string }> }

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])
const AVATARS_DIR = path.join(process.cwd(), "public", "avatars")

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { error } = await requireRole("TECH_LEAD")
  if (error) return error

  const { id } = await context.params

  const target = await db.user.findUnique({ where: { id } })
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const formData = await request.formData()
  const file = formData.get("avatar")

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "avatar field is required and must be a file" },
      { status: 400 }
    )
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only PNG, JPEG, and WEBP images are accepted" },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Resize to max 256x256 and convert to WebP
  const processed = await sharp(buffer)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  await fs.mkdir(AVATARS_DIR, { recursive: true })

  const filename = `${id}.webp`
  const outputPath = path.join(AVATARS_DIR, filename)
  await fs.writeFile(outputPath, processed)

  const avatarUrl = `/avatars/${filename}`

  await db.user.update({
    where: { id },
    data: { avatarUrl },
  })

  return NextResponse.json({ avatarUrl })
}
