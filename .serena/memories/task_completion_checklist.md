# ShinobiOps — Task Completion Checklist

When finishing any implementation task, run these steps from the **monorepo root**:

## 1. Type check
```bash
npm run typecheck
```
Fix all TypeScript errors before proceeding.

## 2. Lint
```bash
npm run lint
```
Fix all ESLint errors/warnings.

## 3. Format
```bash
npm run format
```
Auto-fixes Prettier formatting and sorts Tailwind classes.

## 4. Build verification (for significant changes)
```bash
npm run build
```

## 5. Update task tracker
- Mark completed tasks as `[x]` in `/docs/TASKS.md`
- Update the relevant `steps-N.md` if the approach differed from the plan

## 6. DB changes
If the Prisma schema was modified:
```bash
cd apps/web
npx prisma migrate dev --name <descriptive-name>
npx prisma generate
```

## Notes
- The project has no automated tests in v1.0 (PRD-confirmed). Manual verification is the current standard.
- Docker setup is Phase 5 scope — not needed for development.
