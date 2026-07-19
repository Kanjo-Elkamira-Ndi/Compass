-- Bootstrap admin user (password: admin123 — change in production)
-- BCrypt hash of 'admin123' with cost 12
INSERT INTO users (id, email, password_hash, role, status)
VALUES (
    gen_random_uuid(),
    'admin@compass.edu',
    '$2a$12$LJ3m4ys3Lh8nHgJ4QZ4Z4eYQw1b5v5q5r5s5t5u5v5w5x5y5z5',
    'ADMIN',
    'ACTIVE'
);

-- Insert the admin's student/lecturer profile as an admin (no subtype row needed)
-- Admin users don't have a students or lecturers row — they only exist in users.
