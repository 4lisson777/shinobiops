// Zero-dependency structured JSON logger for Node.js runtime (API routes, server components).
// Outputs NDJSON to stdout (info/debug) and stderr (warn/error) — compatible with
// Loki, Datadog, Splunk, CloudWatch, and any stdout-scraping log aggregator.
//
// DO NOT import this module in middleware.ts — middleware runs in Edge runtime
// which does not support process.stdout.write. Use console.log(JSON.stringify({...}))
// in middleware instead.

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  time: string
  msg: string
  [key: string]: unknown
}

function write(level: LogLevel, msg: string, extra?: Record<string, unknown>): void {
  const entry: LogEntry = { level, time: new Date().toISOString(), msg, ...extra }
  // errors and warnings go to stderr; info/debug to stdout
  if (level === "error" || level === "warn") {
    process.stderr.write(JSON.stringify(entry) + "\n")
  } else {
    process.stdout.write(JSON.stringify(entry) + "\n")
  }
}

export const logger = {
  info: (msg: string, extra?: Record<string, unknown>) => write("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => write("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => write("error", msg, extra),
  debug: (msg: string, extra?: Record<string, unknown>) => write("debug", msg, extra),
}
