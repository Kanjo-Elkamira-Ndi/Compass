# API Reference

All endpoints are RESTful under base path **`/api/v1`**. Bearer tokens go
in the `Authorization` header. List endpoints support
`?page=0&size=20&sort=field,asc`.

## Response envelope

```json
// Success
{ "success": true, "message": "string", "data": T, "timestamp": "ISO-8601" }

// Error
{ "success": false, "message": "string", "errorCode": "string", "timestamp": "ISO-8601" }
```

Entities are **never** returned directly — always via DTOs (see
`architecture.md` §Layered request flow).

## Authentication — `/auth/*`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | /auth/register | Register (email, password, role, name) | No | Public |
| POST | /auth/login | Authenticate; returns access token + sets refresh cookie | No | Public |
| POST | /auth/refresh | Issue new access token from refresh cookie | No (cookie) | Public |
| POST | /auth/logout | Revoke refresh token, clear cookie | Yes | All |
| POST | /auth/forgot-password | Send reset link | No | Public |
| POST | /auth/reset-password | Validate reset token, set new password | No | Public |

## Student management — `/students/*`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /students | List (paginated, filterable) | Yes | ADMIN/LECTURER |
| GET | /students/{id} | Get by ID | Yes | ADMIN/LECTURER/STUDENT(own) |
| POST | /students | Create | Yes | ADMIN |
| PUT | /students/{id} | Full update | Yes | ADMIN |

## Course management — `/courses/*`

Create, assign lecturer, enrol, drop — mirrors the module list in
`project-overview.md`. Auth required for all; write operations are
ADMIN/LECTURER, enrol/drop is STUDENT(own).

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /courses | List courses (paginated, filterable) | Yes | All |
| GET | /courses/{id} | Get course by ID | Yes | All |
| POST | /courses | Create course | Yes | ADMIN/LECTURER |
| PUT | /courses/{id} | Update course | Yes | ADMIN/LECTURER |
| POST | /courses/{courseId}/enrol | Enrol the calling student | Yes | STUDENT(own) |
| POST | /courses/{courseId}/drop | Drop the calling student | Yes | STUDENT(own) |
| GET | /courses/lecturer/{lecturerId} | Courses assigned to a lecturer (with enrolled counts) | Yes | ADMIN or LECTURER(own) |
| GET | /courses/{courseId}/students | Enrolled students (ENROLLED only, sorted by name) for a course | Yes | ADMIN or LECTURER teaching that course |

Roster endpoints enforce ownership in the controller: a LECTURER can only
fetch their own courses and students of courses they teach — a cross-course
request returns `403 ACCESS_DENIED`.

## Timetable & availability — `/timetable/*`

Timetable generation is a deterministic greedy scheduler: it clears all
existing `timetable_slot` values, then assigns only OPEN courses that have
a lecturer, respecting the lecturer's declared availability plus
lecturer-busy and cohort (programme+semester) conflicts per slot.

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /timetable | Full weekly timetable (students/admins). With `?lecturerId=`, returns only that lecturer's slots | Yes | STUDENT/ADMIN/LECTURER |
| GET | /timetable/availability/me | The current lecturer's declared availability | Yes | LECTURER |
| PUT | /timetable/availability/me | Replace the current lecturer's availability (full replace; day normalised to uppercase) | Yes | LECTURER |
| GET | /timetable/availability | All lecturers' availability grouped by lecturer | Yes | ADMIN |
| POST | /timetable/generate | Generate the timetable from assigned courses + availability; returns `{scheduled, skipped, generatedAt}` | Yes | ADMIN |

## Academic performance — `/performance/*`

GPA, CGPA, cohort ranking, performance trends. `/performance/ranking` is
`hasAnyRole('ADMIN','LECTURER')` — students cannot see cohort ranking
(see `security.md` §Filter Chain rule 7).

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | /performance/grades | Submit a grade record | Yes | ADMIN/LECTURER |
| GET | /performance/students/{studentId}/summary | GPA/CGPA summary | Yes | All (own/ADMIN/LECTURER) |
| GET | /performance/students/{studentId}/grades | Grade records | Yes | All (own/ADMIN/LECTURER) |
| GET | /performance/students/{studentId}/transcript-token | Issue a signed transcript verification token (embedded as a QR code in the downloadable transcript) | Yes | STUDENT(own)/ADMIN/LECTURER |
| GET | /performance/ranking | Cohort ranking | Yes | ADMIN/LECTURER |

The token is `base64url(payload) + "." + HMAC-SHA256(secret, payload)`.
`TranscriptTokenResponse` also returns the `data` block that the public
verify endpoint will reproduce, so the PDF is generated from
server-authoritative summary data. Students can only request their own
token — a cross-account attempt returns `403 ACCESS_DENIED`.

## Student complaint portal — `/complaints/*`

Students file complaints; lecturers and admins reply and drive the status
lifecycle. Attachments are stored on disk under `app.complaints.upload-dir`
(see `workflows.md`), and every event raises an in-app notification (see
`security.md` §Complaint module access rules).

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | /complaints | Create complaint — `multipart/form-data`: `subject`, `description`, `category`, `priority`, `anonymous`, `files[]` (max 5 files, 10MB each) | Yes | STUDENT |
| GET | /complaints | List (paginated; filters `search`, `status`, `category`, `priority`) | Yes | STUDENT(own)/LECTURER(assigned)/ADMIN |
| GET | /complaints/{id} | Get by ID (detail + replies, attachments, status history) | Yes | owner/assigned/ADMIN |
| POST | /complaints/{id}/replies | Add reply `{message}` | Yes | All (owner/assigned/ADMIN) |
| PATCH | /complaints/{id}/status | Update status `{status, resolution}` — `RESOLVED` requires `resolution` | Yes | ADMIN / LECTURER(assigned) |
| PUT | /complaints/{id}/assign | Assign a lecturer `{assignedTo}` (auto-transitions SUBMITTED→ASSIGNED) | Yes | ADMIN |
| POST | /complaints/{id}/suggest-reply | AI-drafted reply via `ComplaintSuggestionService` → `{suggestion}` | Yes | ADMIN / LECTURER(assigned) |
| GET | /complaints/{id}/attachments/{attachmentId} | Download attachment bytes | Yes | owner/assigned/ADMIN |
| GET | /lecturers | Lecturer summaries `{id, name, staffId, department}` — powers the assign dropdown | Yes | ADMIN |

**Status lifecycle** (enforced server-side via `ComplaintStatus.canTransitionTo`):
`SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`. Allowed edges:
SUBMITTED→{ASSIGNED, IN_PROGRESS}, ASSIGNED→{IN_PROGRESS},
IN_PROGRESS→{RESOLVED}, RESOLVED→{CLOSED}; CLOSED is terminal. Assigning a
SUBMITTED complaint auto-transitions it to ASSIGNED. Only an ADMIN or the
assigned lecturer may move a complaint — students cannot drive transitions
even on their own submission. Replies are rejected once a complaint is CLOSED.

## Notifications — `/notifications/*`

Strictly user-scoped — every endpoint reads/writes only the calling user's
rows (see `security.md` §Complaint module access rules).

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /notifications | List my notifications (paginated, newest first; `?unreadOnly=true`) | Yes | All |
| GET | /notifications/unread-count | `{count}` of unread notifications | Yes | All |
| PATCH | /notifications/{id}/read | Mark one notification as read | Yes | All (own) |
| PATCH | /notifications/read-all | Mark all notifications as read | Yes | All (own) |

## AI modules — `/ai/*`

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| POST | /ai/chat | Send message to chatbot (`{sessionId, message}`) | Yes | STUDENT |
| GET | /ai/chat/history/{sessionId} | Conversation history | Yes | STUDENT(own) |
| POST | /ai/risk-assessment/{studentId} | Trigger risk assessment | Yes | LECTURER/ADMIN |
| GET | /ai/risk-assessment/{studentId}/latest | Latest assessment | Yes | All (own/ADMIN/LECTURER) |
| POST | /ai/research-assistant | Upload PDF, get structured analysis (multipart) | Yes | STUDENT/LECTURER |
| GET | /ai/research-assistant/history | Past analyses for user | Yes | STUDENT/LECTURER(own) |
| POST | /ai/exam-generator | Generate exam questions (`{topic, difficulty, count, types}`) | Yes | LECTURER |
| POST | /ai/exams | Save finalised exam | Yes | LECTURER |
| GET | /ai/career-recommendations | Get/regenerate career recommendations | Yes | STUDENT(own) |
| GET | /ai/course-recommendations | Personalized course recommendations from the student's programme (open, not-yet-enrolled courses) ranked against a career goal (`?careerGoal=` optional; defaults to the student's top career recommendation) | Yes | STUDENT(own) |
| POST | /admin/rag/upload | Upload university PDF to RAG knowledge base; returns the created document record (`id, fileName, fileType, fileSize, chunkCount, uploadedBy, uploadedAt, status`) | Yes | ADMIN |
| GET | /admin/rag/documents | List every document currently in the RAG knowledge base, aggregated from `document_chunks` (`fileSize`/`uploadedBy` are only populated for documents uploaded via `/admin/rag/upload` in the current schema — pre-existing/seeded documents show `0`/`—`) | Yes | ADMIN |

## Public website endpoints — `/public/*`

See `architecture.md` §Public Website Architecture and `security.md`
§Public Endpoint Exposure for why these are deliberately narrow.

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /public/stats | Aggregate counters (active students, courses offered, AI queries answered) for the landing page "by the numbers" section — served from a Redis-cached summary, never queries per-user tables directly | No | Public |
| GET | /public/transcripts/verify | Verify a transcript authenticity token (`?token=...`). Stateless HMAC recomputation — never queries the DB. Always returns 200 with `{valid, reason, data}`; `reason` is `missing`/`malformed`/`tampered`/`expired` | No | Public |
| POST | /public/contact | Submit contact/enquiry form → writes to `leads`, triggers admin notification email | No | Public (rate-limited, 5 req/min/IP) |
| POST | /public/newsletter | Subscribe an email → writes to `leads` with `source='newsletter'` | No | Public (rate-limited, 5 req/min/IP) |

The landing page HTML/JS itself is static content served by `react-app` /
`nginx-proxy` — it is not a Spring endpoint.

## Standard error codes

| HTTP | errorCode | Scenario |
|---|---|---|
| 400 | VALIDATION_ERROR | Request body fails `@Valid` (field errors in `data` array) |
| 401 | INVALID_CREDENTIALS | Wrong email/password on login |
| 401 | TOKEN_EXPIRED | Access token expired; client must refresh |
| 403 | ACCESS_DENIED | Authenticated but insufficient role |
| 404 | STUDENT_NOT_FOUND / COURSE_NOT_FOUND / COMPLAINT_NOT_FOUND | Resource doesn't exist |
| 409 | ALREADY_ENROLLED / DUPLICATE_EMAIL / INVALID_STATUS_TRANSITION | Conflict with existing data |
| 413 | FILE_TOO_LARGE | PDF upload exceeds 20MB |
| 415 | UNSUPPORTED_MEDIA_TYPE | Non-PDF sent to research assistant |
| 422 | INSUFFICIENT_DATA | Missing grade components for risk/career assessment |
| 503 | AI_SERVICE_UNAVAILABLE | OpenAI/Gemini unreachable or timed out |

When adding a new endpoint: add it to this table in the same PR, pick the
narrowest role that makes sense, and reuse an existing `errorCode` before
inventing a new one.
