# UI Context

The React frontend is a Single-Page Application using React Router 6,
**shadcn/ui**, and **Tailwind CSS**. shadcn is not a component library
dependency — components are generated into `src/components/ui/` via the
shadcn CLI and then owned and edited directly in this repo (see
`file-structure.md`). This file is the design-system and route source of
truth — don't introduce a colour, spacing value, or route that isn't
here without adding it here first.

## Design system tokens

Defined as CSS variables in `globals.css` and surfaced to Tailwind via
`tailwind.config.ts` (shadcn's standard "New York" token setup), so use
the Tailwind utility class, not a raw hex value, in components.

| Token | CSS variable | Value | Tailwind class | Usage |
|---|---|---|---|---|
| Primary | `--primary` | `#1e3a8a` (blue-900) | `bg-primary` / `text-primary` | Buttons, links, active states, headers |
| Secondary | `--secondary` | `#7c3aed` (violet-600) | `bg-secondary` / `text-secondary` | AI module accents, badges |
| Destructive | `--destructive` | `#dc2626` (red-600) | `bg-destructive` / `text-destructive` | Risk CRITICAL badge, error alerts |
| Warning | `--warning` (custom, not a default shadcn token — added in `globals.css`) | `#d97706` (amber-600) | `bg-warning` / `text-warning` | Risk AT_RISK badge, warnings |
| Success | `--success` (custom) | `#16a34a` (green-600) | `bg-success` / `text-success` | Risk EXCELLENT badge, success alerts |
| Muted | `--muted` | `#f1f5f9` (slate-100) | `bg-muted` / `text-muted-foreground` | Secondary text, disabled states |
| Typography — body | — | Inter, 14px / `leading-normal` | `text-sm leading-normal` | Standard text |
| Typography — heading | — | Inter, 20–32px, `font-semibold` | `text-xl` … `text-3xl font-semibold` | Page titles, section headers |
| Spacing unit | — | Tailwind's default 4px scale | `p-2`, `gap-4`, etc. | All margins/paddings/gaps use the Tailwind scale, not arbitrary values |
| Border radius | `--radius` | `0.5rem` (shadcn default) | `rounded-lg` (maps to `--radius`) | Cards, buttons, badges |

`--warning` and `--success` are additions on top of shadcn's default
token set (which only ships `primary`/`secondary`/`destructive`/`muted`/
`accent`) — add them once in `globals.css` and `tailwind.config.ts`,
don't redefine them per-component.

## Route map

Public routes (unauthenticated, `<PublicLayout>`) are listed first —
these exist to convert a visitor into a registered account, see
`architecture.md` §Public Website Architecture.

| Route | Access | Page component |
|---|---|---|
| `/` | Public | `LandingPage` — hero, feature highlights, "why YIBS Advisor", primary CTA to `/register` |
| `/features` | Public | `FeaturesPage` — walkthrough of the five AI modules with screenshots |
| `/about` | Public | `AboutPage` — institution context (YIBS), programme background |
| `/faq` | Public | `FaqPage` — accordion of common questions |
| `/contact` | Public | `ContactPage` — enquiry form, posts to `/api/v1/public/contact` |
| `/login` | Public | `LoginPage` — email/password, link to forgot-password |
| `/register` | Public | `RegisterPage` — name, email, password, role selector |
| `/forgot-password` | Public | `ForgotPasswordPage` |
| `/reset-password/:token` | Public | `ResetPasswordPage` |
| `/student/dashboard` | STUDENT | `StudentDashboard` — GPA trend chart, enrolments, risk badge, quick actions |
| `/student/courses` | STUDENT | `StudentCoursesPage` — available courses, enrol/drop |
| `/student/results` | STUDENT | `StudentResultsPage` — grade records, GPA/CGPA per semester |
| `/student/profile` | STUDENT | `StudentProfilePage` — editable name and skills list |
| `/lecturer/dashboard` | LECTURER | `LecturerDashboard` — assigned courses, at-risk alerts, quick exam button |
| `/lecturer/students` | LECTURER | `LecturerStudentsPage` — student list, grade entry, risk trigger |
| `/lecturer/courses` | LECTURER | `LecturerCoursesPage` — assigned courses, timetable view |
| `/ai/chat` | STUDENT | `AIChatPage` — chat UI, session history, RAG source citation |
| `/ai/risk` | STUDENT | `RiskPage` — risk classification, factors, recommended actions |
| `/ai/career` | STUDENT | `CareerPage` — ranked career cards, skills gap, certifications |
| `/ai/research` | STUDENT/LECTURER | `ResearchPage` — PDF drag-drop, structured analysis, history |
| `/ai/exam-generator` | LECTURER | `ExamGeneratorPage` — topic/difficulty/count form, question editor |
| `/admin/users` | ADMIN | `AdminUsersPage` — user list, create/edit/deactivate |
| `/admin/courses` | ADMIN | `AdminCoursesPage` — course CRUD, assign lecturer, timetable generator |
| `/admin/rag` | ADMIN | `AdminRagPage` — upload university documents, view indexed chunks |

## shadcn/ui primitives in use

Generated once via `npx shadcn@latest add <name>` into
`src/components/ui/`, then owned in-repo (see `file-structure.md`).
Install only what's actually used — don't `add` the full catalogue.

`button`, `card`, `input`, `label`, `form` (react-hook-form + zod
integration), `select`, `textarea`, `dialog`, `sheet` (mobile sidebar),
`badge`, `alert`, `avatar`, `dropdown-menu`, `tabs`, `accordion` (FAQ
page), `table`, `skeleton` (loading states), `separator`, `toast`
(`sonner`, shadcn's recommended toast).

## Component inventory

| Component | Built from | Description |
|---|---|---|
| `<PublicLayout>` | `NavigationMenu` + custom footer | Wraps all unauthenticated marketing routes: top nav (logo, Features/About/FAQ/Contact links, Sign in, Create-account `<Button>`) + footer. Sibling to `<AppShell>`, never renders the sidebar. |
| `<HeroSection>` | `Button` (primary + `variant="outline"`) | Full-width landing banner: headline, value prop, primary CTA to `/register`, secondary link to `/login`. |
| `<FeatureGrid>` | `Card` in a Tailwind `grid` | Responsive grid of `Card`s summarising the five AI modules, each linking to `/features`. |
| `<StatsStrip>` | `Card` + `Skeleton` while loading | Row of animated counters fed by `GET /api/v1/public/stats`. |
| `<ContactForm>` | `Form` + `Input` + `Textarea` + `Select` + `Button`, react-hook-form + zod schema | Name, email, role-interest selector, message, honeypot field. Posts to `/api/v1/public/contact`. |
| `<PublicFooter>` | `Separator` + plain Tailwind layout | Site-wide footer: institution details, quick links, contact info. |
| `<AppShell>` | `Sheet` (mobile) / fixed sidebar (desktop) + `Avatar` + `DropdownMenu` | Persistent authenticated layout: sidebar (role-aware links), top app bar (avatar + logout), main content area. |
| `<ProtectedRoute>` | — (logic only, no UI) | Wraps React Router routes. Checks auth context → redirect to `/login`; checks role → 403 page. |
| `<GpaTrendChart>` | `recharts` inside a `Card` | Line chart. Props: `{ data: {semester: string, gpa: number}[] }`. |
| `<RiskBadge>` | `Badge` with a `cva` variant per level | Colour from `RiskLevel`: EXCELLENT=`success`, PASSING=`secondary`, AT_RISK=`warning`, CRITICAL=`destructive`. |
| `<ChatInterface>` | `ScrollArea` + `Input` + `Button` | Scrollable message list, input + send. Role-labelled bubbles (USER=right, ASSISTANT=left). Shows RAG citation if present. |
| `<ExamQuestionEditor>` | `Card` list (dnd-kit for drag/drop) + `RadioGroup` | Drag-and-drop `ExamQuestion` cards: type `Badge`, editable text, delete. MCQ cards show option radios. |
| `<CareerRecommendationCard>` | `Card` + `Badge` list | Career title, demand `Badge`, rationale, skills-to-develop `Badge`s, certifications list. |
| `<PdfUploadDropzone>` | `react-dropzone` inside a dashed-border `Card` | PDF-only. Shows filename/size, upload progress (`Progress`). |
| `<ApiErrorAlert>` | `Alert` (`variant="destructive"`) or `sonner` toast | Renders Axios error responses. Maps `errorCode` → friendly message. Auto-dismiss after 8s. |

## Rule for agents

Adding a page or component: check this table first for an existing
analog and its prop shape before creating something new. If the UI need
maps to a shadcn primitive not yet in `components/ui/`, add it via the
CLI in the same PR and list it above — don't hand-roll something shadcn
already ships. Adding a route: update this table **and**
`frontend/src/routes/` **and** `frontend/public/sitemap.xml`/`robots.txt`
if it's public — see `file-structure.md`.
