# Context: Authentication

**ID**: CTX-CORE-003  
**Category**: Core  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-002

<!-- @context-meta
{
  "id": "CTX-CORE-003",
  "category": "core",
  "dependencies": ["CTX-CORE-002"],
  "tags": ["auth", "session", "rbac", "roles", "middleware", "bcrypt", "jwt"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

ShinobiOps uses custom session-based authentication with HTTP-only cookies. Passwords are hashed with bcrypt (cost >= 12). Four roles with hierarchical permissions are enforced on both UI and API routes. No external auth provider — runs on internal network only.

## Key Information

### Authentication Flow

1. **Registration** (`POST /api/auth/register`): User self-registers with name, email, password, role selection. No admin approval required (internal network). A ninja alias is auto-generated but can be overridden.
2. **Login** (`POST /api/auth/login`): Email + password → bcrypt comparison → session token in HTTP-only secure cookie.
3. **Session Validation**: Every protected route/API checks session validity server-side.
4. **Logout** (`POST /api/auth/logout`): Clears session cookie on client and server.

### Session Management

- **Token type**: JWT via `jose` library (or `iron-session` alternative)
- **Storage**: HTTP-only secure cookie (prevents XSS access to token)
- **Validation**: Server-side on every request to protected routes
- **Expiry**: Configurable session TTL

### Role-Based Access Control (RBAC)

| Role | Access Scope |
|------|-------------|
| `TECH_LEAD` | Full access: all views, admin dashboard, team management, reassign tickets, configure checkpoints and notifications |
| `DEVELOPER` | Dev views: Ninja Board, Mission Board (dev view), self-assign tickets, help requests, checkpoint responses |
| `SUPPORT_LEAD` | Support views + approve/decline any reorder request regardless of ownership |
| `SUPPORT_MEMBER` | Support views: open tickets/bugs, view queue, request reorder, view own history |

### Route Protection

| Route Group | Auth | Roles |
|-------------|------|-------|
| `(auth)/*` — `/login`, `/register` | Public | — |
| `(public)/*` — `/dev/tv` | Public | — (internal network only) |
| `(protected)/admin/*` | Required | `TECH_LEAD` only |
| `(protected)/dev/*` | Required | `TECH_LEAD`, `DEVELOPER` |
| `(protected)/support/*` | Required | `TECH_LEAD`, `SUPPORT_LEAD`, `SUPPORT_MEMBER` |
| `(protected)/ticket/*` | Required | All authenticated roles |
| `(protected)/profile` | Required | All authenticated roles |
| `/api/*` (protected endpoints) | Required | Role-checked per endpoint |

### Password Security

- **Hashing**: bcrypt with cost factor >= 12 (~100ms per hash)
- **Storage**: Only `passwordHash` stored, never plaintext
- **Comparison**: Timing-safe bcrypt compare

### Profile Management

Users can update: name, avatar, password, ninja alias. Role changes are **Tech Lead only** via admin dashboard.

## Code References

- `apps/web/lib/auth.ts` — Authentication utilities, password hashing, role checks
- `apps/web/lib/session.ts` — Session creation, validation, cookie management
- `apps/web/app/api/auth/login/route.ts` — Login endpoint
- `apps/web/app/api/auth/register/route.ts` — Registration endpoint
- `apps/web/app/api/auth/logout/route.ts` — Logout endpoint
- `apps/web/app/(protected)/layout.tsx` — Protected route layout (session check)
- `apps/web/components/auth/login-form.tsx` — Login form component
- `apps/web/components/auth/register-form.tsx` — Registration form component

## Related Contexts

- [CTX-CORE-002 Data Model](data-model.md) — User entity with roles and password hash
- [CTX-UTIL-002 API Patterns](../utilities/api-patterns.md) — How auth checks are applied in API routes

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
