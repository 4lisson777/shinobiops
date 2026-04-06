# ShinobiOps — Project Overview

## Purpose
Internal fullstack web application for **Inovar Sistemas** that unites customer support and development teams around production issue escalation and real-time team coordination. Support members open tickets/bug reports; developers receive real-time notifications and manage a priority queue; the Tech Lead (Jōnin) has full visibility via an admin dashboard.

## Key Personas
- **Tech Lead (Jōnin)** — full dashboard, manages team settings, reassigns tickets
- **Developer (Ninja)** — views/claims tickets, updates status, sends help requests
- **Support Lead** — all support capabilities + can override priority reorders
- **Support Member** — opens tickets/bugs, tracks their items

## Ninja Theme Terminology
| Generic | ShinobiOps |
|---------|-----------|
| Developer | Ninja |
| Tech Lead | Jōnin |
| Ticket Queue | Mission Board |
| Bug Report | Threat Report |
| Help Request | Smoke Signal |
| Checkpoint | Status Scroll |
| Team Board | Ninja Board |
| Admin Dashboard | Command Dojo |

## Status
Phase 1 (Auth, registration, navigation) — **Complete**. Phases 2–5 pending.

## Key Docs
- `/docs/PRD.md` — full product requirements
- `/docs/TECH-STACK.md` — architecture decisions
- `/docs/TASKS.md` — master task tracker (all 5 phases, 66 tasks)
- `/docs/steps-1.md` through `/docs/steps-5.md` — per-phase implementation plans
