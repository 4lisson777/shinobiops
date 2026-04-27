import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "../generated/prisma/client"

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? "3306"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 8,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false,
    } : undefined,
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Module-level singleton for production. In development we use globalThis
// instead so HMR module reloads do not multiply Prisma clients.
//
// The previous implementation returned `createPrismaClient()` on every call in
// production. Combined with the Proxy below (which calls `getDb()` on every
// property access on `db`), this leaked a fresh `mariadb.createPool` for every
// Prisma operation -- exhausting MySQL's `max_connections` (~150) within a
// handful of requests and surfacing as `pool timeout: ... active=0 idle=0`.
let prismaInstance: PrismaClient | undefined

export function getDb(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    globalThis.__prisma ??= createPrismaClient()
    return globalThis.__prisma
  }
  prismaInstance ??= createPrismaClient()
  return prismaInstance
}

// Lazy proxy: defers PrismaClient creation until a property is accessed at request time,
// preventing connection attempts during Next.js static build.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})
