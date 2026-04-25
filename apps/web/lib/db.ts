import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaClient } from "../generated/prisma/client"

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
  // eslint-disable-next-line no-var
  var __prismaReady: Promise<void> | undefined
}

export const db: PrismaClient = globalThis.__prisma ?? createPrismaClient()

async function applyPragmas(): Promise<void> {
  await db.$executeRawUnsafe("PRAGMA journal_mode = WAL;")
  await db.$executeRawUnsafe("PRAGMA foreign_keys = ON;")
  await db.$executeRawUnsafe("PRAGMA synchronous = NORMAL;")
  await db.$executeRawUnsafe("PRAGMA busy_timeout = 5000;")
}

export const dbReady: Promise<void> = globalThis.__prismaReady ?? applyPragmas()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db
  globalThis.__prismaReady = dbReady
}
