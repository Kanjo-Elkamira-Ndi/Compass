# Backend Implementation Roadmap

Phase-by-phase plan for building Compass's Spring Boot backend against
the contracts your frontend already expects. Read
[`AGENTS.md`](../AGENTS.md), [`architecture.md`](./architecture.md),
[`database-schema.md`](./database-schema.md),
[`api-reference.md`](./api-reference.md), [`security.md`](./security.md),
and [`code-standards.md`](./code-standards.md) before starting Phase 0.

## The core idea: build to the contract, not around it

Your frontend was built against the exact request/response shapes in
`api-reference.md` (via MSW). That means the backend has no room to
improvise — every DTO field name, every error code, every status code
must match what's already documented, or the frontend that already
exists breaks the moment you point it at the real API. Each phase below
ends with **exact Postman requests and the exact response to expect** —
if what you get back doesn't match, that's a bug to fix before moving
on, not a doc to "reinterpret."

Import the collection once and add to it as you go:
create a Postman collection named **Compass API**, an environment
**Compass Local** with variables `baseUrl = http://localhost:8080/api/v1`,
`accessToken` (blank for now), `refreshCookie` (Postman handles this
automatically if "Automatically follow redirects" and cookie jar are on).

---

## Phase 0 — Project scaffold & infrastructure

**Goal:** a Spring Boot app that starts, connects to Postgres, and
answers a health check — before any real feature exists.

**Deliverables**
- Spring Boot 3 + Java 17 project (`spring-api`), Maven, matching
  `file-structure.md`'s package layout (empty packages are fine for now)
- `docker-compose.yml` with `postgres-db` (Postgres 16 + pgvector image)
  and `redis-cache`, per `architecture.md` §Containers
- `application.yml` reading all env vars from `workflows.md`'s manifest
- Spring Boot Actuator `/actuator/health` enabled
- `GlobalExceptionHandler` skeleton + `ApiResponse<T>` envelope class
  (empty logic, just the shape) so every endpoint from Phase 1 onward
  can use it immediately

**Definition of Done:** `docker compose up -d postgres-db redis-cache &&
./mvnw spring-boot:run` starts cleanly and Postgres is reachable.

**Prompt template:**
> Read `context/file-structure.md` and `context/architecture.md`
> §Containers. Scaffold `backend/` as a Spring Boot 3 + Java 17 Maven
> project with the exact package structure in `file-structure.md` (empty
> packages are fine — just create them). Add `docker-compose.yml` with
> `postgres-db` (`pgvector/pgvector:pg16` image) and `redis-cache`
> (`redis:7-alpine`). Wire `application.yml` to the environment variables
> in `context/workflows.md`. Enable Spring Boot Actuator health endpoint.
> Create the `ApiResponse<T>` envelope class and a skeleton
> `GlobalExceptionHandler` per `context/api-reference.md` — just the
> shape, no business logic yet. Do not build any domain entity or
> endpoint yet.

### ✅ Test with Postman

| Request | Expected result |
|---|---|
| `GET http://localhost:8080/actuator/health` | `200 OK`, body `{"status":"UP"}` |

If this doesn't return `200`, stop — nothing after this phase will work
until Postgres/Redis connectivity is solid.

---

## Phase 1 — Database schema & entities

**Goal:** every table from `database-schema.md` exists and is mapped to
JPA entities, with no endpoints yet.

**Deliverables**
- Flyway migrations `V1`…`V11` exactly matching every table in
  `database-schema.md` (including `leads`, `document_chunks` with the
  `ivfflat` index, `revoked_tokens`)
- JPA entities in `domain.*` packages, one per table, using joined-table
  inheritance for `User`/`Student`/`Lecturer` per the ERD
- Spring Data repositories in `repository/`, interface only, no custom
  queries yet beyond what's obviously needed (e.g. `findByEmail`)
- `hibernate.ddl-auto: validate` confirmed working (i.e., entities
  match the Flyway-created schema exactly — this is the check that
  catches typos between the two)

**Definition of Done:** app starts with `ddl-auto: validate` and no
schema-mismatch errors; `\dt` in `psql` shows all tables from
`database-schema.md`.

**Prompt template:**
> Read `context/database-schema.md` in full. Create Flyway migrations
> `V1` through `V11` exactly matching every table, column, type, and
> constraint documented there — including the `leads` table and the
> `document_chunks` table with its `ivfflat` index. Create the matching
> JPA entities in the `domain.*` packages per `context/file-structure.md`,
> using joined-table inheritance for `User`/`Student`/`Lecturer`. Create
> Spring Data repository interfaces for each entity with only the
> obviously-needed finder methods (e.g. `findByEmail`, `findByStudentId`)
> — no service or controller layer yet. Confirm the app starts cleanly
> with `hibernate.ddl-auto: validate`.

### ✅ Test with Postman

No API to test yet — verify via `psql` or a DB client instead:
```sql
\dt
-- expect: users, students, lecturers, courses, enrolments, grade_records,
-- performance_summaries, risk_assessments, chat_messages, exams,
-- exam_questions, document_chunks, revoked_tokens, leads, flyway_schema_history
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
-- expect: 11 successful rows, V1 through V11
```

---

## Phase 2 — Security foundation & authentication

**Goal:** the JWT dual-token flow and all six `/auth/*` endpoints,
exactly per `security.md` and `api-reference.md`.

**Deliverables**
- `JwtTokenProvider`, `JwtAuthFilter`, `SecurityConfig` per
  `security.md` §JWT access token claims and §Spring Security filter
  chain
- `AuthController` + `AuthService` implementing all six endpoints:
  register, login, refresh, logout, forgot-password, reset-password
- BCrypt cost 12, refresh token rotation via `revoked_tokens` exactly
  per `security.md` §Refresh token rotation
- Rate limiting groundwork (Bucket4j dependency added, not yet applied
  to AI endpoints — that's Phase 6+)

**Definition of Done:** the full register → login → refresh → logout
loop works in Postman with real tokens, and a revoked refresh token
correctly returns `401 TOKEN_REVOKED`.

**Prompt template:**
> Read `context/security.md` in full and `context/api-reference.md`
> §Authentication. Implement `JwtTokenProvider`, `JwtAuthFilter`, and
> `SecurityConfig` exactly per the filter chain rules in `security.md`
> (including permitAll on `/api/v1/auth/**` and `/api/v1/public/**` even
> though public endpoints don't exist yet — reserve the rule now).
> Implement `AuthController`/`AuthService` for all six endpoints. Refresh
> tokens must rotate on every use and revoked tokens must be checked via
> SHA-256 hash lookup in `revoked_tokens`, per `security.md` §Refresh
> token rotation. Passwords are BCrypt cost 12. Add the
> `@Scheduled` cleanup job for expired `revoked_tokens` rows.

### ✅ Test with Postman

**1. Register**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "student1@compass.test",
  "password": "Passw0rd!23",
  "role": "STUDENT",
  "firstName": "Ada",
  "lastName": "Lovelace"
}
```
Expect: `201 Created`
```json
{ "success": true, "message": "Registration successful", "data": { "id": "<uuid>", "email": "student1@compass.test", "role": "STUDENT" }, "timestamp": "..." }
```

**2. Login** — save `data.accessToken` to the `accessToken` environment variable (add a Postman test script: `pm.environment.set("accessToken", pm.response.json().data.accessToken)`)
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{ "email": "student1@compass.test", "password": "Passw0rd!23" }
```
Expect: `200 OK`, `data.accessToken` present, `Set-Cookie` header with `HttpOnly` refresh cookie visible in Postman's cookie jar.

**3. Access a protected placeholder** (once Phase 3 exists) with
`Authorization: Bearer {{accessToken}}` should return `200`; without the
header should return `401`.

**4. Refresh**
```
POST {{baseUrl}}/auth/refresh
```
(cookie sent automatically) → Expect `200 OK`, new `accessToken` in
body, new refresh cookie set.

**5. Logout**
```
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}
```
Expect `200 OK`. Then repeat the refresh request with the **old**
refresh cookie → expect `401` with `errorCode: TOKEN_REVOKED` (or
similar per your final `api-reference.md` error table).

**6. Bad credentials**
```
POST {{baseUrl}}/auth/login
{ "email": "student1@compass.test", "password": "wrongpass" }
```
Expect `401`, `errorCode: INVALID_CREDENTIALS`.

---

## Phase 3 — Student & Course management

**Goal:** the CRUD backbone the frontend's Phase 5 (core domain) pages
already expect.

**Deliverables**
- `StudentController`/`StudentService` — CRUD, search, pagination, per
  `api-reference.md` §Student management
- `CourseController`/`CourseService` — CRUD, enrol, drop, per
  §Course management
- MapStruct mappers so entities never leave the service layer
- Role checks: ADMIN full access, LECTURER read + grade-adjacent
  actions, STUDENT read-own + enrol/drop only

**Definition of Done:** an admin can create a student and a course via
Postman, and a student token can enrol in that course.

**Prompt template:**
> Read `context/api-reference.md` §Student management and §Course
> management, and `context/database-schema.md` for `students`,
> `courses`, `enrolments`. Implement `StudentController`/`StudentService`
> and `CourseController`/`CourseService` with MapStruct DTO mapping.
> Enforce the role/ownership rules exactly as documented — ADMIN full
> access, LECTURER read-heavy, STUDENT can only read their own record and
> enrol/drop themselves. Add pagination (`?page=&size=&sort=`) to both
> list endpoints.

### ✅ Test with Postman

Use an ADMIN token (register/login a second user with `"role": "ADMIN"`
in Phase 2's flow, or seed one via Flyway `V10`).

**1. Create a course**
```
POST {{baseUrl}}/courses
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{ "code": "CSE-501", "title": "Advanced Algorithms", "creditHours": 3, "programme": "M.Tech Software Engineering", "semester": 1, "academicYear": "2025-2026" }
```
Expect `201`, `data.id` present.

**2. List courses (as student)**
```
GET {{baseUrl}}/courses?page=0&size=20
Authorization: Bearer {{accessToken}}
```
Expect `200`, `data.content` array includes the course just created,
`data.totalElements` ≥ 1.

**3. Enrol (as student)**
```
POST {{baseUrl}}/courses/{{courseId}}/enrol
Authorization: Bearer {{accessToken}}
```
Expect `201`, enrolment status `ENROLLED`.

**4. Duplicate enrol** — repeat the same request → expect `409`,
`errorCode: ALREADY_ENROLLED`.

**5. Student tries to create a course** — same create-course request
but with `{{accessToken}}` (STUDENT role) → expect `403`,
`errorCode: ACCESS_DENIED`.

---

## Phase 4 — Academic performance

**Goal:** GPA/CGPA computation, ranking, and trends — the data the
frontend's `<GpaTrendChart>` and dashboards render.

**Deliverables**
- `GradeRecord` entry endpoint (LECTURER) with the `total_score`
  generated column verified
- `PerformanceService` computing GPA/CGPA via Streams (per
  `code-standards.md` §Streams API), persisting `PerformanceSummary`
- `/performance/ranking` restricted to ADMIN/LECTURER per `security.md`
  filter chain rule 8

**Definition of Done:** entering grades for a student produces a correct
GPA in the summary endpoint, and a student token is blocked from the
ranking endpoint.

**Prompt template:**
> Read `context/api-reference.md` §Academic performance and
> `context/code-standards.md` §Streams API. Implement grade-record entry
> (LECTURER only) and `PerformanceService`, computing GPA/CGPA with
> Streams over `GradeRecord`s and persisting to `performance_summaries`.
> Implement cohort ranking via `Comparator`, restricted to
> `hasAnyRole('ADMIN','LECTURER')` — confirm this 403s for STUDENT tokens
> with a test, not just by reading the annotation.

### ✅ Test with Postman

**1. Submit a grade (as lecturer)**
```
POST {{baseUrl}}/performance/grades
Authorization: Bearer {{lecturerToken}}
Content-Type: application/json

{ "studentId": "{{studentId}}", "courseId": "{{courseId}}", "semester": 1, "academicYear": "2025-2026", "attendancePct": 92, "assignmentScore": 85, "projectScore": 90, "testScore": 78, "examScore": 88 }
```
Expect `201`, response includes a computed `totalScore` and
`gradeLetter`.

**2. Get GPA summary (as student, own data)**
```
GET {{baseUrl}}/performance/students/{{studentId}}/summary
Authorization: Bearer {{accessToken}}
```
Expect `200`, `data.gpa` between `0.000` and `4.000`.

**3. Ranking as STUDENT** → expect `403`, `errorCode: ACCESS_DENIED`.

**4. Ranking as LECTURER**
```
GET {{baseUrl}}/performance/ranking?courseId={{courseId}}
Authorization: Bearer {{lecturerToken}}
```
Expect `200`, `data` is an ordered array with `rank` fields ascending.

---

## Phase 5 — AI foundation (Strategy pattern + provider config)

**Goal:** the plumbing every AI module (Phases 6–10) depends on, built
once and tested with a trivial passthrough before any real module uses
it.

**Deliverables**
- `AIProviderStrategy` interface, `OpenAiProviderImpl`,
  `GeminiProviderImpl` per `architecture.md` §AI integration strategy
- `PromptBuilder` fluent builder
- Spring AI `ChatClient` config wired to both providers, switchable via
  `spring.ai.active-provider`
- A throwaway `/api/v1/ai/_ping` endpoint (temporary, remove before
  Phase 12) that sends a fixed prompt to the active provider and returns
  the raw response — exists purely to prove the plumbing works before
  building real modules on top of it

**Definition of Done:** the ping endpoint returns a real LLM response,
and switching `spring.ai.active-provider` from `openai` to `gemini` in
config (no code change) changes which provider answers.

**Prompt template:**
> Read `context/architecture.md` §AI integration strategy. Implement
> `AIProviderStrategy`, `OpenAiProviderImpl`, `GeminiProviderImpl`, and
> `PromptBuilder`. Wire Spring AI's `ChatClient` so the active provider is
> chosen by `spring.ai.active-provider` in config, with the interface
> being the only thing any future service depends on. Add a temporary
> `GET /api/v1/ai/_ping?message=...` endpoint (mark it clearly as
> temporary, to be deleted once Phase 6 exists) that sends the message to
> the active provider and returns the raw text response, so we can verify
> both providers work before building real features on top.

### ✅ Test with Postman

**1. Ping OpenAI (default provider)**
```
GET {{baseUrl}}/ai/_ping?message=Say hello in one sentence
Authorization: Bearer {{accessToken}}
```
Expect `200`, `data` contains a real, coherent sentence (not a mock
string) — confirms the OpenAI key and Spring AI wiring work.

**2. Switch `spring.ai.active-provider: gemini` in `application.yml`,
restart, repeat the same request.** Expect a response in a
noticeably different style/format — confirms the Strategy swap works
via config alone.

Delete `_ping` before Phase 12's Definition of Done — flag this
explicitly in that phase's PR.

---

## Phase 6 — AI Module: Academic Chatbot (+ RAG ingestion)

**Deliverables**
- `RagIngestionService` — chunks a PDF, generates embeddings via
  OpenAI's `text-embedding-ada-002`, stores in `document_chunks`
- `ChatbotService`/`AIController` chat endpoints, with RAG retrieval
  (cosine similarity via pgvector) injected into the prompt when
  relevant chunks exist
- Session history persisted to `chat_messages`

**Definition of Done:** a chatbot answer that's grounded in an uploaded
document shows a citation; one with no matching document still answers
sensibly from general knowledge.

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/ai/chat*`) and
> `context/database-schema.md` §document_chunks. Implement
> `RagIngestionService` (chunk → embed → store via pgvector) and
> `ChatbotService` (retrieve top-k similar chunks via cosine similarity,
> inject into the prompt via `PromptBuilder` from Phase 5, call the
> active `AIProviderStrategy`, persist to `chat_messages`). Build
> `POST /ai/chat` and `GET /ai/chat/history/{sessionId}`.

### ✅ Test with Postman

**1. Ingest a test document** (small internal endpoint or a temporary
script — if no upload endpoint exists yet, insert a `document_chunks`
row directly via `psql` with a short known fact for this test, e.g.
"The library closes at 9 PM on weekdays.")

**2. Chat, asking the known fact**
```
POST {{baseUrl}}/ai/chat
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{ "sessionId": "{{$guid}}", "message": "What time does the library close on weekdays?" }
```
Expect `200`, `data.answer` mentions 9 PM, `data.citation` (or similar
field per your final DTO) references the ingested source.

**3. Get history**
```
GET {{baseUrl}}/ai/chat/history/{{sessionId}}
Authorization: Bearer {{accessToken}}
```
Expect `200`, array with both the USER and ASSISTANT messages in order.

---

## Phase 7 — AI Module: Risk Prediction

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/ai/risk-assessment*`)
> and `context/database-schema.md` §risk_assessments. Implement
> `RiskAssessmentService`: aggregate a student's `GradeRecord`s via
> `DoubleSummaryStatistics`, build a structured prompt via
> `PromptBuilder` requesting a JSON response
> `{score, level, factors}`, call the active provider, persist the
> result, and publish a `RiskAlertEvent` (Observer pattern, per
> `code-standards.md`) when `level == CRITICAL`.

### ✅ Test with Postman

```
POST {{baseUrl}}/ai/risk-assessment/{{studentId}}
Authorization: Bearer {{lecturerToken}}
```
Expect `201`, `data.riskLevel` is one of
`EXCELLENT|PASSING|AT_RISK|CRITICAL`, `data.riskFactors` is a non-empty
array when the level isn't EXCELLENT.

```
GET {{baseUrl}}/ai/risk-assessment/{{studentId}}/latest
Authorization: Bearer {{accessToken}}
```
Expect `200`, matches the just-created assessment.

**Insufficient data case:** call the POST for a student with no grade
records → expect `422`, `errorCode: INSUFFICIENT_DATA`.

---

## Phase 8 — AI Module: Research Assistant

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/ai/research-assistant*`).
> Implement PDF text extraction (PDFBox), a structured-analysis prompt
> (summary / key findings / research gaps / future work), and
> persistence to `research_analyses`-equivalent table (add it to
> `database-schema.md` if it doesn't exist yet as a new migration).

### ✅ Test with Postman

```
POST {{baseUrl}}/ai/research-assistant
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
Body: file = <attach a short sample PDF, e.g. a 2-page abstract>
```
Expect `201`, `data.summary`, `data.keyFindings`, `data.researchGaps`,
`data.futureWork` all populated (non-empty strings/arrays).

**Wrong file type:**
```
POST {{baseUrl}}/ai/research-assistant
Body: file = <attach a .docx or .png>
```
Expect `415`, `errorCode: UNSUPPORTED_MEDIA_TYPE`.

**Oversized file** (>20MB) → expect `413`, `errorCode: FILE_TOO_LARGE`.

---

## Phase 9 — AI Module: Exam Generator

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/ai/exam-generator`,
> `/ai/exams`) and the Factory pattern note in `code-standards.md`
> (`QuestionGeneratorFactory.getGenerator(Difficulty)`). Implement exam
> generation constrained to JSON output parsed into
> `List<ExamQuestion>`, and the save-exam endpoint persisting to `exams`/
> `exam_questions`.

### ✅ Test with Postman

```
POST {{baseUrl}}/ai/exam-generator
Authorization: Bearer {{lecturerToken}}
Content-Type: application/json

{ "topic": "Data Structures - Trees", "difficulty": "INTERMEDIATE", "count": 5, "types": ["MCQ", "THEORY"] }
```
Expect `200`, `data` is an array of 5 questions, each with `questionType`
in `["MCQ","THEORY"]`, MCQ entries have a populated `options` array with
exactly one `correct: true`.

```
POST {{baseUrl}}/ai/exams
Authorization: Bearer {{lecturerToken}}
Content-Type: application/json

{ "courseId": "{{courseId}}", "title": "Midterm - Data Structures", "questions": [ /* from above */ ] }
```
Expect `201`, exam persisted with `status: DRAFT`.

---

## Phase 10 — AI Module: Career Recommendation

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/ai/career-recommendations`).
> Implement `CareerRecommendationService`: build a student profile object
> (courses, grades, skills from `students.skills` JSONB), submit to the
> active provider, parse a ranked JSON array, persist to
> `career_recommendations` (add as a migration if not already in
> `database-schema.md`).

### ✅ Test with Postman

```
GET {{baseUrl}}/ai/career-recommendations
Authorization: Bearer {{accessToken}}
```
Expect `200`, `data` is a ranked array, each entry has `title`,
`matchScore` or `demand`, `rationale`, `skillsToLearn` array. Calling
again should either return the cached result or regenerate — confirm
which behaviour was intended and that it matches.

---

## Phase 11 — Admin RAG upload & public website endpoints

**Deliverables**
- `POST /admin/rag/upload` wired to `RagIngestionService` from Phase 6
- `PublicController`: `/public/stats`, `/public/contact`,
  `/public/newsletter` per `api-reference.md` §Public website endpoints
- Bucket4j rate limiting applied: 5 req/min/IP on the two POST public
  endpoints, 20 req/min/user on all `/ai/*` endpoints (finally applying
  the groundwork from Phase 2)
- Honeypot field check, HTML-stripping on `leads` inserts
- `/public/stats` reads from a Redis-cached summary, refreshed on a
  `@Scheduled` job — never queries live tables directly

**Definition of Done:** the public endpoints work with zero
authentication, rate limiting kicks in on the 6th rapid request, and the
frontend's public site (already built) can be pointed at these with no
frontend changes.

**Prompt template:**
> Read `context/security.md` §Public endpoint exposure and
> `context/api-reference.md` §Public website endpoints. Implement
> `PublicController` and wire `/admin/rag/upload` to the existing
> `RagIngestionService`. Apply Bucket4j limits: 5/min/IP on
> `/public/contact` and `/public/newsletter`, 20/min/user on all `/ai/*`
> endpoints. Add the honeypot check and HTML-stripping on `leads`
> inserts. Build the `@Scheduled` job that refreshes the Redis-cached
> stats summary (active student count, course count, AI queries answered)
> — `/public/stats` must read only from Redis, never query
> `students`/`courses` directly.

### ✅ Test with Postman

**1. Stats (no auth needed)**
```
GET {{baseUrl}}/public/stats
```
Expect `200`, no `Authorization` header required, `data.activeStudents`,
`data.coursesOffered`, `data.aiQueriesAnswered` all present as numbers.

**2. Contact form**
```
POST {{baseUrl}}/public/contact
Content-Type: application/json

{ "fullName": "Test Visitor", "email": "visitor@test.com", "roleInterest": "STUDENT", "message": "How do I apply?" }
```
Expect `201`. Verify in `psql`: `SELECT * FROM leads WHERE email='visitor@test.com';` returns one row with `source='landing_page'`, `status='NEW'`.

**3. Rate limit** — send the same contact request 6 times in quick
succession. Expect the 6th response to be `429 Too Many Requests`.

**4. Admin RAG upload**
```
POST {{baseUrl}}/admin/rag/upload
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data
Body: file = <sample PDF>
```
Expect `201`, then confirm via `SELECT COUNT(*) FROM document_chunks;`
increased.

---

## Phase 12 — Cross-cutting hardening

**Goal:** the pass that closes every gap left by building module-by-module.

**Deliverables**
- Remove the `_ping` endpoint from Phase 5
- Full audit of `GlobalExceptionHandler` — every custom exception from
  every phase maps to the correct `errorCode` in `api-reference.md`,
  no raw stack traces ever reach a response
- CORS config locked to the real frontend origin (no wildcard in
  non-dev profiles)
- Structured logging with secrets excluded (JWT secrets, API keys,
  password hashes) — verified by grepping a day of logs
- HTTPS-only enforcement confirmed via `X-Forwarded-Proto` trust config

**Definition of Done:** hitting every documented error scenario across
every module returns the exact `errorCode` from `api-reference.md`, and
a log review shows zero secret leakage.

**Prompt template:**
> Audit every endpoint built in Phases 2–11 against
> `context/api-reference.md`'s error code table. Fix any endpoint
> returning an undocumented error shape or a raw exception message.
> Remove the `/ai/_ping` endpoint. Lock CORS to the real frontend origin
> per environment. Confirm no secret ever appears in application logs.
> Confirm HTTPS enforcement trusts `X-Forwarded-Proto` correctly behind
> the Nginx proxy.

### ✅ Test with Postman

Re-run every error-case request documented in Phases 2–11 (401s, 403s,
404s, 409s, 413, 415, 422, 429) as a single Postman **Collection Runner**
pass. Expect: every response's `errorCode` field exactly matches
`api-reference.md`'s table, and no response body contains the words
"Exception", "at com.yibs", or a stack trace.

---

## Phase 13 — Test coverage pass

**Deliverables**
- Unit tests (JUnit 5 + Mockito) for every `@Service` method with
  business logic — the 80% JaCoCo gate from `code-standards.md`
- Integration tests via Testcontainers (real Postgres + pgvector, real
  Redis) covering the full Controller → Service → Repository chain for
  at least one happy-path and one error-path per module
- Postman collection from Phases 0–12 exported and checked into the
  repo as `docs/postman/compass-collection.json`, runnable via `newman`
  in CI

**Definition of Done:** `./mvnw test` passes with ≥80% service-layer
coverage; `newman run docs/postman/compass-collection.json` passes in CI.

**Prompt template:**
> Read `context/code-standards.md` §Testing. Write JUnit 5 + Mockito
> tests for every `@Service` method built in Phases 2–11 that doesn't
> have one yet. Write Testcontainers-based integration tests (real
> Postgres+pgvector, real Redis) for one happy-path and one error-path
> per module. Export the manually-tested Postman requests from this
> roadmap into a single collection at
> `docs/postman/compass-collection.json` and add a `newman run` step to
> CI.

### ✅ Test with Postman

```bash
npx newman run docs/postman/compass-collection.json -e docs/postman/compass-local.postman_environment.json
```
Expect: 0 failures across every request in the collection.

---

## Phase 14 — Frontend integration

**Goal:** point the already-built frontend at this real backend and
confirm zero-drift.

**Deliverables**
- CORS confirmed working from the real frontend origin
- Frontend's `VITE_API_BASE_URL` pointed at `spring-api`, MSW disabled
- Every contract mismatch discovered gets fixed on the correct side —
  backend if it genuinely differs from `api-reference.md`, frontend if
  it was relying on an MSW assumption that was never actually documented

**Definition of Done:** the frontend's own Playwright e2e suite (from
its roadmap's Phase 9) passes against this real backend with no backend
special-casing for the frontend's convenience.

**Prompt template:**
> Confirm CORS allows the frontend's dev origin
> (`http://localhost:5173` or equivalent). Have the frontend point
> `VITE_API_BASE_URL` at this backend and disable MSW. Run the
> frontend's Playwright suite against this backend and report every
> failure with a diagnosis: genuine backend contract bug (fix here,
> against `api-reference.md`) vs. frontend assumption that was never
> actually documented (flag it, don't silently patch the backend to match
> an undocumented shape).

### ✅ Test with Postman

Not applicable — this phase's real test is the frontend's e2e suite.
Use Postman only to manually spot-check any specific failure the e2e
run surfaces, isolating whether it's a backend or frontend issue.

---

## Phase 15 — Production readiness

**Deliverables**
- `backend/Dockerfile` (multi-stage: Maven build → `eclipse-temurin:21-jre-alpine`)
- Full `docker-compose.yml` (all five containers) per `architecture.md`
- GitHub Actions pipeline: lint → test (+ coverage gate) → newman →
  build → deploy → smoke test, per `workflows.md` §CI/CD pipeline
- Flyway migration safety check in CI (fails if a previously-applied
  migration file was edited)

**Definition of Done:** a fresh `git clone` + `docker compose up --build`
brings up the entire stack and the smoke test in `workflows.md` passes
against it.

**Prompt template:**
> Read `context/workflows.md` §CI/CD pipeline. Build
> `backend/Dockerfile` as a multi-stage build. Assemble the full
> `docker-compose.yml` for all five containers per
> `context/architecture.md`. Build the GitHub Actions pipeline: lint,
> test with coverage gate, `newman run` against the collection from
> Phase 13, Docker build, deploy, and the smoke test curling both
> `https://advisor.yibs.cm/` and `/api/v1/public/stats`. Add a CI check
> that fails if any already-applied Flyway migration file's checksum
> changed.

### ✅ Test with Postman

```
GET {{prodBaseUrl}}/public/stats
```
against the deployed URL → expect `200`, same shape as Phase 11's local
test. This is the final confirmation the whole backend roadmap is
correctly deployed end-to-end.

---

## How to run this with an agent, in general

Same discipline as the frontend roadmap:

- **One phase per session/PR** — a "build the whole backend" prompt
  produces something unreviewable.
- **Name the context files to read**, every time — don't rely on the
  agent remembering earlier phases' files.
- **Run the Postman checks yourself before approving the phase.** An
  agent reporting "tests pass" isn't the same as you seeing a `200` with
  the right shape in Postman — the checks above exist so you have an
  independent, external verification step the agent can't mark its own
  homework on.
- **Never let a later phase redefine an earlier contract silently.** If
  Phase 8 discovers the risk endpoint from Phase 7 needs a field it
  doesn't have, that's a documented change to `api-reference.md` in the
  Phase 8 PR, with a note on why — not a quiet edit.