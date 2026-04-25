import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth"
import { getSession } from "@/lib/session"
import { logger } from "@/lib/logger"

/**
 * POST /api/super-admin/stop-impersonating
 * Restores the super admin's session organizationId from the stored
 * originalOrganizationId, ending the impersonation context.
 * Auth: super admin only.
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  const { session: authSession, error } = await requireSuperAdmin()
  if (error) return error

  const session = await getSession()

  if (!session.originalOrganizationId) {
    return NextResponse.json(
      { error: "Nenhuma impersonação ativa para encerrar." },
      { status: 400 }
    )
  }

  logger.warn("Super admin impersonation stopped", {
    userId: authSession.userId,
    restoredOrgId: session.originalOrganizationId,
    wasOrgId: session.organizationId,
  })

  session.organizationId = session.originalOrganizationId
  // Clear the stored original so subsequent calls don't re-trigger
  session.originalOrganizationId = undefined
  await session.save()

  return NextResponse.json({
    message: "Impersonação encerrada com sucesso.",
    organizationId: session.organizationId,
    isImpersonating: false,
  })
}
