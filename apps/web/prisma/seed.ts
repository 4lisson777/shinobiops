import "dotenv/config"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

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
  role: "TECH_LEAD" | "DEVELOPER" | "SUPPORT_LEAD" | "SUPPORT_MEMBER" | "QA"
  ninjaAlias: string
}

const SEED_USERS: SeedUser[] = [
  // Tech Lead (1)
  {
    name: "Alisson Lima",
    email: "alisson.lima@shinobiops.dev",
    password: "Password123!",
    role: "TECH_LEAD",
    ninjaAlias: "IronJonin",
  },
  // Developers (4)
  {
    name: "Matheus",
    email: "matheus@shinobiops.dev",
    password: "Password123!",
    role: "DEVELOPER",
    ninjaAlias: "SilentBlade",
  },
  {
    name: "Marcos",
    email: "marcos@shinobiops.dev",
    password: "Password123!",
    role: "DEVELOPER",
    ninjaAlias: "StormKunai",
  },
  {
    name: "Ivson",
    email: "ivson@shinobiops.dev",
    password: "Password123!",
    role: "DEVELOPER",
    ninjaAlias: "VoidSerpent",
  },
  {
    name: "Guilherme",
    email: "guilherme@shinobiops.dev",
    password: "Password123!",
    role: "DEVELOPER",
    ninjaAlias: "EmberShuriken",
  },
  // Support Lead (1)
  {
    name: "Alisson Rosa",
    email: "alisson.rosa@shinobiops.dev",
    password: "Password123!",
    role: "SUPPORT_LEAD",
    ninjaAlias: "SwiftCrane",
  },
  // Support Members (2)
  {
    name: "Bruno Carvalho",
    email: "bruno@shinobiops.dev",
    password: "Password123!",
    role: "SUPPORT_MEMBER",
    ninjaAlias: "CrimsonFang",
  },
  {
    name: "Leticia Duarte",
    email: "leticia@shinobiops.dev",
    password: "Password123!",
    role: "SUPPORT_MEMBER",
    ninjaAlias: "MistSparrow",
  },
  // QA (1)
  {
    name: "Nicoli",
    email: "nicoli@shinobiops.dev",
    password: "Password123!",
    role: "QA",
    ninjaAlias: "ShadowSeal",
  },
]

interface RoleNotificationDefault {
  role: "TECH_LEAD" | "DEVELOPER" | "QA" | "SUPPORT_LEAD" | "SUPPORT_MEMBER"
  notifyOnCreation: boolean
  notifyOnAssignment: boolean
}

const ROLE_NOTIFICATION_DEFAULTS: RoleNotificationDefault[] = [
  { role: "TECH_LEAD", notifyOnCreation: true, notifyOnAssignment: true },
  { role: "DEVELOPER", notifyOnCreation: true, notifyOnAssignment: true },
  { role: "QA", notifyOnCreation: true, notifyOnAssignment: false },
  { role: "SUPPORT_LEAD", notifyOnCreation: false, notifyOnAssignment: false },
  { role: "SUPPORT_MEMBER", notifyOnCreation: false, notifyOnAssignment: false },
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

  console.log("Seeding role notification configs...")

  for (const defaults of ROLE_NOTIFICATION_DEFAULTS) {
    await prisma.roleNotificationConfig.upsert({
      where: { role: defaults.role },
      update: {},
      create: {
        role: defaults.role,
        notifyOnCreation: defaults.notifyOnCreation,
        notifyOnAssignment: defaults.notifyOnAssignment,
      },
    })

    console.log(
      `  Upserted role config: ${defaults.role} (creation=${defaults.notifyOnCreation}, assignment=${defaults.notifyOnAssignment})`
    )
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
