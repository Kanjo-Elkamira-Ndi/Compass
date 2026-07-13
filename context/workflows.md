# Workflows

Read `AGENTS.md` first if you haven't — this file assumes you already
know the module list and layering rules.

## Local development setup

```bash
cp .env.example .env          # fill in JWT_SECRET, OPENAI_API_KEY, GEMINI_API_KEY, DB creds
docker compose up -d postgres-db redis-cache   # infra only
cd backend && ./mvnw spring-boot:run           # spring-api on :8080
cd frontend && npm install && npm run dev      # react-app dev server on :3000, proxies /api to :8080
```

Full stack (mirrors production containers): `docker compose up --build`.

### Environment variable manifest

| Variable | Used by | Notes |
|---|---|---|
| `DB_URL` | spring-api | `jdbc:postgresql://postgres-db:5432/advisor` |
| `DB_USER` / `DB_PASSWORD` | spring-api | Never committed; `.env` only |
| `JWT_SECRET` | spring-api | ≥256-bit, different per environment — see `security.md` |
| `OPENAI_API_KEY` | spring-api | Primary AI provider |
| `GEMINI_API_KEY` | spring-api | Fallback AI provider |
| `REDIS_URL` | spring-api | `redis://redis-cache:6379` |
| `VITE_API_BASE_URL` | react-app (build-time) | `http://localhost:8080/api/v1` in dev |

## Git and PR conventions

- **Branch naming:** `feature/<short-desc>`, `fix/<short-desc>`,
  `chore/<short-desc>` — e.g. `feature/public-contact-form`.
- **Commits:** Conventional Commits — `feat:`, `fix:`, `docs:`, `test:`,
  `chore:`, `refactor:`. One logical change per commit.
- **PRs must include, before requesting review:**
  1. Passing tests locally (`./mvnw test` / `npm test`).
  2. Any `context/*.md` file updated if the PR adds/changes an endpoint,
     table, route, component, or package — see the "Rule for agents" at
     the bottom of the relevant context file.
  3. A one-line PR description referencing which module (from
     `project-overview.md`) the change belongs to.
- **No direct pushes to `main`.** All changes via PR, at least one
  review (an agent's own self-review comment counts if working solo).

## CI/CD pipeline (GitHub Actions)

1. **Lint** — `checkstyle`/`spotless` (backend), `eslint` + `prettier`
   (frontend, including Tailwind class sorting via
   `prettier-plugin-tailwindcss`).
2. **Test** — `./mvnw test` (JUnit 5 + Mockito) and `npm test`.
   Integration tests run against a Postgres service container, not H2 —
   pgvector and JSONB behaviour must be real.
3. **Coverage gate** — JaCoCo fails the build if service-layer coverage
   < 80% (see `code-standards.md` §Testing).
4. **Build** — multi-stage Docker builds for `backend/Dockerfile` and
   `frontend/Dockerfile` (the frontend build step also generates
   `sitemap.xml`/`robots.txt` — see `architecture.md` §Public Website
   Architecture).
5. **Deploy** — on merge to `main`: push images, `docker compose pull &&
   docker compose up -d` on the target host.
6. **Smoke test** — after deploy: `curl -f https://advisor.yibs.cm/` and
   `curl -f https://advisor.yibs.cm/api/v1/public/stats`, asserting HTTP
   200 on both, confirming the public landing page and the API are both
   reachable.

## Adding a database migration

1. Read `database-schema.md` — check nothing already covers the need.
2. Next sequential file: `backend/src/main/resources/db/migration/
   V{n}__short_description.sql`. Never edit a migration that has already
   run anywhere.
3. Add/update the corresponding entity in `domain.*`, repository in
   `repository/`, DTO(s), and MapStruct mapper.
4. Update the table definition in `database-schema.md` and the migration
   sequence table in the same PR.

## Adding a new AI-module feature (worked example)

Use this as the template for "add a new AI capability" tasks:

1. Add the DB shape first (`database-schema.md` + migration) if the
   feature needs persistence.
2. Add the service under `service.ai/`, implementing an `IXxxService`
   interface, using `AIProviderStrategy` for the LLM call — never call
   OpenAI/Gemini SDKs directly from a controller or another service
   (`architecture.md` §AI integration strategy).
3. Add the controller endpoint under `AIController` (or a new
   `@RestController` if it's a large enough surface), and add it to
   `api-reference.md` immediately.
4. Add the frontend page under `pages/ai/` and wire it into the route
   map (`ui-context.md`) and `AppShell` navigation.
5. Unit-test the service with `AIProviderStrategy` mocked; never let a
   test depend on a live network call to OpenAI/Gemini.

## Picking up a task as an agent

1. Read `AGENTS.md`, then the specific context file(s) the task touches.
2. Confirm the task doesn't already have a table/endpoint/route/component
   that satisfies it — reuse before adding.
3. Implement top-down through the layers (`architecture.md` §Layered
   request flow) — domain/DB first, then service, then controller, then
   frontend.
4. Write the test alongside the code, not after.
5. Update every `context/*.md` file the change affects, in the same PR.
6. Open the PR following the conventions above.
