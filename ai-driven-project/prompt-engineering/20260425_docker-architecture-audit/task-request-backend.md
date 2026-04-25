# Backend Task: Docker Architecture Audit and Optimization

## Description
Audit and refactor the entire Docker build pipeline for the ShinobiOps TurboRepo monorepo. The current setup copies 835MB of full node_modules into the runtime image when the standalone output only needs 79MB. Implement turbo prune, BuildKit caching, and runtime image minimization.

## Acceptance Criteria
- [ ] Turbo prune used to create minimal workspace for each build target
- [ ] BuildKit cache mounts for npm and turbo caches
- [ ] Runtime image uses standalone node_modules (79MB) instead of full node_modules (835MB)
- [ ] Seed script still works with standalone node_modules
- [ ] Healthcheck defined in one place only (Dockerfile or Compose, not both)
- [ ] Compose includes init:true, log rotation, resource limits
- [ ] .dockerignore is clean and minimal
- [ ] Docs service uses profiles for optional deployment
- [ ] Non-root user preserved
- [ ] SQLite volume mount is safe and correct
- [ ] Image builds successfully and container starts healthy

## Key Findings
1. node_modules layer is 835MB; standalone only needs 79MB
2. No turbo prune -- manual package.json copies
3. No BuildKit cache mounts
4. Healthcheck duplicated in Dockerfile AND compose
5. Docs build commented out; docs-runner stage is dead code
6. Seed script uses --packages=external requiring full node_modules
7. Compose lacks init:true, log rotation, resource hints

## Implementation Strategy
1. Use turbo prune --docker to create minimal workspace
2. Change seed esbuild to --external only for native modules, bundle bcryptjs
3. Copy standalone node_modules instead of full pruned node_modules
4. Add BuildKit cache mounts for npm ci and turbo build
5. Remove healthcheck from Compose (keep in Dockerfile as default)
6. Remove dead docs-runner stage from Dockerfile (or make it work with profiles)
7. Improve compose with operational best practices

## Rules to Follow
- KISS: no over-engineering
- Keep Alpine base (works well with better-sqlite3)
- Preserve entrypoint.sh behavior
- Maintain non-root user security model
- Do not break existing docker-compose up workflow

## Communication File
N/A (infrastructure-only task)
