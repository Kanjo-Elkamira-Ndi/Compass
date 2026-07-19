-- Courses
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
