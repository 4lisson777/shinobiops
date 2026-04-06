# ShinobiOps — Code Style & Conventions

## TypeScript
- **100% TypeScript**, strict mode, no implicit `any`
- All new code must be fully typed
- Use `type` for object shapes, `interface` only when extending is needed
- Zod schemas for all external input validation (API routes, forms)

## React / Next.js
- **Server Components by default** — only add `"use client"` when needed (state, event handlers, browser APIs)
- File-based routing via `/app` directory (App Router)
- API routes: export named functions `GET`, `POST`, `PATCH`, `DELETE` returning `Response` objects
- Use `NextRequest` / `NextResponse` when needed; prefer plain `Response` for simple JSON

## Component Conventions
- Shared cross-app components: `packages/ui/src/components/`
- App-specific components: `apps/web/components/`
- Always accept and forward `className` prop; merge with `cn()` from `@workspace/ui/lib/utils`
- Prefer composition over large monolithic components

## Imports
- Shared UI: `import { Button } from "@workspace/ui/components/button"`
- Utilities: `import { cn } from "@workspace/ui/lib/utils"`
- App internals: `import { ... } from "@/lib/..."` or `"@/components/..."`

## Naming
- Files: `kebab-case.tsx` / `kebab-case.ts`
- Components: `PascalCase`
- Functions/variables: `camelCase`
- DB models/enums: `PascalCase` (Prisma convention)
- API route files: always `route.ts`

## Styling
- Tailwind CSS utility classes; no inline styles
- Use CSS variables (defined in `packages/ui/src/styles/globals.css`) for theme colors
- Dark mode via `dark:` prefixes (next-themes configured)
- Class merging via `cn()` utility

## No-Nos
- No `any` types
- No direct `fetch` calls to external services (internal network only)
- No mocking in tests — use real DB (integration tests preferred)
- No comments unless logic is non-obvious
- No speculative abstractions — build only what is needed now
