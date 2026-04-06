import { redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/auth"

// Role-based redirect — middleware already guards authenticated routes,
// but this server component provides the actual destination routing from root.
export default async function RootPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login")
  }

  const role = session.role
  if (role === "TECH_LEAD" || role === "DEVELOPER") {
    redirect("/dev")
  }

  // SUPPORT_MEMBER, SUPPORT_LEAD
  redirect("/support")
}
