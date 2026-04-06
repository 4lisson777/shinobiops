"use client"

import * as React from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"
import type { SafeUser } from "@/lib/types"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function SoundIcon({ muted, className }: { muted: boolean; className?: string }) {
  if (muted) {
    return (
      <svg
        className={cn("size-4", className)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  return (
    <svg
      className={cn("size-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

interface ProfileFieldErrors {
  name?: string[]
  ninjaAlias?: string[]
  currentPassword?: string[]
  newPassword?: string[]
  confirmPassword?: string[]
}

export function ProfileForm() {
  const [user, setUser] = React.useState<SafeUser | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Profile fields
  const [name, setName] = React.useState("")
  const [ninjaAlias, setNinjaAlias] = React.useState("")
  const [profileSaving, setProfileSaving] = React.useState(false)
  const [profileSuccess, setProfileSuccess] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)
  const [profileFieldErrors, setProfileFieldErrors] = React.useState<ProfileFieldErrors>({})

  // Password fields
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordSaving, setPasswordSaving] = React.useState(false)
  const [passwordSuccess, setPasswordSuccess] = React.useState(false)
  const [passwordError, setPasswordError] = React.useState<string | null>(null)
  const [passwordFieldErrors, setPasswordFieldErrors] =
    React.useState<ProfileFieldErrors>({})

  // Sound toggle — persisted in localStorage
  const [soundEnabled, setSoundEnabled] = React.useState(true)

  // Load current user on mount
  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me")
        if (!res.ok) throw new Error("Failed to load profile")
        const data = (await res.json()) as { user: SafeUser }
        setUser(data.user)
        setName(data.user.name)
        setNinjaAlias(data.user.ninjaAlias)
      } catch {
        setLoadError("Could not load your profile. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    void load()

    // Read sound preference from localStorage
    const stored = localStorage.getItem("shinobiops:soundEnabled")
    if (stored !== null) setSoundEnabled(stored !== "false")
  }, [])

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev
      localStorage.setItem("shinobiops:soundEnabled", String(next))
      return next
    })
  }

  async function handleProfileSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileError(null)
    setProfileFieldErrors({})
    setProfileSuccess(false)

    const errors: ProfileFieldErrors = {}
    if (!name.trim()) errors.name = ["Name is required"]
    if (Object.keys(errors).length > 0) {
      setProfileFieldErrors(errors)
      return
    }

    setProfileSaving(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), ninjaAlias: ninjaAlias.trim() || undefined }),
      })

      const data = (await res.json()) as {
        user?: SafeUser
        error?: string
        details?: ProfileFieldErrors
      }

      if (!res.ok) {
        if (data.details) setProfileFieldErrors(data.details)
        else setProfileError(data.error ?? "Update failed. Please try again.")
        return
      }

      if (data.user) {
        setUser(data.user)
        setName(data.user.name)
        setNinjaAlias(data.user.ninjaAlias)
      }
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch {
      setProfileError("Network error. Please check your connection.")
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordFieldErrors({})
    setPasswordSuccess(false)

    const errors: ProfileFieldErrors = {}
    if (!currentPassword) errors.currentPassword = ["Current password is required"]
    if (!newPassword || newPassword.length < 8)
      errors.newPassword = ["New password must be at least 8 characters"]
    if (newPassword !== confirmPassword)
      errors.confirmPassword = ["Passwords do not match"]
    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors)
      return
    }

    setPasswordSaving(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = (await res.json()) as {
        error?: string
        details?: ProfileFieldErrors
      }

      if (!res.ok) {
        if (data.details) setPasswordFieldErrors(data.details)
        else setPasswordError(data.error ?? "Password update failed. Please try again.")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordSuccess(true)
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch {
      setPasswordError("Network error. Please check your connection.")
    } finally {
      setPasswordSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-10 w-32 rounded bg-muted animate-pulse" />
        <div className="h-8 w-full rounded bg-muted animate-pulse" />
        <div className="h-8 w-full rounded bg-muted animate-pulse" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {loadError}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16 text-xl">
          {user?.avatarUrl && (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-[oklch(0.56_0.22_15)] text-white text-lg">
            {getInitials(name || "?")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{ninjaAlias}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role.replace(/_/g, " ").toLowerCase()}
          </p>
        </div>
      </div>

      {/* Profile info section */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Profile Information</h2>
        <form onSubmit={handleProfileSave} noValidate className="flex flex-col gap-4">
          {profileError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div
              role="status"
              className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
            >
              Profile updated successfully.
            </div>
          )}

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="cursor-default"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact an admin if needed.
            </p>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!profileFieldErrors.name}
              disabled={profileSaving}
            />
            {profileFieldErrors.name && (
              <p className="text-xs text-destructive">{profileFieldErrors.name[0]}</p>
            )}
          </div>

          {/* Ninja alias */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ninjaAlias">Ninja Alias</Label>
            <Input
              id="ninjaAlias"
              type="text"
              value={ninjaAlias}
              onChange={(e) => setNinjaAlias(e.target.value)}
              placeholder="Your code name in the clan"
              aria-invalid={!!profileFieldErrors.ninjaAlias}
              disabled={profileSaving}
            />
            {profileFieldErrors.ninjaAlias && (
              <p className="text-xs text-destructive">
                {profileFieldErrors.ninjaAlias[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="default"
            disabled={profileSaving}
            className="self-start bg-[oklch(0.56_0.22_15)] text-white hover:bg-[oklch(0.50_0.22_15)]"
          >
            {profileSaving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Password change section */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Change Password</h2>
        <form onSubmit={handlePasswordSave} noValidate className="flex flex-col gap-4">
          {passwordError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div
              role="status"
              className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
            >
              Password updated successfully.
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              aria-invalid={!!passwordFieldErrors.currentPassword}
              disabled={passwordSaving}
            />
            {passwordFieldErrors.currentPassword && (
              <p className="text-xs text-destructive">
                {passwordFieldErrors.currentPassword[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={!!passwordFieldErrors.newPassword}
              disabled={passwordSaving}
            />
            {passwordFieldErrors.newPassword && (
              <p className="text-xs text-destructive">
                {passwordFieldErrors.newPassword[0]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!passwordFieldErrors.confirmPassword}
              disabled={passwordSaving}
            />
            {passwordFieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">
                {passwordFieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <Button
            type="submit"
            size="default"
            disabled={passwordSaving}
            className="self-start bg-[oklch(0.18_0.05_265)] text-white hover:bg-[oklch(0.24_0.06_265)] dark:bg-[oklch(0.56_0.22_15)] dark:hover:bg-[oklch(0.50_0.22_15)]"
          >
            {passwordSaving ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </section>

      <Separator />

      {/* Sound preferences */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Sound Alerts</h2>
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <SoundIcon muted={!soundEnabled} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {soundEnabled ? "Sound Alerts Enabled" : "Sound Alerts Muted"}
              </p>
              <p className="text-xs text-muted-foreground">
                Controls notification tones for new tickets, bugs, checkpoints, and help requests
              </p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={soundEnabled}
            aria-label="Toggle sound alerts"
            onClick={toggleSound}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
              soundEnabled
                ? "bg-[oklch(0.56_0.22_15)]"
                : "bg-muted"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                soundEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          This preference is stored locally in your browser and applies to this device only.
        </p>
      </section>
    </div>
  )
}
