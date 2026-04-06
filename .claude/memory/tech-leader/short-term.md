# Tech Leader -- Short-Term Memory

## Current Task
- **Name:** Phase 5 -- Admin Dashboard, TV Mode, Theme Polish, Docker
- **Plan folder:** `ai-driven-project/prompt-engineering/20260406_phase5-admin-tv-polish-docker/`
- **Scope:** Full-stack
- **Status:** Plans created, ready for agent execution

## Key Decisions
- Backend goes first: frontend depends on new admin/stats, admin/users, admin/checkpoints/history, tv/data, admin/tv-config endpoints
- TV mode uses polling (not SSE) since it is a public route without auth
- TvConfig is a new Prisma model (needs migration)
- Avatar upload uses sharp for resizing, stores in public/avatars/
- Rate limiting is simple in-memory (no Redis needed for internal app)
- Environment validation via a lib/env.ts that fails fast on missing vars
- Checkpoint config API already exists at /api/checkpoints/config -- backend should create admin-namespaced aliases or reuse existing
- Ticket filter schema needs extension for date ranges and sortBy/sortOrder for admin log
- UserAvatar component goes in apps/web/components/user-avatar.tsx (app-specific, uses shared Avatar from @workspace/ui)
- Global search enhances existing header search with debounced dropdown
- No mock data phase -- all components use real APIs with loading skeletons

## Tasks Breakdown (13 remaining)
1. Backend batch 1: Schema (TvConfig), admin stats API, admin users API, admin checkpoints history, extended ticket filters
2. Backend batch 2: TV data API, TV config API, avatar upload API
3. Backend batch 3: Docker setup, env validation, rate limiting, secure cookies, CORS
4. Frontend batch 1: UserAvatar component, CommandDojoOverview, TeamManagement, CheckpointConfig, TicketLog
5. Frontend batch 2: TvBoard, GlobalSearch, loading skeletons
6. Frontend batch 3: Ninja theme polish pass
7. QA: Final integration testing

## Plan Files
- Backend: `ai-driven-project/prompt-engineering/20260406_phase5-admin-tv-polish-docker/task-request-backend.md`
- Frontend: `ai-driven-project/prompt-engineering/20260406_phase5-admin-tv-polish-docker/task-request-frontend.md`
- Communication: `.claude/communication/phase5-admin-tv-polish-docker.md`
