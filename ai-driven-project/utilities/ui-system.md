# Context: UI System

**ID**: CTX-UTIL-001  
**Category**: Utility  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-001

<!-- @context-meta
{
  "id": "CTX-UTIL-001",
  "category": "utility",
  "dependencies": ["CTX-CORE-001"],
  "tags": ["shadcn", "tailwind", "theme", "components", "radix", "hugeicons", "css-variables"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

ShinobiOps uses shadcn/ui (Radix UI + Tailwind CSS 4.1) with a ninja-themed design system. Mira style, radix-light base. Components live in `packages/ui/`. HugeIcons for iconography. Dark/light mode via next-themes with CSS variables.

## Key Information

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Deep Navy `#1A1A2E` | Backgrounds, primary elements |
| Accent | Crimson `#E94560` | CTAs, highlights, active states |
| Neutral | Off-white | Content surfaces |

### Severity Colors (Belt-Rank System)

| Severity | Color | Visual |
|----------|-------|--------|
| Low | White | Neutral, minimal urgency |
| Medium | Green | Moderate attention |
| High | Red | Urgent |
| Critical | Black | Maximum urgency |

### Component Architecture

**Shared library** (`packages/ui/`):
- shadcn/ui components: Button, Card, Dialog, Input, Label, Select, Textarea, Badge, Table, Tabs, Tooltip, Popover, Avatar, Skeleton, Separator, Form, Dropdown Menu, Toast/Toaster
- Custom: `SeverityBadge` — belt-rank severity indicator
- Utility: `cn()` function for merging Tailwind classes
- Hook: `useLocalStorage` for client-side persistence

**Adding a new shadcn/ui component:**
```bash
npx shadcn@latest add [component-name] -c apps/web
```
This places the component in `packages/ui/src/components/`.

### Icons

- **HugeIcons** (`@hugeicons/react`, `@hugeicons/core`)
- Ninja-themed icons: shuriken, katana, smoke bomb, scroll motifs (SVG)
- Import: `import { IconName } from "@hugeicons/react"`

### Theming

- **Dark/light mode**: `next-themes` with `ThemeProvider`
- **CSS variables**: Defined in `packages/ui/src/styles/globals.css`
- **shadcn/ui style**: Mira, radix-light theme
- Dev shortcut: Press `d` in browser to toggle dark mode

### Class Merging

Always use `cn()` from `@workspace/ui/lib/utils` to merge Tailwind classes:
```tsx
import { cn } from "@workspace/ui/lib/utils"
<div className={cn("base-classes", conditional && "extra-class", className)} />
```

### Component Conventions

- Accept `className` prop for Tailwind flexibility
- Use TypeScript strict typing
- Server Components by default; `"use client"` only when needed
- Accessible (WCAG-compliant via Radix UI primitives)

## Code References

- `packages/ui/src/styles/globals.css` — Global CSS, Tailwind config, CSS variables
- `packages/ui/src/lib/utils.ts` — `cn()` utility
- `packages/ui/src/components/` — All shared components
- `packages/ui/src/components/severity-badge.tsx` — Custom severity badge
- `packages/ui/src/hooks/use-local-storage.ts` — Local storage hook
- `packages/ui/components.json` — shadcn/ui configuration
- `apps/web/components.json` — App-level shadcn/ui config (aliases, icon lib)
- `apps/web/components/theme-provider.tsx` — next-themes provider wrapper

## Related Contexts

- [CTX-CORE-001 Architecture](../core/architecture.md) — Component placement rules
- [CTX-UTIL-003 Dev Tooling](dev-tooling.md) — Prettier with Tailwind class sorting

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
