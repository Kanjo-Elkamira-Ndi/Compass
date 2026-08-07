-- Lecturer availability for timetable generation
CREATE TABLE lecturer_availability (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lecturer_id UUID NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    slot        VARCHAR(20) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (lecturer_id, day_of_week, slot)
);

CREATE TRIGGER trg_lecturer_availability_updated_at
    BEFORE UPDATE ON lecturer_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
