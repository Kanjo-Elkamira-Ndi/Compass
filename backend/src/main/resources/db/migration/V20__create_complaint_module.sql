-- Complaint portal: complaints, replies, attachments, status history
CREATE TABLE complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id),
    subject         VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(30) NOT NULL CHECK (category IN ('ACADEMIC', 'ADMINISTRATIVE', 'EXAMINATION', 'FACILITY', 'FINANCIAL', 'HARASSMENT', 'OTHER')),
    priority        VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status          VARCHAR(15) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    is_anonymous    BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to     UUID NULL REFERENCES lecturers(id),
    resolution      TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaints_student ON complaints(student_id, created_at DESC);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_to, status);
CREATE INDEX idx_complaints_status ON complaints(status, created_at DESC);

CREATE TABLE complaint_replies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaint_replies_complaint ON complaint_replies(complaint_id, created_at ASC);

CREATE TABLE complaint_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    content_type    VARCHAR(100) NOT NULL,
    file_size       BIGINT NOT NULL,
    storage_key     VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaint_attachments_complaint ON complaint_attachments(complaint_id);

CREATE TABLE complaint_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    from_status     VARCHAR(15) NULL,
    to_status       VARCHAR(15) NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaint_history_complaint ON complaint_status_history(complaint_id, changed_at ASC);
