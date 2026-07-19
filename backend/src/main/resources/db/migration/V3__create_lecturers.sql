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
