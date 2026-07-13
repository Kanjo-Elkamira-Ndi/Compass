# Code Standards

Read `architecture.md` §Layered request flow before this — the layering
rule is the single most important thing to follow.

## Java / Spring Boot

### Layering (strict)

`Controller → Service → Repository → Domain/DTO`. A controller never
calls a repository. A service never returns a JPA entity — map to a DTO
with MapStruct first. See `architecture.md` for the exact package →
layer mapping.

### Package-by-feature, not package-by-layer

The codebase groups by domain concept (`domain.user`, `domain.course`,
`service.ai`, …), not by technical layer at the top level. Full tree in
`file-structure.md`. When adding a new domain concept, create its
sub-package under `domain`, `service`, `dto.request`, `dto.response` —
don't invent a new top-level package.

### Naming

| Kind | Convention | Example |
|---|---|---|
| Interface | `IXxxService` / `IXxxRepository` | `IStudentService` |
| Implementation | `XxxServiceImpl` | `StudentServiceImpl` |
| Controller | `XxxController` | `CourseController` |
| Request DTO | `XxxRequest` | `CreateStudentRequest` |
| Response DTO | `XxxResponse` | `GpaResponse` |
| Custom exception | `XxxException`, extends a domain-appropriate base | `StudentNotFoundException` |
| MapStruct mapper | `XxxMapper` (`@Mapper` interface) | `StudentMapper` |

### OOP patterns already chosen — reuse, don't reinvent

| Pattern | Where | Why |
|---|---|---|
| Template Method | `User` abstract class (`getRole`, `getDashboardUrl`, `getDisplayName`) | `Student`/`Lecturer`/`Admin` each implement the abstract contract; `JwtTokenProvider` calls polymorphically |
| Strategy | `AIProviderStrategy` (`OpenAiProviderImpl`, `GeminiProviderImpl`) | Swap AI provider via config, not code |
| Factory | `QuestionGeneratorFactory.getGenerator(Difficulty)` | Returns the right prompt/token-budget/question-distribution strategy per difficulty |
| Observer | `RiskAlertEvent` via `ApplicationEventPublisher`, handled by `RiskAlertListener` | Async notification when risk level = CRITICAL |
| Builder | `PromptBuilder` fluent API | Avoids telescoping constructors for AI prompt assembly |
| Repository | Spring Data JPA interfaces | Service layer never knows the underlying SQL |

When a task looks like it needs "a new way to vary behaviour by type" or
"a new way to build a complex object," check this table first — there is
probably already a pattern in place to extend rather than a reason to add
a new one.

### Streams API

Streams are the default for in-memory collection processing in the
service layer — see the worked examples in `architecture.md`'s
originating design doc (GPA weighted sum, cohort ranking via
`Comparator`, trend grouping via `Collectors.groupingBy`, eligible-course
filtering, `DoubleSummaryStatistics` for risk profiles). Prefer a
`Stream` pipeline over a manual loop for filter/map/reduce-shaped logic
in services; keep loops for genuinely imperative work (I/O, mutation of
external state).

### Testing

- **JUnit 5** for all tests, **Mockito** (`@Mock`) for service
  dependencies.
- **Every `@Service` method containing business logic needs a unit
  test.** No exceptions for "small" methods.
- **Integration tests** exercise the full `Controller → Service →
  Repository → Database` chain against Postgres via Testcontainers or
  the `docker-compose.test.yml` stack, not H2 mocking of Postgres-only
  features (JSONB, pgvector).
- **CI coverage gate:** JaCoCo fails the build if service-layer coverage
  < 80% — see `workflows.md` §CI/CD pipeline.
- Never commit a test that depends on network access to OpenAI/Gemini —
  mock `AIProviderStrategy`.

### Error handling

All exceptions bubble to `GlobalExceptionHandler`
(`@RestControllerAdvice`), which maps them to the `ApiResponse` error
envelope and an `errorCode` from `api-reference.md`. Never let a raw
stack trace or exception message reach the client.

## React / TypeScript frontend

### Structure

Route-first split at the top level: **public marketing routes** under
`<PublicLayout>` vs **authenticated app routes** under `<AppShell>` +
`<ProtectedRoute>`. Never mix the two in one component tree — see
`architecture.md` §Public Website Architecture and `ui-context.md`
§Route Map. Full folder layout in `file-structure.md`.

### Conventions

- Functional components + hooks only, no class components.
- **shadcn/ui + Tailwind CSS**, not Material UI. shadcn components are
  generated into `src/components/ui/` (Button, Card, Dialog, Input,
  Badge, Alert, etc.) via the shadcn CLI and then owned/edited directly
  in the repo — they are not an npm dependency, so it's normal and
  expected to tweak one, but do it in `components/ui/`, not by
  overriding styles ad hoc in a page.
- Use the design tokens in `ui-context.md` (CSS variables in
  `tailwind.config.ts` / `globals.css`) — don't hand-roll a colour or
  spacing value that already has a token, and don't reach for an inline
  `style` prop where a Tailwind utility class exists.
- Compose from existing `components/ui/*` primitives before writing new
  markup + Tailwind from scratch — e.g. a new badge variant is a Tailwind
  `class-variance-authority` (cva) variant on the existing `<Badge>`, not
  a new component.
- API calls go through a shared Axios instance with an interceptor that
  attaches the access token and handles 401 → refresh → retry; don't call
  `axios.get` directly in a component.
- `<ApiErrorAlert>` renders all Axios error responses — map `errorCode`
  to a friendly message there, not inline in every component.
- Public-site components (`<HeroSection>`, `<FeatureGrid>`, `<StatsStrip>`,
  `<ContactForm>`, `<PublicFooter>`) never import anything from the
  authenticated app's state/auth context — they must render correctly
  for a fully unauthenticated visitor.

### Naming

- Components: `PascalCase`, one component per file, filename matches
  component name (`RiskBadge.tsx` → `RiskBadge`).
- Hooks: `useXxx`.
- Pages (route-level components): `XxxPage` (`StudentDashboard` is the
  one documented exception — kept as-is for consistency with the SAD).

## Git / commits

See `workflows.md` §Git and PR conventions for branch naming, commit
style, and what a PR needs before merge.
