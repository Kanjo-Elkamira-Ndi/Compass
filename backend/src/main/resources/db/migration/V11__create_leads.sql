-- Leads (public website contact & newsletter — no FK to users)
CREATE TABLE leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    role_interest   VARCHAR(20) NULL CHECK (role_interest IN ('STUDENT', 'LECTURER', 'PARTNER')),
    message         TEXT NULL,
    source          VARCHAR(50) NOT NULL DEFAULT 'landing_page',
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'CONVERTED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
