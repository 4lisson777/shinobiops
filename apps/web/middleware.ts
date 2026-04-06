import { NextRequest, NextResponse } from "next/server"
import { unsealData } from "iron-session"

const COOKIE_NAME = "shinobiops_session"

interface SessionPayload {
  userId?: string
  role?: string
  name?: string
}

// Routes that do not require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/dev/tv",
]

// API route prefixes that are always public
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
  "/api/health",
  "/api/tv/",
]

// Role-based access rules: maps path prefix to allowed roles.
// Order matters — more specific prefixes should come first.
const ROLE_GUARDS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["TECH_LEAD"] },
  { prefix: "/support", roles: ["SUPPORT_MEMBER", "SUPPORT_LEAD", "TECH_LEAD"] },
  // /dev/tv is already public (excluded above), other /dev routes need dev roles
  { prefix: "/dev", roles: ["DEVELOPER", "TECH_LEAD"] },
]

function isPublicPath(pathname: string): boolean {
  for (const p of PUBLIC_PATHS) {
    if (pathname === p || pathname.startsWith(p + "/")) {
      return true
    }
  }
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }
  return false
}

/**
 * Reads and decrypts the iron-session cookie from the request.
 * Returns null when the cookie is absent or the seal is invalid.
 */
async function readSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value
  if (!cookieValue) return null

  try {
    const password =
      process.env.SESSION_SECRET ?? "fallback-dev-secret-min-32-chars!!"

    const data = await unsealData<SessionPayload>(cookieValue, { password })
    return data
  } catch {
    // Corrupted or tampered cookie — treat as unauthenticated
    return null
  }
}

function getRoleHome(role: string): string {
  switch (role) {
    case "TECH_LEAD":
    case "DEVELOPER":
      return "/dev"
    case "SUPPORT_LEAD":
    case "SUPPORT_MEMBER":
      return "/support"
    default:
      return "/login"
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = await readSessionFromRequest(request)

  if (!session?.userId) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access check
  const role = session.role ?? ""
  for (const guard of ROLE_GUARDS) {
    if (pathname.startsWith(guard.prefix)) {
      if (!guard.roles.includes(role)) {
        const home = getRoleHome(role)
        return NextResponse.redirect(new URL(home, request.url))
      }
      break
    }
  }

  return NextResponse.next()
}

// Matcher: run middleware on all routes except Next.js internals and static assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
