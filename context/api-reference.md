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

Create, assign lecturer, enrol, drop, generate timetable — mirrors the
module list in `project-overview.md`. Auth required for all; write
operations are ADMIN/LECTURER, enrol/drop is STUDENT(own).

## Academic performance — `/performance/*`

GPA, CGPA, cohort ranking, performance trends. `/performance/ranking` is
`hasAnyRole('ADMIN','LECTURER')` — students cannot see cohort ranking
(see `security.md` §Filter Chain rule 7).

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
| POST | /admin/rag/upload | Upload university PDF to RAG knowledge base | Yes | ADMIN |

## Public website endpoints — `/public/*`

See `architecture.md` §Public Website Architecture and `security.md`
§Public Endpoint Exposure for why these are deliberately narrow.

| Method | Path | Description | Auth | Roles |
|---|---|---|---|---|
| GET | /public/stats | Aggregate counters (active students, courses offered, AI queries answered) for the landing page "by the numbers" section — served from a Redis-cached summary, never queries per-user tables directly | No | Public |
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
