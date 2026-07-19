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
