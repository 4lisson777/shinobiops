import { TvBoard } from "@/components/tv/tv-board"

export const metadata = {
  title: "Ninja Board — TV Mode | ShinobiOps",
}

// TV Mode — full-screen read-only Ninja Board for office displays.
// Public route — no authentication required.
export default function TvPage() {
  return <TvBoard />
}
