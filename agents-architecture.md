# AI Dream Team — Agents Architecture

This document describes the architecture of the AI Dream Team, a multi-agent system for executing full-stack development tasks on the ShinobiOps project.

---

## Overview

The AI Dream Team is composed of four specialized Claude subagents, each defined in `.claude/agents/`. They communicate through shared plan files and a communication file, coordinated by the **Tech Leader Manager**.

> **Key Constraint:** Claude subagents cannot spawn other subagents. The Tech Leader creates plan files and outputs explicit "Next Steps" — the main conversation (or user) chains the agent calls.

---

## Agent Roster

| Agent | File | Model | Role |
|-------|------|-------|------|
| Tech Leader Manager | `.claude/agents/tech-leader-manager.md` | Opus | Orchestrator, planner, coordinator |
| Senior Backend Engineer | `.claude/agents/senior-backend-engineer.md` | Sonnet | APIs, database, business logic |
| Frontend Specialist | `.claude/agents/frontend-specialist.md` | Sonnet | React UI, components, integration |
| Senior QA Engineer | `.claude/agents/senior-qa-engineer.md` | Sonnet | Automated tests, bug reporting |

---

## File System Communication

Agents share state through files on disk — not through direct calls.

```
.
├── .claude/
│   ├── agents/                          # Agent definition files
│   │   ├── tech-leader-manager.md
│   │   ├── senior-backend-engineer.md
│   │   ├── frontend-specialist.md
│   │   └── senior-qa-engineer.md
│   ├── communication/                   # Inter-agent shared state (multi-agent tasks)
│   │   └── PLAN_NAME.md                 # Status, backend→frontend contracts
│   └── memory/                          # Per-agent persistent memory
│       ├── tech-leader/
│       │   ├── long-term.md             # Reusable insights across tasks
│       │   └── short-term.md            # Current task context
│       ├── senior-backend/
│       │   ├── long-term.md
│       │   └── short-term.md
│       ├── frontend-specialist/
│       │   ├── long-term.md
│       │   └── short-term.md
│       └── senior-qa/
│           ├── long-term.md
│           └── short-term.md
│
└── ai-driven-project/
    ├── master-context.md                # Single source of truth — all agents read/update
    ├── rules/                           # Project conventions (all agents consult)
    └── prompt-engineering/
        └── PLAN_NAME/                   # One folder per task
            ├── task-request-backend.md  # Backend engineer's instructions
            ├── task-request-frontend.md # Frontend specialist's instructions
            └── done.md                  # Final summary (created by Tech Leader)
```

---

## Workflow: Full-Stack Task

```mermaid
sequenceDiagram
    actor User
    participant TL as Tech Leader Manager
    participant FS as Frontend Specialist
    participant BE as Senior Backend Engineer
    participant QA as Senior QA Engineer

    User->>TL: "Build the login feature"
    TL->>TL: Read master-context.md + memory
    TL->>TL: Classify scope (full-stack)
    TL->>TL: Create plan folder + task files
    TL->>TL: Create .claude/communication/login.md
    TL-->>User: Next Steps output

    User->>FS: "Execute task-request-frontend.md"
    FS->>FS: Read plan + styleguide + memory
    FS->>FS: Build UI with mock data
    FS-->>User: Phase 1 UI ready for review

    User->>User: Review UI, provide feedback
    User->>FS: "Adjust X, Y, Z"
    FS->>FS: Make adjustments
    FS-->>User: UI approved

    User->>BE: "Execute task-request-backend.md"
    BE->>BE: Read plan + rules + memory
    BE->>BE: Implement APIs + DB logic
    BE->>BE: Update communication file
    BE-->>User: Backend done summary

    User->>FS: "Integrate with backend APIs"
    FS->>FS: Read communication file for endpoints
    FS->>FS: Replace mock data with real API calls
    FS->>FS: Update master-context.md
    FS-->>User: Integration complete

    User->>QA: "Run QA for login feature"
    QA->>QA: Read all plan files + communication file
    QA->>QA: Write Playwright test scripts
    QA->>QA: Execute tests, report results
    QA->>QA: Update master-context.md
    QA-->>User: Test report + bug list

    User->>TL: "Summarize completed work"
    TL->>TL: Create done.md in plan folder
    TL-->>User: Final summary table
```

---

## Workflow: Backend-Only Task

```mermaid
sequenceDiagram
    actor User
    participant TL as Tech Leader Manager
    participant BE as Senior Backend Engineer
    participant QA as Senior QA Engineer

    User->>TL: "Add GET /api/tickets endpoint"
    TL->>TL: Read master-context.md + memory
    TL->>TL: Classify scope (backend-only)
    TL->>TL: Create task-request-backend.md
    TL-->>User: Next Steps output

    User->>BE: "Execute task-request-backend.md"
    BE->>BE: Read plan + rules + memory
    BE->>BE: Implement endpoint + validation
    BE->>BE: Update master-context.md
    BE-->>User: Backend done summary

    User->>User: Review API output, provide feedback
    User->>BE: "Adjust error response format"
    BE->>BE: Make adjustments
    BE-->>User: Adjustments complete

    User->>QA: "Run QA for tickets endpoint"
    QA->>QA: Read plan file for context
    QA->>QA: Write API test scripts
    QA->>QA: Execute tests, report results
    QA-->>User: Test report

    User->>TL: "Summarize completed work"
    TL->>TL: Create done.md in plan folder
    TL-->>User: Final summary table
```

---

## Agent Interaction Model

```mermaid
graph TD
    User([User / Main Conversation])

    subgraph Agents[".claude/agents/"]
        TL[Tech Leader Manager\nModel: Opus]
        BE[Senior Backend Engineer\nModel: Sonnet]
        FS[Frontend Specialist\nModel: Sonnet]
        QA[Senior QA Engineer\nModel: Sonnet]
    end

    subgraph SharedFiles["Shared File System"]
        MC[(master-context.md)]
        PF[(Plan Files\nprompt-engineering/)]
        CF[(Communication Files\n.claude/communication/)]
        MEM[(Memory Files\n.claude/memory/)]
    end

    User -->|1. Invoke| TL
    TL -->|Creates| PF
    TL -->|Creates| CF
    TL -->|Reads/Updates| MC
    TL -->|Reads/Updates| MEM
    TL -->|Next Steps| User

    User -->|2. Invoke| FS
    FS -->|Reads| PF
    FS -->|Reads/Updates| CF
    FS -->|Updates| MC
    FS -->|Reads/Updates| MEM

    User -->|3. Invoke| BE
    BE -->|Reads| PF
    BE -->|Reads/Updates| CF
    BE -->|Updates| MC
    BE -->|Reads/Updates| MEM

    User -->|4. Invoke| QA
    QA -->|Reads| PF
    QA -->|Reads| CF
    QA -->|Updates| MC
    QA -->|Reads/Updates| MEM
```

---

## Memory Architecture

Each agent maintains two memory tiers:

```mermaid
graph LR
    subgraph Memory["Agent Memory (.claude/memory/)"]
        direction TB
        LT[long-term.md\nPersists across tasks\nReusable patterns\nProject insights]
        ST[short-term.md\nCurrent task only\nFiles modified\nDecisions made]
    end

    LT -->|Informs future| Agent([Agent Execution])
    ST -->|Current context| Agent
    Agent -->|Updates both| Memory
```

| Memory File | Purpose | Lifespan |
|-------------|---------|----------|
| `long-term.md` | Reusable knowledge: component locations, API patterns, gotchas | Permanent — grows over time |
| `short-term.md` | Current task state: plan path, modified files, open questions | Reset each new task |

---

## Communication File Protocol

When a task involves both frontend and backend, the Tech Leader creates a communication file that agents use to share contracts:

```mermaid
graph LR
    TL[Tech Leader] -->|Creates blank template| COMM[.claude/communication/PLAN_NAME.md]
    BE[Backend Engineer] -->|Fills: endpoints, schemas| COMM
    FS[Frontend Specialist] -->|Reads endpoints\nFills: expected data shapes| COMM
    QA[QA Engineer] -->|Reads full context| COMM
```

**Communication file sections:**
- **Status** — checklist of agent completion status
- **Shared Context** — info both engineers need
- **Backend → Frontend** — API contracts (endpoints, request/response schemas)
- **Frontend → Backend** — UI data requirements

---

## Agent Capabilities

```mermaid
graph TD
    subgraph Tools["Tools Available"]
        R[Read]
        W[Write]
        E[Edit]
        G[Glob]
        GR[Grep]
        B[Bash]
    end

    TL2[Tech Leader\nOpus] --> R & W & E & G & GR & B
    BE2[Backend Eng.\nSonnet] --> R & W & E & G & GR & B
    FS2[Frontend Spec.\nSonnet] --> R & W & E & G & GR & B
    QA2[QA Engineer\nSonnet] --> R & W & E & G & GR & B
```

All agents have the same tool set. Differentiation comes from their system prompts, which encode specialized knowledge, workflows, and constraints.

---

## Design Principles

1. **File-based coordination** — No direct agent-to-agent calls. All state lives in files the agents can read and write independently.
2. **High-level plans only** — The Tech Leader writes *what* to build, never *how*. Implementation decisions belong to engineer agents.
3. **Memory-driven continuity** — Each agent accumulates knowledge over time, making them progressively better at the project's patterns.
4. **Progressive UI development** — Frontend always builds with mock data first, then integrates. This decouples UI review from backend readiness.
5. **QA as a gate** — No task is complete until the QA agent has run and reported. The `done.md` is only created after QA.
6. **Master context as single source of truth** — All agents update `ai-driven-project/master-context.md`, keeping it current for future tasks.

---

## Invocation Examples

```bash
# Start a full-stack task
"Use the tech-leader-manager agent to plan: Build the ticket creation form with backend API"

# Execute frontend phase
"Use the frontend-specialist agent: Execute the plan at ai-driven-project/prompt-engineering/20250405_ticket-form/task-request-frontend.md"

# Execute backend phase
"Use the senior-backend-engineer agent: Execute the plan at ai-driven-project/prompt-engineering/20250405_ticket-form/task-request-backend.md"

# Run QA
"Use the senior-qa-engineer agent: Run QA for the task at ai-driven-project/prompt-engineering/20250405_ticket-form/"

# Request final summary
"Use the tech-leader-manager agent to create the done.md for ai-driven-project/prompt-engineering/20250405_ticket-form/"
```
