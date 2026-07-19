-- Performance summaries (computed & cached per student per semester)
CREATE TABLE performance_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    semester        SMALLINT NOT NULL,
    academic_year   VARCHAR(9) NOT NULL,
    gpa             NUMERIC(4,3) NOT NULL CHECK (gpa BETWEEN 0 AND 4),
    cgpa            NUMERIC(4,3) NOT NULL CHECK (cgpa BETWEEN 0 AND 4),
    rank            INTEGER NULL,
    cohort_size     INTEGER NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_perf_summary_student_semester UNIQUE (student_id, semester, academic_year)
);

CREATE TRIGGER trg_performance_summaries_updated_at
    BEFORE UPDATE ON performance_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
