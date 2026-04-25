import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(): Promise<NextResponse> {
  try {
    await db.$queryRawUnsafe("SELECT 1")
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    )
  }
}
