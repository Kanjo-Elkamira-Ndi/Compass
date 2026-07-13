# Architecture

The system follows a layered, container-based architecture, captured
across the C4 model's four levels. Read `project-overview.md` first if you
haven't.

## C4 Level 1 — System Context

Three human actors (Student, Lecturer, Admin) plus one unauthenticated
actor (Website Visitor) interact with the system, which in turn calls
three external LLM providers. Full actor table in `project-overview.md`.

## C4 Level 2 — Containers

Five Docker containers on an internal bridge network:

| Container | Technology | Port | Responsibility |
|---|---|---|---|
| `react-app` | React 18 + shadcn/ui + Tailwind CSS, Nginx 1.25 | 80/443 | Serves the SPA (both the authenticated app **and** the public marketing site, see below); proxies `/api/*` to `spring-api` |
| `spring-api` | Java 21 + Spring Boot 3 | 8080 | All REST endpoints, JWT filter chain, service layer, Spring AI integration |
| `postgres-db` | PostgreSQL 16 + pgvector | 5432 | Persists all domain data and vector embeddings; schema versioned by Flyway |
| `redis-cache` | Redis 7 | 6379 | Revoked-refresh-token TTL cache, AI response cache, public-stats cache |
| `nginx-proxy` | Nginx reverse proxy | 80/443 | TLS termination; routes `/` → `react-app`, `/api` → `spring-api`; handles CORS |

## C4 Level 3 — Spring Boot components

Every component below maps to one Spring stereotype and one source file.
Do not put business logic outside a `@Service`; do not put a `@Service`
without an interface it implements (`IXxxService`).

| Component | Stereotype | Responsibility |
|---|---|---|
| `AuthController` | `@RestController` | `/api/v1/auth/*` — register, login, refresh, logout, forgot/reset password |
| `StudentController` | `@RestController` | `/api/v1/students/*` — CRUD, search, pagination |
| `CourseController` | `@RestController` | `/api/v1/courses/*` — CRUD, enrol, drop, timetable |
| `PerformanceController` | `@RestController` | `/api/v1/performance/*` — GPA, CGPA, ranking, trends |
| `AIController` | `@RestController` | `/api/v1/ai/*` — routes to all five AI service components |
| `AdminController` | `@RestController` | `/api/v1/admin/*` — user management, RAG document upload |
| `PublicController` | `@RestController` | `/api/v1/public/*` — stats, contact, newsletter (see Public Website Architecture below) |
| `JwtAuthFilter` | `@Component` | Extends `OncePerRequestFilter`; validates Bearer token, loads `UserDetails`, sets `SecurityContext` |
| `JwtTokenProvider` | `@Component` | Signs/validates/parses JWT access + refresh tokens via `jjwt` |
| `StudentService` | `@Service` | Implements `IStudentService`; CRUD + search via MapStruct DTO mapping |
| `CourseService` | `@Service` | Implements `ICourseService`; enforces enrolment business rules |
| `PerformanceService` | `@Service` | GPA/CGPA via Streams; ranking via `Comparator`; persists `PerformanceSummary` |
| `ChatbotService` | `@Service` | Builds `ChatClient` prompts; manages session history; invokes RAG if enabled |
| `RiskAssessmentService` | `@Service` | Aggregates grade components, calls AI provider, maps score → `RiskLevel` |
| `ResearchAssistantService` | `@Service` | Accepts PDF multipart, extracts text via PDFBox, builds structured analysis prompt |
| `ExamGeneratorService` | `@Service` | Builds typed exam prompt, parses JSON → `List<ExamQuestion>` |
| `CareerRecommendationService` | `@Service` | Builds student profile object, submits to AI, parses ranked career list |
| `RagIngestionService` | `@Service` | Chunks PDFs, generates embeddings via OpenAI, stores in pgvector via `PgVectorStore` |
| `GlobalExceptionHandler` | `@RestControllerAdvice` | Catches custom exceptions, returns structured `ErrorResponse`, never leaks stack traces |

## C4 Level 4 — Layered request flow

```
HTTP Request → Nginx Proxy → Spring Security Filter Chain → Controller → Service → Repository → PostgreSQL
```

No layer may skip the layer beneath it.

| Layer | Package | Rule |
|---|---|---|
| Presentation | `com.yibs.advisor.controller` | Validate DTOs via `@Valid`, delegate immediately to service, return `ApiResponse<T>`. No business logic. |
| Service | `com.yibs.advisor.service` | All business logic, OOP patterns, Streams operations. Depends only on repository interfaces. Returns domain objects or DTOs. |
| Repository | `com.yibs.advisor.repository` | Spring Data JPA interfaces only. Custom queries via `@Query`. No business logic. |
| Domain | `com.yibs.advisor.domain` | Entities, value records, enums. No Spring annotations except JPA. Pure Java OOP. |
| DTO | `com.yibs.advisor.dto` | Request/response DTOs mapped via MapStruct. Entities never leave the service layer. |

## AI integration strategy

Spring AI's `ChatClient` is wrapped in an `AIProviderStrategy` interface so
providers are interchangeable at runtime.

> **Pattern — Strategy.** `AIProviderStrategy` is implemented by
> `OpenAiProviderImpl` and `GeminiProviderImpl`. Spring injects the active
> implementation based on `spring.ai.active-provider`. Switching providers
> is a config change, never a code change.

| Module | Provider | Prompt pattern |
|---|---|---|
| Academic Chatbot | OpenAI GPT-4o-mini | System prompt (university context) + conversation history + optional RAG chunks + user question |
| Risk Prediction | OpenAI GPT-4o-mini | Structured prompt with grade components; response constrained to JSON `{score, level, factors}` |
| Research Assistant | OpenAI GPT-4o | Extracted PDF text as document context; structured JSON output requested |
| Exam Generator | OpenAI GPT-4o-mini | Topic/difficulty/count/types specified; response constrained to JSON array of `ExamQuestion` |
| Career Engine | OpenAI GPT-4o-mini | Student profile JSON + career guidance system prompt; ranked JSON array response |
| RAG Embeddings | OpenAI `text-embedding-ada-002` | Document chunks → 1536-dim vector; stored in pgvector; cosine similarity at query time |

## Public Website Architecture

The system is fronted by a public, unauthenticated marketing website at
the root domain. This is the page prospective students, lecturers, and
administrators land on before any account exists — its job is discovery
and conversion into a registered account, not academic functionality.

- **Same container, separate route group.** The public site is served
  from the same `react-app` container, but is a fully separate route
  group in React Router: a `<PublicLayout>` (top nav, footer, no auth
  check) wraps marketing routes; the existing `<AppShell>` (sidebar,
  role-aware nav, `<ProtectedRoute>` guard) continues to wrap every
  authenticated route. No new container is needed at this scope. A future
  optimisation (out of scope now) would be a statically generated site on
  a separate subdomain for SEO/performance.
- **Conversion-first.** Every public page carries a primary CTA ("Create
  your account" → `/register`) and a secondary "Sign in" link (→
  `/login`).
- **SEO.** Page metadata (title, description, Open Graph tags) is managed
  per-route with `react-helmet-async`. A generated `sitemap.xml` and
  `robots.txt` (disallowing `/student`, `/lecturer`, `/admin`, `/ai`) are
  produced at build time and copied into the Nginx html root.
- **Narrow, safe API surface.** The public site talks to the backend only
  through `/api/v1/public/**` (see `api-reference.md`), which is
  unauthenticated, rate-limited, and returns no student/lecturer/academic
  data — only aggregate counters and lead-capture acknowledgements. See
  `security.md` §Public Endpoint Exposure for hardening details.
- **Full route list** is in `ui-context.md` §Route Map; **components**
  (`<HeroSection>`, `<FeatureGrid>`, `<StatsStrip>`, `<ContactForm>`,
  etc.) are in `ui-context.md` §Component Inventory.
