import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Enter the Dojo — ShinobiOps",
  description: "Sign in to ShinobiOps",
}

// Server Component: just renders the client form.
// Redirect logic for already-authenticated users is handled by middleware.
export default function LoginPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Welcome back, Shinobi</h2>
        <p className="mt-0.5 text-sm text-white/50">Sign in to continue your mission</p>
      </div>
      <LoginForm />
    </>
  )
}
