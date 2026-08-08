-- Seed the demo accounts advertised on the login page and fix the admin hash.
-- All three demo accounts use the password: 'password' (dev/demo only).
-- BCrypt hash of 'password' with cost 12.
-- Idempotent: safe to re-run, works whether or not the accounts already exist.

-- 1. Fix the admin seeded by V10 (its placeholder hash never verified).
UPDATE users
SET password_hash = '$2a$12$Y7rcRDaV.w/mwONR4qGfQeririxRZPqrEpeJnSrn7s85UmeCbbUze',
    status        = 'ACTIVE'
WHERE email = 'admin@compass.edu';

-- 2. Demo student (Ada).
INSERT INTO users (id, email, password_hash, role, status)
SELECT gen_random_uuid(), 'ada@compass.edu',
       '$2a$12$Y7rcRDaV.w/mwONR4qGfQeririxRZPqrEpeJnSrn7s85UmeCbbUze',
       'STUDENT', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ada@compass.edu');

INSERT INTO students (id, student_id, first_name, last_name, programme, year_of_study)
SELECT u.id, 'YIBS-DEMO-001', 'Ada', 'Lovelace', 'BSc Computer Science', 3
FROM users u
WHERE u.email = 'ada@compass.edu'
  AND NOT EXISTS (SELECT 1 FROM students s WHERE s.id = u.id);

-- 3. Demo lecturer (Dr. Ngwa).
INSERT INTO users (id, email, password_hash, role, status)
SELECT gen_random_uuid(), 'dr.ngwa@compass.edu',
       '$2a$12$Y7rcRDaV.w/mwONR4qGfQeririxRZPqrEpeJnSrn7s85UmeCbbUze',
       'LECTURER', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dr.ngwa@compass.edu');

INSERT INTO lecturers (id, staff_id, first_name, last_name, department, specialisation)
SELECT u.id, 'YIBS-DEMO-L01', 'Paul', 'Ngwa', 'Computer Science', 'Software Engineering'
FROM users u
WHERE u.email = 'dr.ngwa@compass.edu'
  AND NOT EXISTS (SELECT 1 FROM lecturers l WHERE l.id = u.id);
