# ShinobiOps — Suggested Commands

## Development (run from monorepo root)
```bash
npm install                        # install all workspace dependencies
npm run dev                        # start all packages with hot reload (Turbopack)
npm run build                      # build all packages
npm run lint                       # lint all packages
npm run format                     # format all code + sort Tailwind classes
npm run typecheck                  # type-check entire codebase
npm start -w web                   # start production build (after build)
```

## Database (run from monorepo root or apps/web)
```bash
# Setup (first time)
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env: set SESSION_SECRET (32+ chars), DATABASE_URL

cd apps/web
npx prisma generate                # generate Prisma client
npx prisma migrate deploy          # apply migrations
npm run db:seed -w apps/web        # seed dev users (one per role)

# Ongoing
npx prisma migrate dev --name <name>   # create + apply new migration
npx prisma studio                      # open DB browser UI
```

## shadcn/ui Components (run from monorepo root)
```bash
npx shadcn@latest add <component-name> -c apps/web
# Components land in packages/ui/src/components/
```

## Workspace-scoped commands
```bash
npm run <script> -w apps/web       # run script in apps/web only
npm run <script> -w packages/ui    # run script in packages/ui only
```

## Git / Utilities
```bash
git status / git log / git diff    # standard git
turbo clean                        # clear Turbo cache
```
