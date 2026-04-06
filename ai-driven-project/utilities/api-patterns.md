# Context: API Patterns

**ID**: CTX-UTIL-002  
**Category**: Utility  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-003

<!-- @context-meta
{
  "id": "CTX-UTIL-002",
  "category": "utility",
  "dependencies": ["CTX-CORE-003"],
  "tags": ["api", "routes", "rest", "validation", "zod", "error-handling"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

API routes follow Next.js App Router conventions at `/api/*`. RESTful design with Zod validation, role-based auth checks on every endpoint, and JSON responses via `Response` objects. All routes enforce authentication except public endpoints.

## Key Information

### Route Convention

```
apps/web/app/api/
├── auth/
│   ├── login/route.ts          # POST — login
│   ├── register/route.ts       # POST — register
│   └── logout/route.ts         # POST — logout
├── tickets/
│   ├── route.ts                # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts            # GET, PUT, DELETE
│       ├── assign/route.ts     # POST — assign ticket
│       ├── reorder/route.ts    # POST — reorder ticket
│       └── events/route.ts     # GET — timeline events
├── bugs/
│   ├── route.ts                # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts            # GET, PUT
│       └── clickup-export/route.ts  # GET — ClickUp format
├── reorder-requests/
│   ├── route.ts                # GET, POST
│   └── [id]/route.ts           # PUT (approve/decline)
├── help-requests/
│   ├── route.ts                # GET, POST
│   └── [id]/respond/route.ts   # POST — respond to help
├── checkpoints/
│   ├── route.ts                # GET, POST
│   └── config/route.ts         # GET, PUT
├── notifications/
│   ├── route.ts                # GET
│   └── [id]/read/route.ts      # PUT — mark as read
├── users/
│   ├── route.ts                # GET (list)
│   └── [id]/
│       ├── route.ts            # GET, PUT
│       └── notifications/route.ts  # GET, PUT (notification config)
└── sse/route.ts                # GET — SSE stream
```

### Handler Pattern

Each route file exports named functions: `GET`, `POST`, `PUT`, `DELETE`.

Standard handler structure:
1. Validate session (auth check)
2. Check role permissions
3. Parse and validate request body with Zod
4. Execute business logic
5. Return JSON `Response`

### Validation

Use **Zod** for all request body validation:
```typescript
import { z } from "zod"

const CreateTicketSchema = z.object({
  title: z.string().max(120),
  description: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  deadline: z.string().datetime(),
})
```

### Error Handling

- Return appropriate HTTP status codes (400, 401, 403, 404, 500)
- User-friendly error messages in JSON response body
- Never expose internal error details to client

### Auth Check Pattern

Every protected endpoint must:
1. Read session from cookie
2. Validate session is active
3. Check user role against endpoint requirements
4. Return 401 (no session) or 403 (insufficient role)

### Phase 2 Implemented Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets` | Any auth | List tickets with filters and pagination |
| POST | `/api/tickets` | SUPPORT_MEMBER, SUPPORT_LEAD | Create ticket or bug report |
| GET | `/api/tickets/[id]` | Any auth | Fetch by internal id or publicId (TKT-/BUG- prefix auto-detected) |
| PATCH | `/api/tickets/[id]` | DEVELOPER, TECH_LEAD | Update status (DEV+TL) or severity/deadline (TL only) |
| DELETE | `/api/tickets/[id]` | TECH_LEAD | Soft-delete (sets status to CANCELLED) |
| POST | `/api/tickets/[id]/assign` | DEVELOPER, TECH_LEAD | Assign ticket; DEVELOPER can only self-assign |
| GET | `/api/tickets/[id]/events` | Any auth | List immutable timeline events |
| GET | `/api/users` | Any auth | List users; supports `?role=` and `?isActive=` filters |

### Route Context Params

Next.js App Router passes `params` as a Promise in route handlers:
```typescript
type RouteContext = { params: Promise<{ id: string }> }
export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params
}
```

## Code References

- `apps/web/lib/auth.ts` — Auth utilities and role check helpers
- `apps/web/lib/session.ts` — Session validation for API routes
- `apps/web/lib/types.ts` — Shared type definitions
- `apps/web/lib/schemas/ticket-schemas.ts` — Zod schemas for ticket routes
- All files under `apps/web/app/api/` — API route implementations

## Related Contexts

- [CTX-CORE-003 Authentication](../core/authentication.md) — Session validation and RBAC details
- [CTX-CORE-002 Data Model](../core/data-model.md) — Entity shapes for request/response
- [CTX-INFRA-003 Real-Time](../infrastructure/realtime.md) — SSE endpoint at `/api/sse`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
| 2026-04-05 | Phase 2: Added ticket CRUD, assign, events, and users list endpoints | Senior Backend Agent |
