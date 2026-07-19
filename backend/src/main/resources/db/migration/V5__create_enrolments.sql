-- Enrolments (M:N join between students and courses)
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
