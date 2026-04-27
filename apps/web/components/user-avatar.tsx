"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"

// Predefined set of accessible background/text color pairs
const FALLBACK_COLORS = [
  "bg-[oklch(0.68_0.22_320)] text-white",       // crimson
  "bg-[oklch(0.45_0.18_265)] text-white",       // navy-ish
  "bg-emerald-600 text-white",
  "bg-violet-600 text-white",
  "bg-amber-600 text-white",
  "bg-sky-600 text-white",
  "bg-rose-600 text-white",
  "bg-teal-600 text-white",
]

// Derive a consistent color index from the name string. Safe against
// null/undefined/empty input -- callers should never crash because of an
// upstream data hiccup.
function nameToColorIndex(name: string | null | undefined): number {
  if (!name) return 0
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % FALLBACK_COLORS.length
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase()
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase()
}

const SIZE_CLASSES = {
  sm: "size-7 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const

interface UserAvatarProps {
  name: string | null | undefined
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  const colorClass = FALLBACK_COLORS[nameToColorIndex(name)] ?? FALLBACK_COLORS[0]!
  const initials = getInitials(name)
  const altText = name ?? ""

  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={altText} />}
      <AvatarFallback className={cn("font-semibold", colorClass)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
