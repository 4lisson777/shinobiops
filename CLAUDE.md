# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ShinobiOps** is an internal fullstack web application for Inovar Sistemas that unites customer support and development teams around production issue escalation and real-time team coordination. It uses a **monorepo structure** with **Next.js** and a shared **shadcn/ui component library**.

**Key Documents:**
- `/docs/PRD.md` — Complete product requirements and feature spec
- `/docs/TECH-STACK.md` — Detailed technology choices and justifications

---

## Quick Commands

```bash
# Install dependencies (run from root)
npm install

# Development server (runs all packages with hot reload via Turbopack)
npm run dev

# Build all packages
npm run build

# Lint all code
npm run lint

# Format all code (fixes formatting, sorts Tailwind classes)
npm run format

# Type check entire codebase
npm run typecheck

# Start production build (after npm run build)
npm start -w web
```

---

## Monorepo Structure

This is a **Turbo monorepo** with npm workspaces. All commands run via Turbo for parallelization and caching.

```
.
├── apps/
│   └── web/                          # Next.js 16 application (main app)
│       ├── app/                      # App Router pages, layouts, and API routes
│       ├── components/               # Local app-specific components
│       ├── hooks/                    # Local custom hooks
│       ├── lib/                      # Utilities and helper functions
│       ├── components.json           # shadcn/ui config (aliases, icon lib, style)
│       ├── next.config.mjs           # Next.js configuration
│       ├── eslint.config.js          # Extends @workspace/eslint-config/next-js
│       └── tsconfig.json             # Extends @workspace/typescript-config/nextjs.json
│
├── packages/
│   ├── ui/                           # Shared UI component library (@workspace/ui)
│   │   ├── src/
│   │   │   ├── components/           # shadcn/ui + custom shared components
│   │   │   ├── hooks/                # Shared React hooks
│   │   │   ├── lib/                  # Utilities: cn(), schema validators, etc.
│   │   │   └── styles/               # globals.css, Tailwind config
│   │   ├── components.json           # shadcn/ui configuration
│   │   └── tsconfig.json
│   │
│   ├── typescript-config/            # Shared TypeScript configs
│   │   ├── base.json                 # Base TypeScript config
│   │   └── nextjs.json               # Next.js-specific TypeScript config
│   │
│   └── eslint-config/                # Shared ESLint configs
│       ├── base.js                   # Base ESLint config
│       ├── next.js                   # Next.js ESLint config (used by apps/web)
│       └── react-internal.js         # React-specific rules
│
├── turbo.json                        # Turbo task definitions and caching
├── package.json                      # Root workspace config, scripts
├── tsconfig.json                     # Root TypeScript extends
└── docs/
    ├── PRD.md                        # Product Requirements Document
    └── TECH-STACK.md                 # Technical Stack Specification
```

---

## Architecture & Key Patterns

### Framework & Routing

- **Next.js 14+ (App Router)**: File-based routing via `/app` directory
- **Server Components**: Default behavior; use `"use client"` only when needed (state, events, hooks)
- **API Routes**: RESTful endpoints at `/api/*` structure
- **Dynamic Routes**: Use `[id]` or `[...slug]` for dynamic segments

### Component System

**shadcn/ui Integration:**
- Components stored in `packages/ui/src/components/`
- Imported in `apps/web` via `@workspace/ui/components/*`
- Uses **Radix UI** for headless primitives, **Tailwind CSS** for styling, **HugeIcons** for icons
- **Mira style**, radix-light theme, CSS variables for theming

**To add a new shadcn/ui component:**
```bash
# Run from root, specify the component and target directory
npx shadcn@latest add [component-name] -c apps/web
```

This places the component in `packages/ui/src/components/` and updates aliases.

**Custom Components:**
- App-specific components in `apps/web/components/`
- Shared utility components in `packages/ui/src/components/`
- Use the `cn()` utility from `@workspace/ui/lib/utils` to merge Tailwind classes

### Styling & Theme

- **Tailwind CSS 4.1** with PostCSS
- **CSS Variables** for theming (dark/light mode via `next-themes`)
- **Color Palette**:
  - Primary: Deep Navy `#1A1A2E`
  - Accent: Crimson `#E94560`
  - Severity colors: White (Low), Green (Medium), Red (High), Black (Critical)
- Dark mode toggled via `next-themes`; press **`d`** to toggle in browser dev tools

### Type Safety

- **100% TypeScript** across all packages
- **Strict mode** enabled (no implicit `any`)
- Path aliases:
  - `@/*` → `apps/web/*` (app imports)
  - `@workspace/ui/*` → `packages/ui/src/*` (shared library)
- **Zod** for schema validation (available in `@workspace/ui/lib`)

### Code Quality

- **ESLint** (Next.js rules, React hooks, Turbo linting)
- **Prettier** with Tailwind class sorting
- Run `npm run lint` to check all packages
- Run `npm run format` to auto-fix formatting and class order

---

## Database & API (Planned)

Per the PRD and TECH-STACK.md:
- **ORM**: Prisma with `@prisma/adapter-mariadb`
- **Database**: MySQL 8.4 (Docker)
- **Auth**: Session-based (HTTP-only cookies), bcrypt for passwords
- **Real-Time**: Server-Sent Events (SSE) for push notifications

These will be added in subsequent phases.

---

## Data Model (Reference from PRD)

Key entities (when implementing):

- **User**: id, name, email, passwordHash, role, avatarUrl, ninjaAlias, notifyTickets, notifyBugs
- **Ticket**: id, publicId (TKT-XXXX), title, description, type (TICKET|BUG), severity, status, deadline, priorityOrder, openedById, assignedToId
- **BugReport**: extends Ticket with affectedModule, stepsToReproduce, expectedBehavior, actualBehavior, environment, customerId
- **ReorderRequest**: ticketId, requestedById, requestedPosition, reason, status, resolvedAt
- **HelpRequest**: requestedById, contextMessage, responses
- **Checkpoint**: userId, currentTask, isBlocked, notes
- **CheckpointConfig**: intervalMinutes, activeHoursStart, activeHoursEnd, isEnabled
- **Notification**: userId, type, referenceId, message, isRead
- **TicketEvent**: ticketId, eventType, actorId, metadata (immutable timeline)

See `/docs/PRD.md` section 9 for full schema.

---

## Pages & Routes (Planned)

```
Auth:
  /login              - Email + password login
  /register           - Self-service registration, role selection

Support Team:
  /support            - Action selection (Ticket or Bug)
  /support/ticket/new - Create ticket form
  /support/bug/new    - Report bug form (with ClickUp export)
  /support/queue      - Mission Board (priority queue view)
  /support/my-items   - Personal ticket & bug history

Development Team:
  /dev                - Ninja Board (team overview with dev cards)
  /dev/queue          - Mission Board (dev-specific view, filters)
  /dev/tv             - Read-only Ninja Board for office displays

Admin / Tech Lead:
  /admin              - Command Dojo (overview dashboard)
  /admin/team         - Team member management
  /admin/notifications - Notification routing config
  /admin/checkpoints  - Checkpoint configuration
  /admin/log          - Full ticket & bug history

Shared:
  /                   - Role-based redirect
  /ticket/:publicId   - Detail page with timeline (any role)
  /profile            - User profile settings
```

---

## Environment & Configuration

- **Node.js**: ≥20 (specified in package.json `engines`)
- **npm**: 11.6.2
- **.env files**: Not committed; create locally for secrets (DB_URL, SESSION_SECRET, etc.)
- **PORT**: 3000 (default for Next.js)

---

## Common Development Tasks

### Adding a Page

1. Create file in `apps/web/app/[route]/page.tsx`
2. Use React Server Components by default
3. Add `"use client"` directive only if needed (state, event handlers, hooks)
4. Import shared UI components from `@workspace/ui/components/*`

### Adding a Component

1. **Shared across packages**: Add to `packages/ui/src/components/` and export in `packages/ui/package.json` exports field
2. **App-specific**: Add to `apps/web/components/`
3. Use TypeScript + strict typing
4. Accept `className` prop and merge with `cn()` utility for Tailwind flexibility

### Adding a New Package

1. Create directory in `packages/[name]/`
2. Add `package.json` with `"name": "@workspace/[name]"` and `"private": true`
3. Add `"packages/*"` to root `package.json` workspaces array (already configured)
4. Reference in other packages via `@workspace/[name]` import alias

### Using Next.js API Routes

1. Create `apps/web/app/api/[route]/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` functions
3. Return JSON via `Response` objects
4. Check role/auth in route handlers

### Adding Validation

Use **Zod** (already in dependencies) for schema validation:
```typescript
import { z } from "zod"

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})
```

---

## Testing (Not Yet Implemented)

The PRD does not mandate tests in v1.0, but when adding tests:
- Consider **Vitest** (fast, Vite-native) or **Jest** (Next.js default)
- Integration tests preferred over unit tests for pages/API routes
- Use `npm run test` script in relevant package

---

## Deployment

- **Docker**: Single `Dockerfile` with multi-stage build (planned)
- **Docker Compose**: Orchestrates app + MySQL service
- **Production build**: `npm run build && npm start -w web`

---

## Debugging & Troubleshooting

| Issue | Solution |
|-------|----------|
| Turbo cache issues | `turbo prune --docker` or `turbo clean` |
| Module not found | Check path aliases in `tsconfig.json` and `components.json` |
| Tailwind classes not applying | Verify file is in Tailwind content paths (in `ui/src/styles/globals.css`) |
| Type errors in IDE | Run `npm run typecheck` to match strict compilation |
| ESLint fails before commit | Run `npm run format` to auto-fix |
| Components.json mismatch | Regenerate via `shadcn@latest init` if corrupted |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `/turbo.json` | Task definitions, caching, and dependencies |
| `/apps/web/components.json` | shadcn/ui configuration (aliases, style, icons) |
| `/packages/ui/src/styles/globals.css` | Global Tailwind & CSS variables |
| `/packages/ui/src/lib/utils.ts` | `cn()` utility for merging Tailwind classes |
| `/docs/PRD.md` | Complete product spec and feature list |
| `/docs/TECH-STACK.md` | Detailed tech choices and architecture |

---

## Notes for Future Claude Instances

1. **Always check the PRD first** — it's the source of truth for requirements, user roles, and feature behavior
2. **TECH-STACK.md is your architecture reference** — understand why each technology was chosen
3. **Monorepo discipline** — use Turbo commands (`turbo lint`, `turbo build`) not individual `npm run` in subdirectories
4. **Components are shared** — before adding a component to `apps/web/components/`, consider if it should live in `packages/ui/` for reuse
5. **Type safety matters** — the codebase is 100% TypeScript; maintain it
6. **Dark mode support** — Tailwind dark mode is configured; use `dark:` prefixes for dark-mode styles
7. **Theme identity** — The ninja theme (shuriken icons, crimson accents, navy primary) is intentional; respect it in new features
8. **SSE for real-time** — Planned notification system uses Server-Sent Events, not WebSockets
9. **No external dependencies at runtime** — ShinobiOps runs on internal network only; no AWS, external APIs, etc.
10. **Defensive programming** — Role-based access checks must be enforced on both UI and API routes

---

**Last Updated:** 2025-04-05  
**Status:** Foundation phase — core framework ready, features in development
