// Support section layout — role guard handled by middleware (SUPPORT_MEMBER + SUPPORT_LEAD).
// This layout is transparent; AppShell in (protected)/layout.tsx provides navigation.
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
