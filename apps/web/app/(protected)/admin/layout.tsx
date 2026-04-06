// Admin section layout — role guard handled by middleware (TECH_LEAD only).
// This layout is transparent; AppShell in (protected)/layout.tsx provides navigation.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
