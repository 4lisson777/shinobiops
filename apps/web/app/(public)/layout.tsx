// Public layout — no authentication required.
// Used for /dev/tv (Ninja Board TV mode) and similar public-facing pages.
// Minimal chrome: no header, no sidebar, just the content.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
