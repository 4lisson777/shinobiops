/**
 * Formats a deadline Date or ISO string for display.
 * Uses the browser/process locale timezone (UTC on server, local on client).
 */
export function formatDeadline(date: Date | string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Returns true when the given deadline is in the past.
 */
export function isPastDeadline(date: Date | string): boolean {
  return new Date(date) < new Date()
}
