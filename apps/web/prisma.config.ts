import { defineConfig } from "prisma/config"

// Use process.env directly (not Prisma's env() helper) so that an unset DB_URL
// doesn't throw at config-load time. `prisma generate` is pure codegen and never
// reads the URL; the placeholder keeps Prisma happy without baking credentials
// into the image. At runtime (prisma migrate deploy / query time) the real value
// must be present in the environment — the placeholder will fail loudly if used.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DB_URL ?? "mysql://placeholder:placeholder@placeholder:3306/placeholder"
  },
  migrations: {
    path: "./prisma/migrations",
  },
})
