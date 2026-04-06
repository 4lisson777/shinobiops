// Shared TypeScript enums and types used across the application.
// These mirror the Prisma schema enums and provide type safety in API routes.

export const Role = {
  TECH_LEAD: "TECH_LEAD",
  DEVELOPER: "DEVELOPER",
  SUPPORT_LEAD: "SUPPORT_LEAD",
  SUPPORT_MEMBER: "SUPPORT_MEMBER",
  QA: "QA",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const ALL_ROLES: Role[] = [
  Role.TECH_LEAD,
  Role.DEVELOPER,
  Role.SUPPORT_LEAD,
  Role.SUPPORT_MEMBER,
  Role.QA,
]

export const DevStatus = {
  ACTIVE: "ACTIVE",
  IN_CHECKPOINT: "IN_CHECKPOINT",
  BLOCKED: "BLOCKED",
  HELPING: "HELPING",
} as const

export type DevStatus = (typeof DevStatus)[keyof typeof DevStatus]

// Safe user shape returned from API responses (passwordHash excluded)
export interface SafeUser {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl: string | null
  ninjaAlias: string
  isActive: boolean
  notifyTickets: boolean
  notifyBugs: boolean
  soundEnabled: boolean
  devStatus: DevStatus | null
  currentTask: string | null
  createdAt: Date
  updatedAt: Date
}
