-- Persist AI-generated recommended actions alongside a risk assessment, instead of
-- deriving them client-side from risk factors.
ALTER TABLE risk_assessments
    ADD COLUMN recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- The V18 seed rows stored risk_factors as a plain array of strings
-- (e.g. '["Low attendance"]'), but RiskAssessment.riskFactors maps each
-- entry to a JSON object (name/value/weight/status/description). That shape
-- mismatch makes Hibernate's JsonType fail to deserialize the column, so
-- GET .../risk-assessment/{studentId}/latest 500s for every seeded student.
-- Backfill these five rows with the object shape the app actually reads,
-- plus matching recommended actions, so the demo data works out of the box.
UPDATE risk_assessments SET
    risk_factors = '[
        {"name": "GPA Trend", "value": 20, "weight": 40, "status": "danger", "description": "GPA has been declining over recent semesters."},
        {"name": "Attendance", "value": 30, "weight": 35, "status": "danger", "description": "Attendance is well below the recommended threshold."},
        {"name": "Assignment Submission Rate", "value": 35, "weight": 25, "status": "danger", "description": "A significant number of assignments have been missed or submitted late."}
    ]'::jsonb,
    recommended_actions = '[
        {"id": "seed-1209-0", "title": "Address: GPA Trend", "description": "GPA has been declining over recent semesters.", "priority": "high", "category": "GPA Trend"},
        {"id": "seed-1209-1", "title": "Address: Attendance", "description": "Attendance is well below the recommended threshold.", "priority": "high", "category": "Attendance"},
        {"id": "seed-1209-2", "title": "Address: Assignment Submission Rate", "description": "A significant number of assignments have been missed or submitted late.", "priority": "high", "category": "Assignment Submission Rate"}
    ]'::jsonb
WHERE student_id = '11111111-1111-1111-1111-111111111209' AND risk_level = 'CRITICAL';

UPDATE risk_assessments SET
    risk_factors = '[
        {"name": "Attendance", "value": 45, "weight": 55, "status": "warning", "description": "Attendance has dipped below the recommended threshold."},
        {"name": "Assignment Submission Rate", "value": 50, "weight": 45, "status": "warning", "description": "Several assignments have been submitted late this semester."}
    ]'::jsonb,
    recommended_actions = '[
        {"id": "seed-1210-0", "title": "Address: Attendance", "description": "Attendance has dipped below the recommended threshold.", "priority": "medium", "category": "Attendance"},
        {"id": "seed-1210-1", "title": "Address: Assignment Submission Rate", "description": "Several assignments have been submitted late this semester.", "priority": "medium", "category": "Assignment Submission Rate"}
    ]'::jsonb
WHERE student_id = '11111111-1111-1111-1111-111111111210' AND risk_level = 'AT_RISK';

UPDATE risk_assessments SET
    risk_factors = '[
        {"name": "GPA Trend", "value": 90, "weight": 60, "status": "good", "description": "GPA has been consistently strong across semesters."},
        {"name": "Attendance", "value": 95, "weight": 40, "status": "good", "description": "Attendance is consistently above the recommended threshold."}
    ]'::jsonb,
    recommended_actions = '[]'::jsonb
WHERE student_id = '11111111-1111-1111-1111-111111111201' AND risk_level = 'EXCELLENT';

UPDATE risk_assessments SET
    risk_factors = '[
        {"name": "GPA Trend", "value": 65, "weight": 100, "status": "warning", "description": "GPA has been stable but below the target range."}
    ]'::jsonb,
    recommended_actions = '[
        {"id": "seed-1203-0", "title": "Address: GPA Trend", "description": "GPA has been stable but below the target range.", "priority": "medium", "category": "GPA Trend"}
    ]'::jsonb
WHERE student_id = '11111111-1111-1111-1111-111111111203' AND risk_level = 'PASSING';

UPDATE risk_assessments SET
    risk_factors = '[
        {"name": "GPA Trend", "value": 60, "weight": 100, "status": "warning", "description": "GPA trend is moderate, with room for improvement."}
    ]'::jsonb,
    recommended_actions = '[
        {"id": "seed-1207-0", "title": "Address: GPA Trend", "description": "GPA trend is moderate, with room for improvement.", "priority": "medium", "category": "GPA Trend"}
    ]'::jsonb
WHERE student_id = '11111111-1111-1111-1111-111111111207' AND risk_level = 'PASSING';
