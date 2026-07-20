-- =============================================================================
-- Compass Advisor — Full Schema Setup (DBeaver / raw SQL)
-- =============================================================================
-- Run this ONCE against a PostgreSQL 16 database with the pgvector extension.
-- For DBeaver: open this file, select the correct database in the connection
-- tree, then Execute SQL Script (Ctrl+Enter runs the whole file).
--
-- Prerequisites:
--   1. PostgreSQL 16 running locally (default port 5432)
--   2. pgvector extension installed:
--        CREATE EXTENSION IF NOT EXISTS vector;
--   3. A database named 'compass_ai'
--
-- After running, the Flyway migrations (V1-V11) in db/migration/ will
-- still work for Docker-based deployments — they're kept in sync.
-- =============================================================================

-- Clean slate — drop everything first (safe to run on empty DB)
DROP TABLE IF EXISTS career_recommendations CASCADE;
DROP TABLE IF EXISTS research_analyses CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS performance_summaries CASCADE;
DROP TABLE IF EXISTS grade_records CASCADE;
DROP TABLE IF EXISTS enrolments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS lecturers CASCADE;
DROP TABLE IF EXISTS revoked_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- =============================================================================
-- 1. Utility function
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. Core user tables (joined-table inheritance)
-- =============================================================================

-- Base users table (inheritance root)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(72) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'LECTURER', 'STUDENT')),
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Students (joined-table inheritance from users)
CREATE TABLE students (
    id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    student_id    VARCHAR(50) UNIQUE NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    programme     VARCHAR(100) NOT NULL,
    year_of_study SMALLINT NOT NULL CHECK (year_of_study BETWEEN 1 AND 5),
    skills        JSONB DEFAULT '[]'::jsonb
);

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Lecturers (joined-table inheritance from users)
CREATE TABLE lecturers (
    id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    staff_id       VARCHAR(50) UNIQUE NOT NULL,
    first_name     VARCHAR(100) NOT NULL,
    last_name      VARCHAR(100) NOT NULL,
    department     VARCHAR(100) NOT NULL,
    specialisation VARCHAR(200) NULL
);

CREATE TRIGGER trg_lecturers_updated_at
    BEFORE UPDATE ON lecturers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. Course & enrolment tables
-- =============================================================================

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) UNIQUE NOT NULL,
    title           VARCHAR(200) NOT NULL,
    credit_hours    SMALLINT NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
    programme       VARCHAR(100) NOT NULL,
    semester        SMALLINT NOT NULL CHECK (semester BETWEEN 1 AND 2),
    academic_year   VARCHAR(9) NOT NULL,
    lecturer_id     UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    timetable_slot  VARCHAR(50) NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE enrolments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    enrolment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ENROLLED' CHECK (status IN ('ENROLLED', 'DROPPED', 'COMPLETED')),
    final_grade     VARCHAR(5) NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_enrolment_student_course UNIQUE (student_id, course_id)
);

CREATE TRIGGER trg_enrolments_updated_at
    BEFORE UPDATE ON enrolments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. Academic performance tables
-- =============================================================================

CREATE TABLE grade_records (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    semester          SMALLINT NOT NULL,
    academic_year     VARCHAR(9) NOT NULL,
    attendance_pct    NUMERIC(5,2) CHECK (attendance_pct BETWEEN 0 AND 100),
    assignment_score  NUMERIC(5,2) CHECK (assignment_score BETWEEN 0 AND 100),
    project_score     NUMERIC(5,2) CHECK (project_score BETWEEN 0 AND 100),
    test_score        NUMERIC(5,2) CHECK (test_score BETWEEN 0 AND 100),
    exam_score        NUMERIC(5,2) CHECK (exam_score BETWEEN 0 AND 100),
    total_score       NUMERIC(5,2) GENERATED ALWAYS AS (
        COALESCE(attendance_pct, 0) * 0.10 +
        COALESCE(assignment_score, 0) * 0.20 +
        COALESCE(project_score, 0) * 0.20 +
        COALESCE(test_score, 0) * 0.20 +
        COALESCE(exam_score, 0) * 0.30
    ) STORED,
    grade_letter      VARCHAR(3) NULL,
    grade_points      NUMERIC(3,1) NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_grade_student_course_semester UNIQUE (student_id, course_id, semester, academic_year)
);

CREATE TRIGGER trg_grade_records_updated_at
    BEFORE UPDATE ON grade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE performance_summaries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    semester      SMALLINT NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    gpa           NUMERIC(4,3) NOT NULL CHECK (gpa BETWEEN 0 AND 4),
    cgpa          NUMERIC(4,3) NOT NULL CHECK (cgpa BETWEEN 0 AND 4),
    rank          INTEGER NULL,
    cohort_size   INTEGER NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_perf_summary_student_semester UNIQUE (student_id, semester, academic_year)
);

CREATE TRIGGER trg_performance_summaries_updated_at
    BEFORE UPDATE ON performance_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. AI module tables
-- =============================================================================

-- Risk assessments
CREATE TABLE risk_assessments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    assessed_by   UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    risk_score    NUMERIC(5,4) CHECK (risk_score BETWEEN 0 AND 1),
    risk_level    VARCHAR(20) NOT NULL CHECK (risk_level IN ('EXCELLENT', 'PASSING', 'AT_RISK', 'CRITICAL')),
    risk_factors  JSONB DEFAULT '[]'::jsonb,
    assessed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages (grouped by session_id)
CREATE TABLE chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages (session_id);

-- Exams
CREATE TABLE exams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    lecturer_id   UUID NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
    title         VARCHAR(200) NOT NULL,
    topic         VARCHAR(200) NULL,
    difficulty    VARCHAR(20) NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    status        VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Exam questions
CREATE TABLE exam_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id         UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_type   VARCHAR(20) NOT NULL CHECK (question_type IN ('MCQ', 'THEORY', 'PRACTICAL', 'CASE_STUDY')),
    question_text   TEXT NOT NULL,
    options         JSONB NULL,
    correct_answer  TEXT NULL,
    order_index     INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document chunks (pgvector RAG table)
-- NOTE: Requires the pgvector extension. Install it first:
--   Ubuntu/Debian: sudo apt install postgresql-16-pgvector
--   Or build from source: https://github.com/pgvector/pgvector
-- Then run: CREATE EXTENSION IF NOT EXISTS vector;
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE document_chunks (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_document VARCHAR(255) NOT NULL,
        page_number     SMALLINT NULL,
        content         TEXT NOT NULL,
        embedding       vector(1536) NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX idx_document_chunks_embedding
        ON document_chunks USING hnsw (embedding vector_cosine_ops);
    RAISE NOTICE 'pgvector extension enabled — document_chunks table created.';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector not available — skipping document_chunks table. Install pgvector and re-run to add it.';
END $$;

-- Research analyses
CREATE TABLE research_analyses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_name     VARCHAR(255) NOT NULL,
    file_size     BIGINT NULL,
    summary       TEXT NULL,
    key_findings  JSONB DEFAULT '[]'::jsonb,
    research_gaps JSONB DEFAULT '[]'::jsonb,
    future_work   JSONB DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Career recommendations
CREATE TABLE career_recommendations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    title             VARCHAR(200) NOT NULL,
    match_score       NUMERIC(5,2) NULL,
    demand_level      VARCHAR(20) NULL,
    rationale         TEXT NULL,
    skills_to_develop JSONB DEFAULT '[]'::jsonb,
    certifications    JSONB DEFAULT '[]'::jsonb,
    average_salary    VARCHAR(50) NULL,
    growth_rate       VARCHAR(50) NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. Security tables
-- =============================================================================

CREATE TABLE revoked_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_revoked_tokens_hash ON revoked_tokens (token_hash);
CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens (expires_at);

CREATE TABLE password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    token_hash  VARCHAR(64) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. Public website leads
-- =============================================================================

CREATE TABLE leads (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    role_interest VARCHAR(20) NULL CHECK (role_interest IN ('STUDENT', 'LECTURER', 'PARTNER')),
    message       TEXT NULL,
    source        VARCHAR(50) NOT NULL DEFAULT 'landing_page',
    status        VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'CONVERTED')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. Seed data
-- =============================================================================
-- NOTE: The password hash below is a placeholder. Use the /api/v1/auth/register
-- endpoint to create a real admin, or generate a proper BCrypt hash.
-- The register endpoint (Phase 2) will handle password hashing correctly.

INSERT INTO users (id, email, password_hash, role, status)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@compass.edu',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    'ACTIVE'
);
-- Password for the hash above: "password"
-- Generate your own with: python3 -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt(12)).decode())"

-- =============================================================================
-- Done. Verify with:
--   \dt          — should list 17 tables
--   SELECT * FROM users;
-- =============================================================================
