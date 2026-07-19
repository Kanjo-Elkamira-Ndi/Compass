-- Risk assessments
CREATE TABLE risk_assessments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    assessed_by     UUID REFERENCES lecturers(id) ON DELETE SET NULL,
    risk_score      NUMERIC(5,4) CHECK (risk_score BETWEEN 0 AND 1),
    risk_level      VARCHAR(20) NOT NULL CHECK (risk_level IN ('EXCELLENT', 'PASSING', 'AT_RISK', 'CRITICAL')),
    risk_factors    JSONB DEFAULT '[]'::jsonb,
    assessed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    lecturer_id     UUID NOT NULL REFERENCES lecturers(id) ON DELETE RESTRICT,
    title           VARCHAR(200) NOT NULL,
    topic           VARCHAR(200) NULL,
    difficulty      VARCHAR(20) NOT NULL CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_document   VARCHAR(255) NOT NULL,
    page_number       SMALLINT NULL,
    content           TEXT NOT NULL,
    embedding         vector(1536) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Research analyses
CREATE TABLE research_analyses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_name       VARCHAR(255) NOT NULL,
    file_size       BIGINT NULL,
    summary         TEXT NULL,
    key_findings    JSONB DEFAULT '[]'::jsonb,
    research_gaps   JSONB DEFAULT '[]'::jsonb,
    future_work     JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Career recommendations
CREATE TABLE career_recommendations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    title               VARCHAR(200) NOT NULL,
    match_score         NUMERIC(5,2) NULL,
    demand_level        VARCHAR(20) NULL,
    rationale           TEXT NULL,
    skills_to_develop   JSONB DEFAULT '[]'::jsonb,
    certifications      JSONB DEFAULT '[]'::jsonb,
    average_salary      VARCHAR(50) NULL,
    growth_rate         VARCHAR(50) NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
