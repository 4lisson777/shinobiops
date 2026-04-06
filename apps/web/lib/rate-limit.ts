/**
 * Simple in-memory rate limiter.
 * Uses a Map keyed by IP address with a sliding window per key.
 * Not suitable for multi-instance deployments; for single-node use only.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Global singleton — survives HMR in development
declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined
}

const store: Map<string, RateLimitEntry> =
  globalThis.__rateLimitStore ?? new Map()

if (process.env.NODE_ENV !== "production") {
  globalThis.__rateLimitStore = store
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (typically an IP address).
 * Mutates internal state — call once per request.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    // First request in this window
    const resetAt = now + options.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: options.limit - 1, resetAt }
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, remaining: options.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Extracts the client IP from common proxy headers or the socket.
 * Returns "unknown" as a fallback (will share the limit bucket with all unknowns).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "unknown"
}
