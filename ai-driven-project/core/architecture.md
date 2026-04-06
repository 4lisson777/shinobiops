# Context: Architecture

**ID**: CTX-CORE-001  
**Category**: Core  
**Last Updated**: 2026-04-05  
**Dependencies**: None

<!-- @context-meta
{
  "id": "CTX-CORE-001",
  "category": "core",
  "dependencies": [],
  "tags": ["architecture", "routing", "monorepo", "nextjs", "turbo"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

ShinobiOps is a Turbo monorepo with npm workspaces. The main application is a Next.js 16 app using the App Router with Server Components by default. Shared UI lives in a separate `packages/ui` library. TypeScript strict mode is enforced everywhere.

## Key Information

### Monorepo Layout

```
.
├── apps/
│   └── web/                          # Next.js 16 (App Router) — main application
│       ├── app/                      # File-based routing (pages, layouts, API routes)
│       │   ├── (auth)/               # Route group: login, register (public)
│       │   ├── (protected)/          # Route group: all authenticated routes
│       │   │   ├── admin/            # Command Dojo (Tech Lead only)
│       │   │   ├── dev/              # Ninja Board, dev queue
│       │   │   ├── support/          # Support team views
│       │   │   ├── ticket/[publicId] # Ticket detail page
│       │   │   └── profile/          # User profile settings
│       │   ├── (public)/             # Route group: unauthenticated public pages
│       │   │   └── dev/tv/           # TV mode (no auth required)
│       │   └── api/                  # RESTful API endpoints
│       ├── components/               # App-specific components (by domain)
│       ├── hooks/                    # App-specific React hooks
│       └── lib/                      # Utilities: db, auth, session, types
├── packages/
│   ├── ui/                           # @workspace/ui — shared component library
│   │   ├── src/components/           # shadcn/ui + custom shared components
│   │   ├── src/hooks/                # Shared React hooks
│   │   ├── src/lib/                  # cn() utility, validators
│   │   └── src/styles/               # globals.css, Tailwind config
│   ├── typescript-config/            # Shared tsconfig presets
│   └── eslint-config/                # Shared ESLint presets
├── turbo.json                        # Task definitions and caching
└── package.json                      # Root workspace config
```

### Route Groups

The app uses Next.js route groups to separate auth concerns:

| Group | Path Prefix | Auth Required | Purpose |
|-------|-------------|---------------|---------|
| `(auth)` | `/login`, `/register` | No | Authentication pages |
| `(protected)` | `/admin/*`, `/dev/*`, `/support/*`, `/profile`, `/ticket/*` | Yes | All authenticated routes |
| `(public)` | `/dev/tv` | No | TV mode display (internal network only) |

### Path Aliases

| Alias | Resolves To | Used In |
|-------|-------------|---------|
| `@/*` | `apps/web/*` | App-local imports |
| `@workspace/ui/*` | `packages/ui/src/*` | Shared UI components |

### Component Placement Rules

- **Shared across packages** → `packages/ui/src/components/` (export in `package.json`)
- **App-specific** → `apps/web/components/` (organized by domain subfolder)
- **Domain subfolders in web**: `auth/`, `admin/`, `dev/`, `support/`, `ticket/`, `mission-board/`, `layout/`, `tv/`

### Server vs Client Components

- **Default**: Server Components (no directive needed)
- **Client Components**: Add `"use client"` only when using state, event handlers, or browser hooks
- All components in `apps/web/components/` that use interactivity are Client Components

### Key Technical Decisions

- **Node.js >= 20** required
- **npm 11.6.2** as package manager
- **Turbo** for build orchestration and caching
- **100% TypeScript** with strict mode
- **Tailwind CSS 4.1** via PostCSS

## Code References

- `turbo.json` — Task definitions (build, dev, lint, format, typecheck)
- `package.json` — Root workspace config and scripts
- `apps/web/app/layout.tsx` — Root layout
- `apps/web/app/page.tsx` — Entry point (role-based redirect)
- `apps/web/app/(protected)/layout.tsx` — Auth-protected layout wrapper
- `apps/web/tsconfig.json` — Path alias configuration
- `apps/web/components.json` — shadcn/ui configuration
- `packages/ui/package.json` — Shared UI package exports

## Related Contexts

- [CTX-UTIL-001 UI System](../utilities/ui-system.md) — Component library and styling details
- [CTX-UTIL-003 Dev Tooling](../utilities/dev-tooling.md) — Build pipeline and linting config

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
