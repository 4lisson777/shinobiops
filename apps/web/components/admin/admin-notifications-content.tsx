"use client"

import * as React from "react"
import { RoleNotificationConfig } from "@/components/admin/role-notification-config"
import { NotificationRouting } from "@/components/admin/notification-routing"

type RoleKey = "TECH_LEAD" | "DEVELOPER" | "QA" | "SUPPORT_LEAD" | "SUPPORT_MEMBER"

interface RoleConfig {
  role: RoleKey
  notifyOnCreation: boolean
  notifyOnAssignment: boolean
}

/**
 * Client orchestrator for the /admin/notifications page.
 *
 * Manages the eligibleRoles state that flows from the role-level config table
 * down to the per-user routing table. When the Tech Lead toggles a role's
 * notifyOnCreation flag, the per-user table immediately re-filters its list
 * without a full page reload.
 */
export function AdminNotificationsContent() {
  // null = role configs haven't loaded yet (prevents per-user table from fetching with stale data)
  const [eligibleRoles, setEligibleRoles] = React.useState<RoleKey[] | null>(null)

  function handleConfigChange(configs: RoleConfig[]) {
    const eligible = configs
      .filter((c) => c.notifyOnCreation)
      .map((c) => c.role)
    setEligibleRoles(eligible)
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Roteamento de Notificacoes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie quais papeis e membros recebem notificacoes de chamados e bugs
        </p>
      </div>

      {/* Section 1: Role-level gates */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Configuracao por Papel</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina quais papeis recebem notificacoes de criacao e atribuicao de chamados
          </p>
        </div>
        <RoleNotificationConfig onConfigChange={handleConfigChange} />
      </section>

      {/* Section 2: Per-user routing — only shows users in roles with notifyOnCreation enabled */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Roteamento Individual</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure quais membros dos papeis habilitados recebem notificacoes de chamados e bugs.
            Membros em papeis com notificacao de criacao desativada nao recebem notificacoes de criacao
            independentemente desta configuracao.
          </p>
        </div>
        <NotificationRouting eligibleRoles={eligibleRoles} />
      </section>
    </div>
  )
}
