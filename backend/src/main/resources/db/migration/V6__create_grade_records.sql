-- Grade records (one per student per course per semester)
CREATE TABLE grade_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    semester            SMALLINT NOT NULL,
    academic_year       VARCHAR(9) NOT NULL,
    attendance_pct      NUMERIC(5,2) CHECK (attendance_pct BETWEEN 0 AND 100),
    assignment_score    NUMERIC(5,2) CHECK (assignment_score BETWEEN 0 AND 100),
    project_score       NUMERIC(5,2) CHECK (project_score BETWEEN 0 AND 100),
    test_score          NUMERIC(5,2) CHECK (test_score BETWEEN 0 AND 100),
    exam_score          NUMERIC(5,2) CHECK (exam_score BETWEEN 0 AND 100),
    total_score         NUMERIC(5,2) GENERATED ALWAYS AS (
        COALESCE(attendance_pct, 0) * 0.10 +
        COALESCE(assignment_score, 0) * 0.20 +
        COALESCE(project_score, 0) * 0.20 +
        COALESCE(test_score, 0) * 0.20 +
        COALESCE(exam_score, 0) * 0.30
    ) STORED,
    grade_letter        VARCHAR(3) NULL,
    grade_points        NUMERIC(3,1) NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_grade_student_course_semester UNIQUE (student_id, course_id, semester, academic_year)
);

CREATE TRIGGER trg_grade_records_updated_at
    BEFORE UPDATE ON grade_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
