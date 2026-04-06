// Dev section layout — role guard handled by middleware (DEVELOPER + TECH_LEAD).
// This layout is transparent; AppShell in (protected)/layout.tsx provides navigation.
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
