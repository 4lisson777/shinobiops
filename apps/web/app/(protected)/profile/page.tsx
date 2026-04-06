import { ProfileForm } from "@/components/profile/profile-form"

export const metadata = {
  title: "Profile — ShinobiOps",
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your name, alias, and preferences
        </p>
      </div>
      <ProfileForm />
    </div>
  )
}
