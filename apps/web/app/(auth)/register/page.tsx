import { RegisterForm } from "@/components/auth/register-form"

export const metadata = {
  title: "Join the Clan — ShinobiOps",
  description: "Create your ShinobiOps account",
}

// Server Component: just renders the client form.
// Redirect logic for already-authenticated users is handled by middleware.
export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Join the Clan</h2>
        <p className="mt-0.5 text-sm text-white/50">Create your shinobi profile</p>
      </div>
      <RegisterForm />
    </>
  )
}
