# Frontend Implementation Roadmap

This is the phase-by-phase plan for building Compass's frontend **before**
the backend exists. It assumes you've read
[`AGENTS.md`](../AGENTS.md), [`architecture.md`](./architecture.md),
[`ui-context.md`](./ui-context.md), [`api-reference.md`](./api-reference.md),
and [`code-standards.md`](./code-standards.md).

## The core idea: contract-first mocking

You cannot build real frontend features against a backend that doesn't
exist yet, and you shouldn't build against fake, made-up data either —
both lead to a rewrite later. The fix a senior frontend team uses: build
against **Mock Service Worker (MSW)** handlers that return exactly the
shapes documented in `api-reference.md`. The frontend never knows it's
talking to a mock — it hits the same Axios client, same URL, same
envelope. When the backend ships, you delete the MSW handlers (or keep
them for tests/Storybook) and nothing else changes.

This is why the phases below build the UI in the order a visitor/user
actually experiences the product (public site → auth → core app → AI
modules → admin), rather than in the order a backend team would build
it (auth → core domain → AI). Frontend-first means the experience drives
the sequence.

Each phase ends with a **Definition of Done** and an **exact prompt
template** to hand the agent. Don't skip the DoD checks between phases —
an agent moving to Phase 4 on a shaky Phase 1 compounds problems.

---

## Phase 0 — Project scaffold & tooling

**Goal:** an empty but fully configured app that lints, type-checks,
builds, and deploys a "Hello Compass" page — before a single real
feature exists.

**Deliverables**
- Vite + React 18 + TypeScript project
- Tailwind CSS + shadcn/ui initialised (`components.json`, `globals.css`
  with the tokens from `ui-context.md`)
- ESLint + Prettier (+ `prettier-plugin-tailwindcss`) configured, CI-ready
- React Router 6 installed, empty route tree
- MSW installed and wired into the dev server
- Axios client (`api/client.ts`) pointed at `VITE_API_BASE_URL`
- Vitest + React Testing Library configured, one smoke test passing
- Repo pushed, CI pipeline running lint + typecheck + test on every PR

**Definition of Done:** `npm run build` succeeds, `npm run lint` is
clean, one test passes in CI, a placeholder page renders at `/`.

**Prompt template:**
> Read `context/file-structure.md` and `context/code-standards.md`
> §React/TypeScript frontend. Scaffold the `frontend/` project exactly
> per that structure: Vite + React 18 + TypeScript, Tailwind CSS,
> shadcn/ui (New York style, slate base colour), React Router 6, MSW,
> Axios, Vitest + React Testing Library. Do not build any feature pages
> yet — just the tooling, the empty route tree, one placeholder route at
> `/`, ESLint/Prettier config, and a CI workflow that runs lint,
> typecheck, and test. Confirm `npm run build` succeeds before finishing.

---

## Phase 1 — Design system & layout shells

**Goal:** the two layout shells the whole app hangs off, built once
against tokens, before any real page exists.

**Deliverables**
- Design tokens wired into `tailwind.config.ts` / `globals.css` exactly
  per `ui-context.md` §Design system tokens (including the custom
  `--warning`/`--success` additions)
- shadcn primitives installed: `button`, `card`, `input`, `label`,
  `form`, `select`, `textarea`, `dialog`, `sheet`, `badge`, `alert`,
  `avatar`, `dropdown-menu`, `tabs`, `accordion`, `table`, `skeleton`,
  `separator`, `sonner`
- `<PublicLayout>` — nav bar (logo, Features/About/FAQ/Contact, Sign
  in, Create account) + footer, no auth check
- `<AppShell>` — sidebar (placeholder links), top bar (avatar +
  logout stub), responsive via `<Sheet>` on mobile
- Storybook (or a simple `/dev/components` route) showing every
  primitive and both shells with dummy content, for visual review
  without needing real pages yet

**Definition of Done:** both shells render correctly at mobile and
desktop breakpoints; every token in `ui-context.md` is used somewhere
visible; no hardcoded hex colours or MUI references anywhere in the diff.

**Prompt template:**
> Read `context/ui-context.md` in full. Implement the design tokens in
> `tailwind.config.ts` and `globals.css` exactly as specified, including
> the custom `--warning` and `--success` tokens shadcn doesn't ship by
> default. Install the shadcn primitives listed in `ui-context.md`
> §shadcn/ui primitives in use — only those, nothing extra. Build
> `<PublicLayout>` and `<AppShell>` per the component inventory. Add a
> `/dev/components` route (not a production route — exclude it from
> `sitemap.xml` later) that renders every installed primitive and both
> shells with placeholder content, so I can review the design system
> before any real page is built. Test at 375px and 1440px widths.

---

## Phase 2 — Public marketing site

**Goal:** the actual front door — this is what a visitor sees first, so
build it before anything requiring auth.

**Deliverables** (per `ui-context.md` §Route map, public rows)
- `<HeroSection>`, `<FeatureGrid>`, `<StatsStrip>`, `<ContactForm>`,
  `<PublicFooter>` components
- `LandingPage`, `FeaturesPage`, `AboutPage`, `FaqPage`, `ContactPage`
- MSW handlers for `GET /api/v1/public/stats`, `POST
  /api/v1/public/contact`, `POST /api/v1/public/newsletter` matching
  `api-reference.md` exactly (including the error envelope on failure)
- `react-helmet-async` meta tags per page
- `sitemap.xml` / `robots.txt` generation wired into the build

**Definition of Done:** every public route in `ui-context.md` renders,
the contact form round-trips through MSW and shows a success/error
`Alert`, honeypot field is present and excluded from visible layout,
Lighthouse SEO score ≥ 95 on `LandingPage`.

**Prompt template:**
> Read `context/architecture.md` §Public Website Architecture and
> `context/ui-context.md` §Route map (public rows) and §Component
> inventory. Build the public marketing site: `LandingPage`,
> `FeaturesPage`, `AboutPage`, `FaqPage`, `ContactPage`, using
> `<PublicLayout>` from Phase 1. Build `<HeroSection>`, `<FeatureGrid>`,
> `<StatsStrip>`, `<ContactForm>`, `<PublicFooter>` per the component
> inventory table. Add MSW handlers for the three `/api/v1/public/*`
> endpoints in `context/api-reference.md`, matching the response
> envelope and error codes exactly — including a simulated rate-limit
> 429 response so we can test that UI state. Every page needs
> `react-helmet-async` title/description/OG tags. Generate
> `sitemap.xml`/`robots.txt` at build time excluding `/student`,
> `/lecturer`, `/admin`, `/ai`, and `/dev`. Do not build the login/register
> forms yet — link to `/login` and `/register` but leave them as stub
> routes for Phase 3.

---

## Phase 3 — Authentication UI

**Goal:** the on-ramp from public visitor to authenticated user.

**Deliverables**
- `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`
- `react-hook-form` + `zod` schemas matching the validation rules in
  `security.md` §Password security (≥8 chars, uppercase, digit, special
  char)
- Auth context/store: access token in memory only (never
  `localStorage` — this is a hard rule from `security.md`), refresh
  handled via Axios interceptor
- MSW handlers for all six `/api/v1/auth/*` endpoints, including a
  `401 TOKEN_EXPIRED` scenario to test the refresh-and-retry interceptor
  logic end-to-end against the mock

**Definition of Done:** a full register → login → refresh → logout
loop works end-to-end against MSW with no real backend; token is
confirmed (via a test) to never touch `localStorage`/`sessionStorage`;
form validation errors map to field-level messages, not just a toast.

**Prompt template:**
> Read `context/security.md` in full — the token storage rule is
> non-negotiable: access token in memory only, refresh token is an
> HttpOnly cookie the frontend never reads directly. Read
> `context/api-reference.md` §Authentication. Build `LoginPage`,
> `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` with
> `react-hook-form` + `zod`, using the shadcn `Form` component. Build the
> Axios interceptor that attaches the access token and, on a 401 with
> `errorCode: TOKEN_EXPIRED`, calls `/auth/refresh` once and retries the
> original request — write a test proving this works via MSW. Add MSW
> handlers for all six `/api/v1/auth/*` endpoints from
> `api-reference.md`, matching every documented error code. Write a test
> that fails the build if the access token is ever written to
> `localStorage` or `sessionStorage`.

---

## Phase 4 — Authenticated shell & routing guards

**Goal:** the skeleton every authenticated feature will render inside —
built once, correctly, before the features that depend on it.

**Deliverables**
- `<ProtectedRoute>` — redirects unauthenticated users to `/login`,
  shows a 403 page for wrong-role access
- Full `<AppShell>` — role-aware sidebar nav (different links for
  STUDENT/LECTURER/ADMIN per `ui-context.md` §Route map)
- Route tree wired for every authenticated route in `ui-context.md`,
  each rendering a placeholder/skeleton page for now
- `<ApiErrorAlert>` global error boundary pattern established

**Definition of Done:** logging in as each of the three roles (via MSW
fixtures) lands on the correct dashboard shell with the correct nav
items visible and every other role's routes correctly blocked with a
403, not a blank page or crash.

**Prompt template:**
> Read `context/ui-context.md` §Route map in full (all authenticated
> rows) and `context/code-standards.md` §Structure. Build
> `<ProtectedRoute>` with role-based access control matching the Access
> column exactly. Wire every authenticated route into the router with a
> placeholder page (just a heading + the route name) — do not build real
> feature content yet, that's later phases. Build out the full
> `<AppShell>` sidebar with role-aware nav items. Add three MSW user
> fixtures (one per role) and a way to switch between them in dev (a
> `/dev` control, not shipped to production) so I can manually verify
> routing/guards for all three roles before any real feature exists.

---

## Phase 5 — Core domain features (Student, Course, Performance)

**Goal:** the non-AI CRUD backbone — build this before the AI modules
since the AI pages consume this data (a GPA trend chart needs
`PerformanceSummary` data to exist first, even as a mock).

**Deliverables**
- `StudentDashboard`, `StudentCoursesPage`, `StudentResultsPage`,
  `StudentProfilePage`
- `LecturerDashboard`, `LecturerStudentsPage`, `LecturerCoursesPage`
- `AdminUsersPage`, `AdminCoursesPage` (full CRUD UI — table, create/edit
  dialog, delete confirmation)
- `<GpaTrendChart>` component
- MSW handlers for `/students/*`, `/courses/*`, `/performance/*` with
  realistic fixture data (multiple students, semesters, courses) so
  charts and tables have something meaningful to render

**Definition of Done:** an admin can create a course, assign a lecturer,
and a student fixture shows enrolment + a GPA trend across at least 3
semesters of mock data — all client-side against MSW.

**Prompt template:**
> Read `context/database-schema.md` for the exact shape of `students`,
> `courses`, `enrolments`, `grade_records`, `performance_summaries`, and
> `context/api-reference.md` §Student management, §Course management,
> §Academic performance. Build the CRUD pages listed for STUDENT,
> LECTURER, and ADMIN roles, using `<Table>`, `<Dialog>`, and `<Form>`
> from shadcn. Build `<GpaTrendChart>` using `recharts` per
> `ui-context.md`. Create MSW fixtures with at least 5 students across 2
> programmes, 8 courses, and 3 semesters of grade history so the UI has
> realistic data to render — this fixture set will be reused by Phase 6
> AI module pages, so make it detailed enough to support risk/career
> features later (include varying attendance and score data per
> student).

---

## Phase 6 — AI module UIs

**Goal:** the differentiator features — built last among "real
features" because they're the most interaction-heavy and benefit from
the shell/data patterns already being solid.

**Deliverables** (one sub-phase per module, ship independently)
- 6a. `<ChatInterface>` + `AIChatPage` — streaming-style message list,
  session history, RAG citation display
- 6b. `<RiskBadge>` + `RiskPage` — risk level, factors, recommended
  actions
- 6c. `<PdfUploadDropzone>` + `ResearchPage` — upload, progress,
  structured analysis display, history list
- 6d. `<ExamQuestionEditor>` + `ExamGeneratorPage` — generation form,
  drag-and-drop question list, MCQ option editing
- 6e. `<CareerRecommendationCard>` + `CareerPage` — ranked cards, skills
  gap, certifications
- MSW handlers for all `/api/v1/ai/*` endpoints, including realistic
  latency simulation (these are the slowest calls in the real system —
  UI must handle loading states well, not just happy-path instantly)

**Definition of Done:** every AI page has a real loading state (skeleton,
not a blank screen), a real error state (`<ApiErrorAlert>`, not a crash),
and an empty state (e.g., "no chat history yet") — not just the
happy-path render. Ship 6a–6e as separate PRs, not one giant one.

**Prompt template (repeat per sub-phase, swap the module):**
> Read `context/architecture.md` §AI integration strategy and
> `context/api-reference.md` §AI modules for the [chatbot / risk
> prediction / research assistant / exam generator / career engine]
> endpoints. Build `<ChatInterface>` and `AIChatPage` [or the relevant
> component/page pair] per `context/ui-context.md` §Component inventory.
> Add an MSW handler for this endpoint with a simulated 800ms–2s delay
> (these calls hit a real LLM in production and are never instant) and
> build three explicit UI states: loading (skeleton, not blank), error
> (`<ApiErrorAlert>` with a retry action), and empty (first-time-use
> messaging). Only build this one module — don't start the next one in
> the same PR.

---

## Phase 7 — Admin RAG management

**Goal:** the one admin feature that's genuinely part of the AI story
(document upload for the knowledge base), kept separate since it depends
on Phase 6's upload patterns.

**Deliverables**
- `AdminRagPage` — reuses `<PdfUploadDropzone>` from Phase 6c, shows
  indexed document list and chunk counts
- MSW handler for `/admin/rag/upload`

**Definition of Done:** admin can "upload" a PDF (against MSW) and see it
appear in an indexed-documents list.

**Prompt template:**
> Read `context/api-reference.md` §AI modules (`/admin/rag/upload`) and
> reuse `<PdfUploadDropzone>` built in Phase 6c. Build `AdminRagPage`
> with an indexed-document list below the uploader. Add the MSW handler.

---

## Phase 8 — Cross-cutting polish

**Goal:** the pass that separates a student project from something that
looks like it came out of a top product org. Do this only after every
page exists — polishing an incomplete app wastes the pass.

**Deliverables**
- Accessibility audit: every interactive element keyboard-reachable,
  proper ARIA labels on icon-only buttons, colour contrast checked
  against the tokens in `ui-context.md` (WCAG AA minimum)
- Responsive audit: every page at 375px, 768px, 1440px — no horizontal
  scroll, no clipped content
- Consistent loading/error/empty states across every page (not just the
  AI pages from Phase 6 — the CRUD pages from Phase 5 too)
- Toast/`sonner` notifications standardised for every mutation
  (create/update/delete success and failure)
- Dark mode (shadcn ships this nearly for free via CSS variables — worth
  doing if `ui-context.md` tokens are set up as variables, which they are)

**Definition of Done:** a Lighthouse accessibility score ≥ 95 across the
five most-visited pages; no page has a bare `console.error` as its only
error handling; every mutation gives the user visible feedback.

**Prompt template:**
> Audit every page built in Phases 2–7 against
> `context/code-standards.md` and `context/ui-context.md`. Fix any
> missing loading/error/empty state, any icon-only button without an
> `aria-label`, any layout that breaks at 375px width. Standardise all
> create/update/delete mutations to show a `sonner` toast on
> success/failure. Add dark mode support using the existing CSS
> variable tokens — verify every custom `--warning`/`--success` token
> has a sensible dark-mode value too. Run and report a Lighthouse
> accessibility score for `LandingPage`, `StudentDashboard`, and
> `AIChatPage`.

---

## Phase 9 — Test coverage pass

**Goal:** lock in everything built so integration with the real backend
in Phase 10 doesn't silently break UI behaviour.

**Deliverables**
- React Testing Library component tests for every shared component in
  `ui-context.md` §Component inventory
- Playwright (or Cypress) e2e for the three critical user journeys:
  visitor → register → login → dashboard; student → chat → risk check;
  lecturer → generate exam
- MSW handlers formalised as the shared test fixture layer (not
  duplicated between dev and test)

**Definition of Done:** CI runs component tests + e2e on every PR; the
three critical journeys are green.

**Prompt template:**
> Read `context/code-standards.md` §Testing. Write React Testing Library
> tests for every component in `context/ui-context.md` §Component
> inventory that doesn't have one yet. Write Playwright e2e tests for
> these three journeys: (1) visitor lands on `/`, clicks through to
> `/register`, registers, lands on the correct dashboard; (2) a student
> logs in, sends a chat message, and checks their risk page; (3) a
> lecturer logs in and generates an exam. Reuse the MSW handlers already
> built — don't create a second mocking layer for tests.

---

## Phase 10 — Backend integration

**Goal:** the payoff of contract-first mocking — this should be the
smallest phase in the whole roadmap.

**Deliverables**
- Point `VITE_API_BASE_URL` at the real `spring-api`
- Remove (or gate behind `import.meta.env.DEV`) the MSW service worker
  registration
- Run the full e2e suite from Phase 9 against the real backend
- Fix any contract drift discovered (and update `api-reference.md` if
  the real backend legitimately differs — the doc should always be
  accurate to what's deployed)

**Definition of Done:** every e2e test from Phase 9 passes against the
real backend with zero frontend code changes beyond the API base URL and
MSW gating.

**Prompt template:**
> Switch the frontend from MSW to the real `spring-api` at
> `VITE_API_BASE_URL`. Run the full Playwright suite from Phase 9 against
> it. For every failure, diagnose whether it's a genuine backend
> contract mismatch against `context/api-reference.md` (fix the backend
> or update the doc, don't patch around it in the frontend) versus a
> frontend bug that MSW was masking (fix the frontend). Report which
> category each failure fell into.

---

## Phase 11 — Production readiness

**Goal:** final pass before this ships behind the real domain.

**Deliverables**
- Code-splitting per route (`React.lazy` + `Suspense`) — verify bundle
  size with `vite-bundle-visualizer`
- Lighthouse performance ≥ 90 on `LandingPage` (it's the SEO-critical
  page)
- Final `sitemap.xml`/`robots.txt` review against the real deployed
  routes
- Error boundary at the app root, not just per-page

**Definition of Done:** production build deployed via the pipeline in
`context/workflows.md` §CI/CD pipeline, smoke test passing against the
real domain.

**Prompt template:**
> Read `context/workflows.md` §CI/CD pipeline. Add route-based code
> splitting with `React.lazy`/`Suspense` for every page in
> `context/ui-context.md`. Run a bundle analysis and report the three
> largest chunks. Add a root-level error boundary. Verify Lighthouse
> performance on `LandingPage` is ≥ 90 and fix whatever the report flags
> first. Confirm the deploy smoke test in `workflows.md` passes.

---

## How to run this with an agent, in general

- **One phase per session/PR.** Don't ask the agent to "build the
  frontend" in one prompt — that produces something that looks done but
  is unreviewable and untested. The phase boundaries above are the
  review checkpoints.
- **Always name the context files to read**, don't assume the agent will
  find them — the prompt templates above do this deliberately.
- **State the Definition of Done in the prompt**, not just the
  deliverable list — agents optimize for what you tell them "done" means.
- **Review at every phase boundary** before starting the next phase.
  Catching a token-storage mistake in Phase 3 costs one conversation;
  catching it in Phase 10 costs a security incident.
- **Feed real fixture data early** (Phase 5). AI-module UIs built against
  one lonely mock student produce charts and cards that look fine empty
  and break the moment real data has edge cases (a student with one
  semester of grades, a 0% attendance record, a tied GPA rank).