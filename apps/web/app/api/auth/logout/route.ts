import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  session.destroy()
  return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
}
