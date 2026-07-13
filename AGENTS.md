# AGENTS.md — Agent Entry Point

This file is the first thing an AI coding agent (GitHub Copilot, Codex CLI,
opencode, or any other agent) should read before touching this repository.
It exists because Copilot, Codex and opencode discover context differently:

| Tool | How it finds context |
|---|---|
| **Codex CLI / opencode** | Reads `AGENTS.md` at the repo root automatically. |
| **GitHub Copilot** | Reads `.github/copilot-instructions.md`. Keep that file as a short pointer back to `/context/*.md` (see snippet below) so Copilot and the other tools never drift out of sync. |
| **Any agent, manually** | Point it at `/context/` and ask it to read the file relevant to the task. |

Suggested `.github/copilot-instructions.md` (create this once, keep it thin):

```md
Read /context/AGENTS.md first, then the specific /context/*.md file(s)
relevant to your task, before writing any code. Do not duplicate their
content here — this file only exists so Copilot discovers them.
```

## Project in one line

An AI-Powered University Academic Advisor System for YIBS (Yaoundé
International Business School) — a Spring Boot + React application that
turns a standard Student Information System into an AI-assisted advisor,
plus a public marketing website that converts visitors into registered
accounts.

## Context files — read in this order

1. **`project-overview.md`** — what the system is, who it's for, the module list, tech stack. Read this first, always.
2. **`architecture.md`** — containers, layers, request flow, AI provider strategy, public-site architecture.
3. **`database-schema.md`** — every table, the ERD, Flyway migration sequence. Read before any DB-touching task.
4. **`api-reference.md`** — every REST endpoint, the response envelope, error codes. Read before any controller/service task.
5. **`security.md`** — JWT flow, filter chain, password rules, public-endpoint hardening. Read before any auth/security task.
6. **`code-standards.md`** — naming, layering rules, OOP patterns to use, Streams conventions, testing requirements. Read before writing any code, every time.
7. **`file-structure.md`** — exact package/folder layout for backend and frontend. Read before creating any new file.
8. **`ui-context.md`** — design tokens, route map, component inventory. Read before any frontend task.
9. **`workflows.md`** — local setup, git/PR conventions, CI/CD, how to add a migration, how to pick up a task end-to-end.
10. **`frontend-roadmap.md`** — if you're building the frontend before the backend exists, read this: the phased build order (public site → auth → app shell → core domain → AI modules → polish → tests → backend integration), the contract-first MSW mocking strategy, and the exact prompt to use for each phase.

## Non-negotiable rules for agents working in this repo

- **Never invent a table, column, endpoint, or route that isn't in these
  files.** If a task needs one that doesn't exist yet, propose the addition
  in the relevant `context/*.md` file in the same PR that uses it, don't
  just add it to code silently.
- **Follow the layering rule in `code-standards.md` strictly**: Controller
  → Service → Repository → Database. A controller never talks to a
  repository directly, and a service never returns a JPA entity.
- **Every new service method that has business logic needs a JUnit test**
  (Mockito for dependencies). The CI coverage gate is 80% on the service
  layer — see `workflows.md`.
- **Entities never leave the service layer.** Map to a DTO with MapStruct
  before returning from any `@Service` method.
- **Database changes are Flyway migrations, never `ddl-auto: update`.**
  Hibernate DDL auto is `validate` in every environment.
- **The public marketing site and the authenticated app are two route
  groups, not two features to conflate.** Marketing routes (`/`,
  `/features`, `/about`, `/faq`, `/contact`) render under `<PublicLayout>`
  and never require auth. Everything else renders under `<AppShell>` behind
  `<ProtectedRoute>`. See `architecture.md` §Public Website and
  `ui-context.md` §Route Map.
- **Database is PostgreSQL 16 + pgvector.** Not MySQL — the original course
  brief said MySQL, this project deliberately supersedes that (see
  `project-overview.md` for why). Never suggest or add MySQL-specific SQL,
  drivers, or Docker images.
- **Secrets never get hardcoded.** Every credential/key is an environment
  variable — see the manifest in `workflows.md`.