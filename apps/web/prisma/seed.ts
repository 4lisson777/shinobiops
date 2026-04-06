import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Apply SQLite pragmas before any seeding operations
async function applyPragmas(): Promise<void> {
  await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;")
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;")
  await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;")
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000;")
}

interface SeedUser {
  name: string
  email: string
  password: string
  role: "TECH_LEAD" | "DEVELOPER" | "SUPPORT_LEAD" | "SUPPORT_MEMBER"
  ninjaAlias: string
}

const SEED_USERS: SeedUser[] = [
  {
    name: "Yuki Tanaka",
    email: "techlead@shinobiops.dev",
    password: "Password123!",
    role: "TECH_LEAD",
    ninjaAlias: "IronJonin",
  },
  {
    name: "Ryu Hayabusa",
    email: "developer@shinobiops.dev",
    password: "Password123!",
    role: "DEVELOPER",
    ninjaAlias: "SilentBlade",
  },
  {
    name: "Mei Lin",
    email: "supportlead@shinobiops.dev",
    password: "Password123!",
    role: "SUPPORT_LEAD",
    ninjaAlias: "SwiftCrane",
  },
  {
    name: "Kenji Mori",
    email: "support@shinobiops.dev",
    password: "Password123!",
    role: "SUPPORT_MEMBER",
    ninjaAlias: "GhostFox",
  },
]

async function main(): Promise<void> {
  console.log("Applying SQLite pragmas...")
  await applyPragmas()

  console.log("Seeding development users...")

  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12)

    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        name: seedUser.name,
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        ninjaAlias: seedUser.ninjaAlias,
      },
    })

    console.log(`  Created/found user: ${user.name} (${user.role}) — ${user.email}`)
  }

  console.log("Seeding complete.")
}

main()
  .catch((error: unknown) => {
    console.error("Seed script failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
