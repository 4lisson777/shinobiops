"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Switch } from "@workspace/ui/components/switch"
import { Skeleton } from "@workspace/ui/components/skeleton"

// Fixed display order for roles (spec requirement)
const ROLE_DISPLAY_ORDER = [
  "TECH_LEAD",
  "DEVELOPER",
  "QA",
  "SUPPORT_LEAD",
  "SUPPORT_MEMBER",
] as const

type RoleKey = (typeof ROLE_DISPLAY_ORDER)[number]

const ROLE_LABELS: Record<RoleKey, string> = {
  TECH_LEAD: "Lider Tecnico",
  DEVELOPER: "Desenvolvedor",
  QA: "QA",
  SUPPORT_LEAD: "Lider de Suporte",
  SUPPORT_MEMBER: "Membro de Suporte",
}

interface RoleConfig {
  role: RoleKey
  notifyOnCreation: boolean
  notifyOnAssignment: boolean
}

interface RoleNotificationConfigProps {
  /**
   * Called whenever the config list changes (after a successful PATCH).
   * The parent page passes this to allow the per-user routing table to
   * re-evaluate which roles are eligible for creation notifications.
   */
  onConfigChange?: (configs: RoleConfig[]) => void
}

export function RoleNotificationConfig({ onConfigChange }: RoleNotificationConfigProps) {
  const [configs, setConfigs] = React.useState<RoleConfig[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  // Track in-flight toggles to prevent double-submissions — key: "ROLE:field"
  const [pending, setPending] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    void loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadConfigs() {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch("/api/admin/role-notification-config")
      if (!res.ok) throw new Error("Falha ao carregar configuracoes de papel")

      const data = (await res.json()) as { configs: RoleConfig[] }

      // Sort into our fixed display order
      const sorted = ROLE_DISPLAY_ORDER.map((role) => {
        const found = data.configs.find((c) => c.role === role)
        // Fallback to defaults if the API somehow omits a role
        return found ?? { role, notifyOnCreation: false, notifyOnAssignment: false }
      })

      setConfigs(sorted)
      onConfigChange?.(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggle(
    role: RoleKey,
    field: "notifyOnCreation" | "notifyOnAssignment",
    value: boolean
  ) {
    const key = `${role}:${field}`
    if (pending.has(key)) return

    // Optimistic update
    const updatedConfigs = configs.map((c) =>
      c.role === role ? { ...c, [field]: value } : c
    )
    setConfigs(updatedConfigs)
    onConfigChange?.(updatedConfigs)
    setPending((prev) => new Set(prev).add(key))

    try {
      const res = await fetch("/api/admin/role-notification-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Partial PATCH — send only the changed entry
        body: JSON.stringify({ configs: [{ role, [field]: value }] }),
      })

      if (!res.ok) {
        // Revert optimistic update
        const reverted = configs.map((c) =>
          c.role === role ? { ...c, [field]: !value } : c
        )
        setConfigs(reverted)
        onConfigChange?.(reverted)
        return
      }

      // Replace state with the full updated list returned by the server
      const data = (await res.json()) as { configs: RoleConfig[] }
      const sorted = ROLE_DISPLAY_ORDER.map((r) => {
        const found = data.configs.find((c) => c.role === r)
        return found ?? { role: r, notifyOnCreation: false, notifyOnAssignment: false }
      })
      setConfigs(sorted)
      onConfigChange?.(sorted)
    } catch {
      // Revert on network error
      const reverted = configs.map((c) =>
        c.role === role ? { ...c, [field]: !value } : c
      )
      setConfigs(reverted)
      onConfigChange?.(reverted)
    } finally {
      setPending((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px]">Papel</TableHead>
            <TableHead className="text-center">Notificar ao Criar</TableHead>
            <TableHead className="text-center">Notificar ao Atribuir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.role}>
              <TableCell>
                <span className="font-medium">{ROLE_LABELS[config.role]}</span>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={config.notifyOnCreation}
                  disabled={pending.has(`${config.role}:notifyOnCreation`)}
                  onCheckedChange={(checked) =>
                    void handleToggle(config.role, "notifyOnCreation", checked)
                  }
                  aria-label={`Ativar notificacao de criacao para ${ROLE_LABELS[config.role]}`}
                />
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={config.notifyOnAssignment}
                  disabled={pending.has(`${config.role}:notifyOnAssignment`)}
                  onCheckedChange={(checked) =>
                    void handleToggle(config.role, "notifyOnAssignment", checked)
                  }
                  aria-label={`Ativar notificacao de atribuicao para ${ROLE_LABELS[config.role]}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
