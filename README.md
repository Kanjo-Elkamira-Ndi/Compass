# Compass

**An AI-powered university academic advisor system.**

Compass turns a standard student information system into an active guide.
Instead of just storing grades and enrolments, it layers five AI-powered
modules on top — a chatbot, risk prediction, a research assistant, an
exam generator, and career recommendations — and fronts the whole thing
with a public marketing site so prospective students, lecturers, and
admins can discover it before they ever create an account.

Built as an M.Tech Software Engineering capstone (Object-Oriented
Programming in Java) at Yaoundé International Business School (YIBS),
Cameroon.

> 📚 **For AI coding agents (Copilot, Codex CLI, opencode):** read
> [`AGENTS.md`](./AGENTS.md) first, then the relevant file in
> [`/context`](./context). Those files are the source of truth for
> architecture, database schema, API contracts, security rules, code
> standards, file structure, UI/design tokens, and workflows — this
> README is the human-facing front door.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Architecture at a glance](#architecture-at-a-glance)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

| Module | What it does |
|---|---|
| **Student & Course Management** | CRUD, enrolment, timetable generation — the SIS foundation everything else sits on |
| **Academic Performance** | GPA, CGPA, cohort ranking, performance trends |
| **🤖 AI Chatbot** | Students ask academic questions in natural language; answers optionally grounded in the university's own documents via RAG |
| **📊 Risk Prediction** | Classifies a student as Excellent / Passing / At-Risk / Critical from attendance, assignments, projects, tests, and exams |
| **📄 Research Assistant** | Upload a PDF, get back a summary, key findings, research gaps, and future work |
| **📝 Exam Generator** | Lecturer specifies topic/difficulty/count; AI generates MCQ, theory, practical, and case-study questions |
| **🎯 Career Recommendations** | Ranks career paths from a student's courses, projects, skills, and grades |
| **🌐 Public Website** | Unauthenticated landing/features/about/FAQ/contact pages that convert visitors into registered accounts |

Full module and actor breakdown: [`context/project-overview.md`](./context/project-overview.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, shadcn/ui + Tailwind CSS, Axios, React Router 6 |
| Backend | Java 17, Spring Boot 3, Spring Security, Spring AI |
| Database | PostgreSQL 16 + pgvector |
| AI providers | OpenAI (primary), Gemini (fallback), Hugging Face (specialised NLP) |
| Cache | Redis 7 |
| Deployment | Docker, GitHub Actions, Nginx reverse proxy |
| Testing | JUnit 5, Mockito, JaCoCo (80% service-layer coverage gate) |

PostgreSQL was chosen over the originally-suggested MySQL specifically
for **pgvector** — it gives the RAG module native vector similarity
search in the same database as the rest of the domain data, instead of
standing up a separate vector store. Details: [`context/project-overview.md`](./context/project-overview.md#why-postgresql-not-mysql).

## Architecture at a glance

```
Browser ──▶ Nginx (TLS) ──▶ react-app (React SPA)
                               │  proxies /api/*
                               ▼
                         spring-api (Spring Boot)
                         ├─ JWT auth filter chain
                         ├─ Controller → Service → Repository
                         └─ Spring AI (Strategy pattern: OpenAI ⇄ Gemini)
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
              postgres-db          redis-cache
           (+ pgvector for RAG)   (token cache, rate limits)
```

Five containers, one internal bridge network. Full C4-model breakdown
(context → container → component → layered request flow), the AI
provider strategy, and the public-website architecture:
[`context/architecture.md`](./context/architecture.md).

## Getting started

```bash
git clone <repo-url> compass && cd compass
cp .env.example .env   # fill in JWT_SECRET, OPENAI_API_KEY, GEMINI_API_KEY, DB creds

# infra only, run backend/frontend natively for fast iteration
docker compose up -d postgres-db redis-cache
cd backend && ./mvnw spring-boot:run      # spring-api → http://localhost:8080
cd frontend && npm install && npm run dev # react-app  → http://localhost:3000
```

Or run the full stack exactly as it deploys:

```bash
docker compose up --build
```

Full environment variable manifest and local setup notes:
[`context/workflows.md`](./context/workflows.md).

## Project structure

```
compass/
├── AGENTS.md              # entry point for AI coding agents
├── context/                # architecture, DB schema, API, security, code
│   └── ...                 # standards, file structure, UI, workflows — see below
├── backend/                 # Spring Boot API
├── frontend/                 # React SPA (authenticated app + public site)
├── docker-compose.yml
└── .env.example
```

Full package-by-package / folder-by-folder layout for both backend and
frontend: [`context/file-structure.md`](./context/file-structure.md).

## Testing

```bash
cd backend && ./mvnw test     # JUnit 5 + Mockito; integration tests run against real Postgres
cd frontend && npm test
```

CI fails the build if service-layer coverage drops below 80% (JaCoCo).
Conventions: [`context/code-standards.md`](./context/code-standards.md#testing).

## Deployment

GitHub Actions: lint → test → coverage gate → multi-stage Docker build →
deploy → smoke test (asserts both the public landing page and
`/api/v1/public/stats` return `200` after every deploy). Full pipeline:
[`context/workflows.md`](./context/workflows.md#cicd-pipeline-github-actions).

## Documentation

Everything below lives in [`/context`](./context) and is written for
both humans and AI coding agents:

| File | Covers |
|---|---|
| [`project-overview.md`](./context/project-overview.md) | Problem statement, actors, modules, tech stack |
| [`architecture.md`](./context/architecture.md) | C4 model, layers, AI provider strategy, public-site architecture |
| [`database-schema.md`](./context/database-schema.md) | Every table, ERD, Flyway migration sequence |
| [`api-reference.md`](./context/api-reference.md) | Every endpoint, response envelope, error codes |
| [`security.md`](./context/security.md) | JWT flow, filter chain, password rules, public-endpoint hardening |
| [`code-standards.md`](./context/code-standards.md) | Naming, layering, OOP patterns in use, Streams conventions, testing rules |
| [`file-structure.md`](./context/file-structure.md) | Exact backend/frontend folder layout |
| [`ui-context.md`](./context/ui-context.md) | Design tokens, route map, shadcn component inventory |
| [`workflows.md`](./context/workflows.md) | Local setup, git/PR conventions, CI/CD, task workflow |

## Roadmap

- [ ] Statically-generated marketing site on its own subdomain (currently served from `react-app` for simplicity)
- [ ] Mobile-responsive polish pass on the AI module pages
- [ ] Multi-institution support (currently single-tenant, YIBS-specific)
- [ ] Bilingual (EN/FR) UI

## Contributing

1. Read [`AGENTS.md`](./AGENTS.md) and the relevant `/context` file before starting.
2. Branch from `main`: `feature/<short-desc>` / `fix/<short-desc>`.
3. Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
4. Tests pass locally, coverage gate holds, and any `/context/*.md` file
   affected by your change is updated in the same PR.
5. Open a PR — see [`context/workflows.md`](./context/workflows.md#git-and-pr-conventions) for the full checklist.

## License

Licensed under the [MIT License](./LICENSE) — see the file for details.

---

*Built at Yaoundé International Business School, M.Tech Software Engineering.*
