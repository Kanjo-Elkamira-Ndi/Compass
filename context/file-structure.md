# File Structure

Read `code-standards.md` §Package-by-feature before adding any new file —
this document tells you *where*, that one tells you *why*.

## Repository root

```
/
├── AGENTS.md                  # agent entry point (this context set)
├── context/                   # this directory — all *.md files described in AGENTS.md
├── .github/
│   └── copilot-instructions.md
├── backend/                   # Spring Boot API (spring-api container)
├── frontend/                  # React SPA (react-app container) — app + public site
├── docker-compose.yml
├── docker-compose.test.yml
└── .env.example
```

## Backend — `backend/src/main/java/com/yibs/advisor/`

```
com.yibs.advisor
├── AdvisorApplication.java              # @SpringBootApplication
│
├── domain.user/                         # User (abstract), Student, Lecturer, Admin, Role, UserStatus
├── domain.course/                       # Course, Enrolment, TimetableSlot, LecturerAvailability ← new
├── domain.performance/                  # GradeRecord, PerformanceSummary, GpaResult (record)
├── domain.ai/                           # RiskAssessment, ChatMessage, ResearchAnalysis, Exam,
│                                         # ExamQuestion, CareerRecommendation, DocumentChunk
├── domain.publicsite/                   # Lead  ← new: backs the public marketing site
├── domain.complaint/                    # Complaint, ComplaintReply, ComplaintAttachment,
│                                         # ComplaintStatusHistory + ComplaintCategory,
│                                         # ComplaintPriority, ComplaintStatus enums
├── domain.notification/                 # Notification, NotificationType
│
├── service.student/                     # IStudentService, StudentServiceImpl
├── service.course/                      # ICourseService, CourseServiceImpl
├── service.timetable/                   # ITimetableService, TimetableServiceImpl ← new:
│                                         #   lecturer availability CRUD + greedy timetable generator
├── service.performance/                 # IPerformanceService, PerformanceServiceImpl,
│                                         # ITranscriptService, TranscriptServiceImpl
│                                         # (HMAC-signed transcript authenticity tokens)
├── service.ai/                          # IAIService, ChatbotServiceImpl, RiskServiceImpl,
│                                         # ResearchServiceImpl, ExamServiceImpl, CareerServiceImpl,
│                                         # CourseRecommendationService  ← new: career-goal course ranking
├── service.ai.provider/                 # AIProviderStrategy, OpenAiProviderImpl,
│                                         # GeminiProviderImpl, PromptBuilder
├── service.ai.rag/                      # RagIngestionService, RagQueryService
├── service.publicsite/                  # PublicStatsService, LeadService  ← new
├── service.complaint/                   # IComplaintService, ComplaintServiceImpl,
│                                         # ComplaintSuggestionService, ComplaintEvent,
│                                         # ComplaintNotificationListener
├── service.notification/                # INotificationService, NotificationServiceImpl
│
├── controller/                          # AuthController, StudentController, CourseController,
│                                         # TimetableController ← new, PerformanceController,
│                                         # AIController, AdminController,
│                                         # PublicController  ← new, ComplaintController,
│                                         # NotificationController, LecturerController
│
├── dto.request/                         # RegisterRequest, LoginRequest, CreateStudentRequest,
│                                         # EnrolRequest, GradeSubmissionRequest, ExamRequest,
│                                         # ChatRequest, ContactRequest, NewsletterRequest,
│                                         # CreateComplaintRequest, ComplaintReplyRequest,
│                                         # UpdateComplaintStatusRequest, AssignComplaintRequest
├── dto.response/                        # StudentResponse, CourseResponse, GpaResponse,
│                                         # RiskResponse, PublicStatsResponse ← new, ApiResponse<T>,
│                                         # TranscriptTokenResponse, TranscriptVerificationResponse ← new,
│                                         # ComplaintResponse, ComplaintSummaryResponse,
│                                         # ComplaintReplyResponse, ComplaintAttachmentResponse,
│                                         # ComplaintStatusHistoryResponse, NotificationResponse,
│                                         # LecturerSummaryResponse, AiSuggestionResponse
│
├── repository/                          # UserRepository, StudentRepository, CourseRepository,
│                                         # EnrolmentRepository, GradeRepository,
│                                         # RiskAssessmentRepository, RevokedTokenRepository,
│                                         # LecturerAvailabilityRepository ← new, DocumentChunkRepository,
│                                         # LeadRepository  ← new, ComplaintRepository,
│                                         # ComplaintReplyRepository, ComplaintAttachmentRepository,
│                                         # ComplaintStatusHistoryRepository, NotificationRepository
│
├── mapper/                              # StudentMapper, CourseMapper, GradeMapper, RiskMapper,
│                                         # ComplaintMapper, ComplaintReplyMapper,
│                                         # ComplaintAttachmentMapper,
│                                         # ComplaintStatusHistoryMapper, NotificationMapper
│                                         # (MapStruct @Mapper interfaces)
│
├── security/                            # JwtAuthFilter, JwtTokenProvider, SecurityConfig,
│                                         # CustomUserDetailsService
│
├── exception/                           # StudentNotFoundException, CourseEnrolmentException,
│                                         # AIServiceException, InsufficientDataException,
│                                         # GlobalExceptionHandler, ErrorResponse,
│                                         # ComplaintNotFoundException,
│                                         # InvalidStatusTransitionException
│
└── config/                              # SpringAIConfig, RedisCacheConfig, AsyncConfig
                                          # (virtual threads), BucketConfig (rate limiting),
                                          # SchedulingConfig
```

```
backend/src/main/resources/
├── application.yml
├── db/migration/                        # Flyway: V1…V15 core schema/RAG history,
│                                         # V16…V19 research/timetable/risk-actions (see database-schema.md),
│                                         # V20__create_complaint_module.sql,
│                                         # V21__create_notifications.sql,
│                                         # V22__seed_demo_accounts.sql
└── ...

backend/src/test/java/com/yibs/advisor/  # mirrors main/java structure 1:1
```

## Frontend — `frontend/src/`

```
src/
├── main.tsx
├── App.tsx                              # top-level React Router setup:
│                                         # PublicLayout routes vs ProtectedRoute + AppShell routes
│
├── layouts/
│   ├── PublicLayout.tsx                 # nav bar + footer, no auth check  ← new
│   └── AppShell.tsx                     # sidebar, top bar, wraps all authenticated routes
│
├── pages/
│   ├── public/                          # ← new: unauthenticated marketing pages
│   │   ├── LandingPage.tsx
│   │   ├── FeaturesPage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── FaqPage.tsx
│   │   ├── ContactPage.tsx
│   │   └── VerifyTranscriptPage.tsx     # ← new: scans transcript QR → public verify
│   ├── auth/                            # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   ├── student/                         # StudentDashboard, StudentCoursesPage, StudentResultsPage, StudentProfilePage
│   ├── lecturer/                        # LecturerDashboard, LecturerStudentsPage, LecturerCoursesPage,
│                                         # LecturerAvailabilityPage ← new
│   ├── ai/                              # AIChatPage, RiskPage, CareerPage,
│                                         # CourseRecommendationPage ← new, ResearchPage, ExamGeneratorPage
│   ├── admin/                           # AdminUsersPage, AdminCoursesPage, AdminTimetablePage ← new,
│                                         # AdminRagPage
│   └── complaints/                      # ComplaintsListPage, ComplaintDetailPage
│
├── components/
│   ├── ui/                              # shadcn/ui primitives (generated via shadcn CLI, then
│   │                                     # owned in-repo): button.tsx, card.tsx, input.tsx,
│   │                                     # dialog.tsx, badge.tsx, alert.tsx, chip-style Badge
│   │                                     # variants via class-variance-authority, etc.
│   ├── public/                          # ← new: HeroSection, FeatureGrid, StatsStrip,
│   │                                     #        ContactForm, PublicFooter
│   ├── complaints/                      # complaint-form, reply-composer, attachment-list,
│   │                                     # status-badge, priority-badge
│   ├── notifications/                   # notification-bell
│   ├── ProtectedRoute.tsx
│   ├── GpaTrendChart.tsx
│   ├── RiskBadge.tsx
│   ├── ChatInterface.tsx
│   ├── ExamQuestionEditor.tsx
│   ├── CareerRecommendationCard.tsx
│   ├── PdfUploadDropzone.tsx
│   ├── timetable/WeeklyTimetable.tsx   # ← new: shared weekly grid (admin/lecturer/student views)
│   └── ApiErrorAlert.tsx
│
├── api/                                 # Axios instance + one module per resource
│   ├── client.ts                        # shared instance, interceptors (token attach, refresh)
│   ├── auth.ts / students.ts / courses.ts / performance.ts / ai.ts
│   ├── complaints.ts                    # complaint CRUD, replies, attachments, lecturer list
│   ├── notifications.ts                 # notification list, unread count, mark-read
│   └── public.ts                        # ← new: /api/v1/public/* calls
│
├── lib/
│   ├── utils.ts                         # cn() (clsx + tailwind-merge) — shadcn's standard helper
│   ├── transcript-pdf.ts                # ← new: client-side PDF generation (jsPDF + autoTable)
│   │                                    #   + QR authenticity code (qrcode) for the transcript
│   └── complaint-labels.ts              # STATUS_LABELS for complaint status badges
├── routes/                              # route constants — single source of truth for paths
└── types/                               # shared TS types/interfaces mirroring backend DTOs
```

```
frontend/
├── tailwind.config.ts                   # design tokens from ui-context.md (colours, radius, spacing)
├── components.json                      # shadcn/ui CLI config (aliases, style, base colour)
└── src/app/globals.css (or index.css)   # Tailwind layers + CSS variables for tokens
```

```
frontend/public/
├── robots.txt                           # ← new: disallow /student /lecturer /admin /ai
└── sitemap.xml                          # ← new: generated at build time from routes/ constants
```

## Deployment

```
/
├── docker-compose.yml                   # react-app, spring-api, postgres-db, redis-cache, nginx-proxy
├── docker-compose.test.yml
├── backend/Dockerfile                   # multi-stage: maven build → eclipse-temurin:21-jre-alpine
├── frontend/Dockerfile                  # multi-stage: node:20-alpine build → nginx:1.25-alpine serve
└── nginx/
    ├── proxy.conf                       # nginx-proxy: TLS termination, / → react-app, /api → spring-api
    └── default.conf                     # react-app's internal nginx config
```

## Rule for agents

Before creating a new file, find the closest existing analog in this tree
and put the new file in the same package/folder. If nothing fits, propose
the new package/folder in the PR description rather than inventing one
silently — and update this file in the same PR.
