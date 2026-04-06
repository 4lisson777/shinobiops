import { NextResponse } from "next/server"
import { getSession, type SessionData } from "@/lib/session"

/**
 * Reads the current session and returns the session data.
 * Returns null when the request is unauthenticated.
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  const session = await getSession()
  if (!session.userId) return null
  return {
    userId: session.userId,
    role: session.role,
    name: session.name,
  }
}

/**
 * Guards an API route handler that requires authentication.
 * Returns a 401 JSON response when no valid session exists.
 *
 * Usage:
 *   const { session, error } = await requireAuth()
 *   if (error) return error
 */
export async function requireAuth(): Promise<
  | { session: SessionData; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getCurrentSession()
  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    }
  }
  return { session, error: null }
}

/**
 * Guards an API route that requires a specific role.
 * Returns 401 when unauthenticated, 403 when role is insufficient.
 *
 * Usage:
 *   const { session, error } = await requireRole("TECH_LEAD")
 *   if (error) return error
 */
export async function requireRole(
  ...allowedRoles: string[]
): Promise<
  | { session: SessionData; error: null }
  | { session: null; error: NextResponse }
> {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }

  if (!allowedRoles.includes(session.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
    }
  }

  return { session, error: null }
}
