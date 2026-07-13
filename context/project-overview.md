# Project Overview

## What this is

**AI-Powered University Academic Advisor System** — an M.Tech Software
Engineering capstone project (Object-Oriented Programming in Java course)
at Yaoundé International Business School (YIBS), Cameroon.

Traditional Student Information Systems only store data. This project
turns one into an active advisor: it manages students, courses, and
grades in the usual way, then layers five AI-powered modules on top that
give students and lecturers guidance, not just records. It also ships a
public marketing website so the system is discoverable by prospective
users before they have an account.

## Problem statement

Universities manage thousands of students who constantly need guidance on:

- Course selection
- Graduation requirements
- Academic performance
- Career recommendations
- Research opportunities

## Actors

| Actor | Type | What they do |
|---|---|---|
| Student | Human, authenticated | Logs in, enrols in courses, queries the chatbot, views risk/career/research results |
| Lecturer | Human, authenticated | Manages grades, generates exams, uses the research assistant |
| Admin | Human, authenticated | Manages users and courses, uploads RAG knowledge-base documents |
| Website Visitor | Human, unauthenticated | Browses the public marketing site, then registers |
| OpenAI API | External system | Primary LLM provider (chatbot, research assistant, exam generator, career engine) |
| Gemini API | External system | Fallback LLM provider, swapped in via Spring AI config, no code change |
| Hugging Face | External system | Open-source models for specialised NLP tasks |

## Core modules

1. **Student Management** — CRUD, search, pagination.
2. **Course Management** — create/assign/enrol/drop, timetable generation.
3. **Academic Performance** — GPA, CGPA, class ranking, performance trends (Streams-heavy).
4. **AI Module 1 — Academic Chatbot** — students ask academic questions; answered via OpenAI/Gemini, optionally grounded by the RAG knowledge base.
5. **AI Module 2 — Student Risk Prediction** — classifies a student as Excellent / Passing / At-Risk / Critical from attendance, assignments, projects, tests, exams.
6. **AI Module 3 — Research Assistant** — student uploads a PDF; AI returns summary, key findings, research gaps, future work.
7. **AI Module 4 — Automatic Exam Generator** — lecturer specifies topic/difficulty/count; AI generates MCQ, theory, practical, and case-study questions.
8. **AI Module 5 — Career Recommendation Engine** — ranks career paths from the student's courses, projects, skills, and grades.
9. **Public Marketing Website** — unauthenticated landing page, feature/about/FAQ/contact pages, lead capture, and the on-ramp into registration. See `architecture.md` §Public Website Architecture and `ui-context.md` §Route Map.
10. **Bonus — RAG knowledge base** — university handbook, regulations, research policies, and course catalog are ingested so the chatbot can answer from official documents rather than general internet knowledge.

## Technology stack

| Layer | Choice |
|---|---|
| Frontend | React 18, shadcn/ui + Tailwind CSS, Axios, React Router 6 |
| Backend | Java 21, Spring Boot 3, Spring Security, Spring AI |
| Database | **PostgreSQL 16 + pgvector** (see note below) |
| AI services | OpenAI API (primary), Gemini API (fallback), Hugging Face (specialised NLP) |
| Cache | Redis 7 (revoked-token TTL cache, AI response cache, public-stats cache) |
| Deployment | Docker, GitHub Actions, AWS/Azure (EC2 + Nginx reverse proxy) |
| Testing | JUnit 5, Mockito, Newman/Postman for integration, JaCoCo coverage gate |

### Why PostgreSQL, not MySQL

The original course brief suggested MySQL. This project uses **PostgreSQL
16 with the pgvector extension** instead, because:

- **RAG needs vector similarity search.** pgvector lets embeddings live in
  the same database as the rest of the domain data (see
  `document_chunks` in `database-schema.md`) instead of standing up a
  separate vector store.
- **JSONB** covers the flexible fields the AI modules need (`skills` on
  `students`, `risk_factors` on `risk_assessments`) without extra tables.
- **UUID primary keys** via `gen_random_uuid()` are native, no extension
  juggling.

Never introduce MySQL-specific SQL, drivers, or Docker images into this
codebase.

## Where to go next

- Building backend features → `architecture.md`, `database-schema.md`,
  `api-reference.md`, `code-standards.md`.
- Building frontend features → `ui-context.md`, `code-standards.md`.
- Touching auth/security → `security.md`.
- Setting up locally, adding a migration, opening a PR → `workflows.md`.
- Not sure where a new file goes → `file-structure.md`.
