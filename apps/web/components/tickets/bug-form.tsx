"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { generateClickUpMarkdown } from "@/lib/clickup-export"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  affectedModule: z.string().min(1, "Affected module is required"),
  stepsToReproduce: z.string().min(1, "Steps to reproduce are required"),
  expectedBehavior: z.string().min(1, "Expected behavior is required"),
  actualBehavior: z.string().min(1, "Actual behavior is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"], {
    required_error: "Severity is required",
  }),
  deadline: z.string().min(1, "Deadline is required"),
  environment: z.enum(["PRODUCTION", "STAGING", "OTHER"], {
    required_error: "Environment is required",
  }),
  customerId: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type FieldErrors = Partial<Record<keyof FormData, string>>

const SEVERITY_OPTIONS: {
  value: FormData["severity"]
  label: string
  dot: string
}[] = [
  { value: "LOW", label: "Low — White Belt", dot: "bg-gray-200 border border-gray-400" },
  { value: "MEDIUM", label: "Medium — Green Belt", dot: "bg-green-500" },
  { value: "HIGH", label: "High — Red Belt", dot: "bg-red-500" },
  {
    value: "CRITICAL",
    label: "Critical — Black Belt",
    dot: "bg-black dark:bg-gray-800 border border-gray-600",
  },
]

const ENVIRONMENT_OPTIONS: { value: FormData["environment"]; label: string }[] =
  [
    { value: "PRODUCTION", label: "Production" },
    { value: "STAGING", label: "Staging" },
    { value: "OTHER", label: "Other" },
  ]

export function BugForm() {
  const router = useRouter()

  const [title, setTitle] = React.useState("")
  const [affectedModule, setAffectedModule] = React.useState("")
  const [stepsToReproduce, setStepsToReproduce] = React.useState("")
  const [expectedBehavior, setExpectedBehavior] = React.useState("")
  const [actualBehavior, setActualBehavior] = React.useState("")
  const [severity, setSeverity] = React.useState<FormData["severity"] | "">("")
  const [deadline, setDeadline] = React.useState("")
  const [environment, setEnvironment] = React.useState<
    FormData["environment"] | ""
  >("")
  const [customerId, setCustomerId] = React.useState("")

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)
  const [clipboardMsg, setClipboardMsg] = React.useState<string | null>(null)
  const [isPending, setIsPending] = React.useState(false)

  // "Copy to ClickUp Format" is only active when these three fields are filled
  const canCopyClickUp =
    title.trim().length > 0 &&
    affectedModule.trim().length > 0 &&
    stepsToReproduce.trim().length > 0

  async function handleCopyClickUp() {
    if (!canCopyClickUp) return

    const markdown = generateClickUpMarkdown({
      publicId: "BUG-???",
      title,
      affectedModule,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity: severity || "LOW",
      deadline: deadline || "TBD",
      environment: environment || "OTHER",
      customerId: customerId || undefined,
    })

    try {
      await navigator.clipboard.writeText(markdown)
      setClipboardMsg("Copied to clipboard!")
      setTimeout(() => setClipboardMsg(null), 2000)
    } catch {
      setClipboardMsg("Failed to copy — please copy manually.")
      setTimeout(() => setClipboardMsg(null), 3000)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldErrors({})
    setServerError(null)
    setSuccessMsg(null)

    const result = schema.safeParse({
      title,
      affectedModule,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      deadline,
      environment,
      customerId: customerId || undefined,
    })

    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormData
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsPending(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, type: "BUG" }),
      })

      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setServerError(
          data.error ?? "Failed to submit threat report. Please try again."
        )
        return
      }

      setSuccessMsg("Threat report submitted successfully")
      setTimeout(() => router.push("/support/queue"), 800)
    } catch {
      setServerError("Network error. Please check your connection.")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400"
        >
          {successMsg}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Short description of the bug"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!fieldErrors.title}
          disabled={isPending}
        />
        {fieldErrors.title && (
          <p className="text-xs text-destructive">{fieldErrors.title}</p>
        )}
      </div>

      {/* Affected Module */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="affectedModule">Affected Module / Screen</Label>
        <Input
          id="affectedModule"
          type="text"
          placeholder="e.g. Customer invoice page, Login screen"
          value={affectedModule}
          onChange={(e) => setAffectedModule(e.target.value)}
          aria-invalid={!!fieldErrors.affectedModule}
          disabled={isPending}
        />
        {fieldErrors.affectedModule && (
          <p className="text-xs text-destructive">{fieldErrors.affectedModule}</p>
        )}
      </div>

      {/* Steps to Reproduce */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
        <Textarea
          id="stepsToReproduce"
          placeholder={"1. Go to...\n2. Click...\n3. See error"}
          value={stepsToReproduce}
          onChange={(e) => setStepsToReproduce(e.target.value)}
          aria-invalid={!!fieldErrors.stepsToReproduce}
          disabled={isPending}
          rows={4}
          className="resize-y font-mono text-sm"
        />
        {fieldErrors.stepsToReproduce && (
          <p className="text-xs text-destructive">
            {fieldErrors.stepsToReproduce}
          </p>
        )}
      </div>

      {/* Expected / Actual Behavior */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expectedBehavior">Expected Behavior</Label>
          <Textarea
            id="expectedBehavior"
            placeholder="What should have happened?"
            value={expectedBehavior}
            onChange={(e) => setExpectedBehavior(e.target.value)}
            aria-invalid={!!fieldErrors.expectedBehavior}
            disabled={isPending}
            rows={3}
            className="resize-y"
          />
          {fieldErrors.expectedBehavior && (
            <p className="text-xs text-destructive">
              {fieldErrors.expectedBehavior}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actualBehavior">Actual Behavior</Label>
          <Textarea
            id="actualBehavior"
            placeholder="What actually happened?"
            value={actualBehavior}
            onChange={(e) => setActualBehavior(e.target.value)}
            aria-invalid={!!fieldErrors.actualBehavior}
            disabled={isPending}
            rows={3}
            className="resize-y"
          />
          {fieldErrors.actualBehavior && (
            <p className="text-xs text-destructive">
              {fieldErrors.actualBehavior}
            </p>
          )}
        </div>
      </div>

      {/* Severity + Environment */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="severity">Severity</Label>
          <Select
            value={severity}
            onValueChange={(v) => setSeverity(v as FormData["severity"])}
            disabled={isPending}
          >
            <SelectTrigger id="severity" aria-invalid={!!fieldErrors.severity}>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-block size-2.5 rounded-full",
                        opt.dot
                      )}
                    />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.severity && (
            <p className="text-xs text-destructive">{fieldErrors.severity}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={environment}
            onValueChange={(v) =>
              setEnvironment(v as FormData["environment"])
            }
            disabled={isPending}
          >
            <SelectTrigger
              id="environment"
              aria-invalid={!!fieldErrors.environment}
            >
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.environment && (
            <p className="text-xs text-destructive">
              {fieldErrors.environment}
            </p>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="deadline">Deadline</Label>
        <input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={isPending}
          aria-invalid={!!fieldErrors.deadline}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
            "transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[color-scheme:light] dark:[color-scheme:dark]"
          )}
          min={new Date().toISOString().split("T")[0]}
        />
        {fieldErrors.deadline && (
          <p className="text-xs text-destructive">{fieldErrors.deadline}</p>
        )}
      </div>

      {/* Customer ID (optional) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customerId">
          Customer Name / ID{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="customerId"
          type="text"
          placeholder="e.g. Acme Corp or CUST-1234"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* ClickUp copy button */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyClickUp}
          disabled={!canCopyClickUp || isPending}
          className="w-full"
        >
          {/* Clipboard icon */}
          <svg
            className="mr-2 size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
          Copy to ClickUp Format
        </Button>
        {clipboardMsg && (
          <p
            role="status"
            className="text-center text-xs text-muted-foreground"
          >
            {clipboardMsg}
          </p>
        )}
        {!canCopyClickUp && (
          <p className="text-center text-xs text-muted-foreground">
            Fill in title, affected module, and steps to reproduce to enable this button.
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "h-10 w-full text-sm font-semibold",
          "bg-[oklch(0.56_0.22_15)] text-white hover:bg-[oklch(0.50_0.22_15)]"
        )}
      >
        {isPending ? "Submitting threat report…" : "Submit Threat Report"}
      </Button>
    </form>
  )
}
