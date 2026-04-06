import { z } from "zod"

export const ticketCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  deadline: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be ISO date or datetime")),
})

export const bugCreateSchema = ticketCreateSchema.extend({
  affectedModule: z.string().min(1, "Affected module is required"),
  stepsToReproduce: z.string().min(1, "Steps to reproduce are required"),
  expectedBehavior: z.string().min(1, "Expected behavior is required"),
  actualBehavior: z.string().min(1, "Actual behavior is required"),
  environment: z.enum(["PRODUCTION", "STAGING", "OTHER"]),
  customerId: z.string().optional(),
})

export const ticketUpdateSchema = z
  .object({
    status: z
      .enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_INFO", "DONE", "CANCELLED"])
      .optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
    deadline: z.string().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  })

export const ticketFilterSchema = z.object({
  type: z.enum(["TICKET", "BUG"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "WAITING_FOR_INFO", "DONE", "CANCELLED"])
    .optional(),
  assignedToId: z.string().optional(),
  openedById: z.string().optional(),
  search: z.string().optional(),
  // Date range filters (ISO date strings)
  createdFrom: z.string().datetime({ offset: true }).optional(),
  createdTo: z.string().datetime({ offset: true }).optional(),
  resolvedFrom: z.string().datetime({ offset: true }).optional(),
  resolvedTo: z.string().datetime({ offset: true }).optional(),
  // Sorting
  sortBy: z
    .enum(["createdAt", "resolvedAt", "severity", "status", "priorityOrder"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const assignSchema = z.object({
  assignedToId: z.string().min(1, "assignedToId is required"),
})
