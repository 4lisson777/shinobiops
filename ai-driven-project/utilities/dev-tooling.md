# Context: Dev Tooling

**ID**: CTX-UTIL-003  
**Category**: Utility  
**Last Updated**: 2026-04-05  
**Dependencies**: CTX-CORE-001

<!-- @context-meta
{
  "id": "CTX-UTIL-003",
  "category": "utility",
  "dependencies": ["CTX-CORE-001"],
  "tags": ["turbo", "eslint", "prettier", "typescript", "build", "linting", "formatting"],
  "status": "current",
  "language": "en-us"
}
-->

## Summary

Development tooling uses Turbo for monorepo orchestration, ESLint for linting, Prettier (with Tailwind plugin) for formatting, and TypeScript in strict mode. All commands run from root via Turbo for parallelization and caching.

## Key Information

### Root Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start all packages in dev mode (Turbopack hot reload) |
| `npm run build` | Build all packages (outputs to `.next/**`) |
| `npm run lint` | Lint all code via ESLint |
| `npm run format` | Format all code via Prettier (fixes + sorts Tailwind classes) |
| `npm run typecheck` | Full TypeScript type checking across all packages |

### Turbo Configuration

Defined in `turbo.json`:
- **build**: Depends on `^build` (build dependencies first), cached, outputs `.next/**`
- **dev**: No cache, persistent (long-running dev server)
- **lint**: Depends on `^lint`
- **format**: Depends on `^format`
- **typecheck**: Depends on `^typecheck`

### ESLint

Shared configs in `packages/eslint-config/`:
- `base.js` — Base ESLint rules
- `next.js` — Next.js-specific rules (used by `apps/web`)
- `react-internal.js` — React-specific rules for internal packages

### Prettier

- Version: 3.8.1
- Plugin: `prettier-plugin-tailwindcss` (0.7.2) for automatic class sorting
- Consistent formatting across TypeScript and JSX

### TypeScript

- Version: 5.9.3
- **Strict mode** enabled (no implicit `any`)
- Shared configs in `packages/typescript-config/`:
  - `base.json` — Base config
  - `nextjs.json` — Next.js-specific config
  - `react-library.json` — React library config (packages/ui)

### Versions

| Tool | Version |
|------|---------|
| Turbo | 2.8.17 |
| TypeScript | 5.9.3 |
| ESLint | 9.39.2 |
| Prettier | 3.8.1 |
| Node.js | >= 20 |
| npm | 11.6.2 |

### Troubleshooting

| Issue | Fix |
|-------|-----|
| Turbo cache issues | `turbo clean` |
| Module not found | Check path aliases in `tsconfig.json` |
| Type errors in IDE | Run `npm run typecheck` |
| ESLint fails | Run `npm run format` first |

## Code References

- `turbo.json` — Turbo task definitions
- `package.json` — Root scripts and workspace config
- `packages/eslint-config/base.js` — Base ESLint config
- `packages/eslint-config/next.js` — Next.js ESLint config
- `packages/eslint-config/react-internal.js` — React internal config
- `packages/typescript-config/base.json` — Base TypeScript config
- `packages/typescript-config/nextjs.json` — Next.js TypeScript config
- `packages/typescript-config/react-library.json` — React library TypeScript config
- `apps/web/eslint.config.js` — App ESLint config (extends shared)

## Related Contexts

- [CTX-CORE-001 Architecture](../core/architecture.md) — Monorepo structure and build pipeline

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-05 | Initial context creation | AI Agent |
