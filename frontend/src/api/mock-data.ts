import type {
  User, Role, Course, Enrollment, GradeRecord, GPATrend,
  RiskAssessment, RiskFactor, RecommendedAction, ChatSession,
  ChatMessage, ResearchUpload, ResearchResult, ExamQuestion,
  CareerRecommendation, AdminUser, RAGDocument,
  StudentDashboard, LecturerDashboard, AtRiskStudent,
  LecturerTimetable, ApiResponse, ContactFormData,
} from '@/types';

// ===================== Users =====================
export const mockUsers: User[] = [
  { id: 'u1', email: 'ada@compass.edu', name: 'Ada Okonkwo', role: 'STUDENT', programme: 'Computer Science', yearOfStudy: 3, skills: ['Python', 'React', 'SQL', 'Git'], createdAt: '2022-09-01' },
  { id: 'u2', email: 'bruno@compass.edu', name: 'Bruno Minkou', role: 'STUDENT', programme: 'Computer Science', yearOfStudy: 2, skills: ['Java', 'C++', 'Algorithms'], createdAt: '2023-09-01' },
  { id: 'u3', email: 'claire@compass.edu', name: 'Claire Ngo Mbe', role: 'STUDENT', programme: 'Data Science', yearOfStudy: 3, skills: ['Python', 'R', 'Tableau', 'Statistics'], createdAt: '2022-09-01' },
  { id: 'u4', email: 'david@compass.edu', name: 'David Tchinda', role: 'STUDENT', programme: 'Data Science', yearOfStudy: 2, skills: ['Python', 'Pandas', 'Excel'], createdAt: '2023-09-01' },
  { id: 'u5', email: 'esther@compass.edu', name: 'Esther Fomba', role: 'STUDENT', programme: 'Computer Science', yearOfStudy: 4, skills: ['JavaScript', 'Node.js', 'AWS', 'Docker'], createdAt: '2021-09-01' },
  { id: 'u6', email: 'fabrice@compass.edu', name: 'Fabrice Kamga', role: 'STUDENT', programme: 'Data Science', yearOfStudy: 1, skills: [], createdAt: '2024-09-01' },
  { id: 'l1', email: 'dr.ngwa@compass.edu', name: 'Dr. Ngwa Emmanuel', role: 'LECTURER', createdAt: '2020-01-15' },
  { id: 'l2', email: 'dr.ache@compass.edu', name: 'Dr. Ache Pamela', role: 'LECTURER', createdAt: '2019-08-01' },
  { id: 'a1', email: 'admin@compass.edu', name: 'System Admin', role: 'ADMIN', createdAt: '2020-01-01' },
];

// ===================== Courses =====================
export const mockCourses: Course[] = [
  { id: 'c1', code: 'CS301', name: 'Artificial Intelligence', description: 'Introduction to AI concepts, search algorithms, machine learning fundamentals, and neural networks.', credits: 4, lecturerId: 'l1', lecturerName: 'Dr. Ngwa Emmanuel', semester: '2024-2', programme: 'Computer Science', enrolledCount: 45, maxCapacity: 60 },
  { id: 'c2', code: 'CS302', name: 'Database Systems', description: 'Relational database design, SQL, normalization, transactions, and NoSQL alternatives.', credits: 3, lecturerId: 'l1', lecturerName: 'Dr. Ngwa Emmanuel', semester: '2024-2', programme: 'Computer Science', enrolledCount: 52, maxCapacity: 60 },
  { id: 'c3', code: 'CS201', name: 'Data Structures & Algorithms', description: 'Fundamental data structures, algorithm design paradigms, and complexity analysis.', credits: 4, lecturerId: 'l2', lecturerName: 'Dr. Ache Pamela', semester: '2024-2', programme: 'Computer Science', enrolledCount: 58, maxCapacity: 60 },
  { id: 'c4', code: 'DS301', name: 'Statistical Learning', description: 'Statistical methods for machine learning, regression, classification, and model evaluation.', credits: 3, lecturerId: 'l2', lecturerName: 'Dr. Ache Pamela', semester: '2024-2', programme: 'Data Science', enrolledCount: 38, maxCapacity: 45 },
  { id: 'c5', code: 'DS302', name: 'Data Visualization', description: 'Principles and tools for effective data visualization, storytelling with data.', credits: 3, lecturerId: 'l1', lecturerName: 'Dr. Ngwa Emmanuel', semester: '2024-2', programme: 'Data Science', enrolledCount: 35, maxCapacity: 45 },
  { id: 'c6', code: 'CS401', name: 'Software Engineering', description: 'Software development lifecycle, design patterns, testing, DevOps practices.', credits: 3, lecturerId: 'l2', lecturerName: 'Dr. Ache Pamela', semester: '2024-2', programme: 'Computer Science', enrolledCount: 40, maxCapacity: 50 },
  { id: 'c7', code: 'CS101', name: 'Introduction to Programming', description: 'Fundamental programming concepts using Python for beginners.', credits: 3, lecturerId: 'l1', lecturerName: 'Dr. Ngwa Emmanuel', semester: '2024-2', programme: 'Computer Science', enrolledCount: 60, maxCapacity: 60 },
  { id: 'c8', code: 'DS201', name: 'Probability & Statistics', description: 'Probability theory, distributions, hypothesis testing, and Bayesian inference.', credits: 4, lecturerId: 'l2', lecturerName: 'Dr. Ache Pamela', semester: '2024-2', programme: 'Data Science', enrolledCount: 42, maxCapacity: 45 },
  { id: 'c9', code: 'CS303', name: 'Computer Networks', description: 'Network architectures, protocols, TCP/IP, security fundamentals.', credits: 3, lecturerId: 'l1', lecturerName: 'Dr. Ngwa Emmanuel', semester: '2024-1', programme: 'Computer Science', enrolledCount: 48, maxCapacity: 55 },
  { id: 'c10', code: 'DS101', name: 'Foundations of Data Science', description: 'Introduction to data science workflows, tools, and analytical thinking.', credits: 3, lecturerId: 'l2', lecturerName: 'Dr. Ache Pamela', semester: '2024-1', programme: 'Data Science', enrolledCount: 44, maxCapacity: 50 },
];

// ===================== Enrollments =====================
export const mockEnrollments: Enrollment[] = [
  { id: 'e1', courseId: 'c1', course: mockCourses[0], studentId: 'u1', enrolledAt: '2024-09-01', grade: 'A', gpaPoints: 4.0 },
  { id: 'e2', courseId: 'c2', course: mockCourses[1], studentId: 'u1', enrolledAt: '2024-09-01', grade: 'B+', gpaPoints: 3.5 },
  { id: 'e3', courseId: 'c3', course: mockCourses[2], studentId: 'u1', enrolledAt: '2024-09-01' },
  { id: 'e4', courseId: 'c4', course: mockCourses[3], studentId: 'u3', enrolledAt: '2024-09-01', grade: 'A-', gpaPoints: 3.7 },
  { id: 'e5', courseId: 'c5', course: mockCourses[4], studentId: 'u3', enrolledAt: '2024-09-01', grade: 'B', gpaPoints: 3.0 },
  { id: 'e6', courseId: 'c6', course: mockCourses[5], studentId: 'u5', enrolledAt: '2024-09-01', grade: 'A', gpaPoints: 4.0 },
  { id: 'e7', courseId: 'c1', course: mockCourses[0], studentId: 'u2', enrolledAt: '2024-09-01' },
  { id: 'e8', courseId: 'c7', course: mockCourses[6], studentId: 'u6', enrolledAt: '2024-09-01' },
  { id: 'e9', courseId: 'c8', course: mockCourses[7], studentId: 'u4', enrolledAt: '2024-09-01', grade: 'C+', gpaPoints: 2.3 },
  { id: 'e10', courseId: 'c4', course: mockCourses[3], studentId: 'u4', enrolledAt: '2024-09-01', grade: 'B-', gpaPoints: 2.7 },
];

// ===================== Grade Records =====================
export const mockGrades: GradeRecord[] = [
  // Ada Okonkwo - improving trend
  { id: 'g1', courseId: 'c1', courseCode: 'CS301', courseName: 'Artificial Intelligence', semester: '2024-2', grade: 'A', gpaPoints: 4.0, credits: 4 },
  { id: 'g2', courseId: 'c2', courseCode: 'CS302', courseName: 'Database Systems', semester: '2024-2', grade: 'B+', gpaPoints: 3.5, credits: 3 },
  { id: 'g3', courseId: 'c9', courseCode: 'CS303', courseName: 'Computer Networks', semester: '2024-1', grade: 'A-', gpaPoints: 3.7, credits: 3 },
  { id: 'g4', courseId: 'c6', courseCode: 'CS401', courseName: 'Software Engineering', semester: '2024-1', grade: 'B+', gpaPoints: 3.5, credits: 3 },
  { id: 'g5', courseId: 'c1', courseCode: 'CS301', courseName: 'Artificial Intelligence', semester: '2023-2', grade: 'B', gpaPoints: 3.0, credits: 4 },
  { id: 'g6', courseId: 'c2', courseCode: 'CS302', courseName: 'Database Systems', semester: '2023-2', grade: 'B-', gpaPoints: 2.7, credits: 3 },
  { id: 'g7', courseId: 'c3', courseCode: 'CS201', courseName: 'Data Structures & Algorithms', semester: '2023-1', grade: 'C+', gpaPoints: 2.3, credits: 4 },
  { id: 'g8', courseId: 'c7', courseCode: 'CS101', courseName: 'Introduction to Programming', semester: '2022-2', grade: 'B', gpaPoints: 3.0, credits: 3 },
  { id: 'g9', courseId: 'c10', courseCode: 'DS101', courseName: 'Foundations of Data Science', semester: '2022-2', grade: 'C', gpaPoints: 2.0, credits: 3 },
  // Bruno Minkou - declining trend
  { id: 'g10', courseId: 'c1', courseCode: 'CS301', courseName: 'Artificial Intelligence', semester: '2024-2', grade: 'C', gpaPoints: 2.0, credits: 4 },
  { id: 'g11', courseId: 'c3', courseCode: 'CS201', courseName: 'Data Structures & Algorithms', semester: '2024-2', grade: 'C-', gpaPoints: 1.7, credits: 4 },
  { id: 'g12', courseId: 'c7', courseCode: 'CS101', courseName: 'Introduction to Programming', semester: '2024-1', grade: 'B-', gpaPoints: 2.7, credits: 3 },
  { id: 'g13', courseId: 'c2', courseCode: 'CS302', courseName: 'Database Systems', semester: '2024-1', grade: 'B', gpaPoints: 3.0, credits: 3 },
  { id: 'g14', courseId: 'c10', courseCode: 'DS101', courseName: 'Foundations of Data Science', semester: '2023-2', grade: 'A-', gpaPoints: 3.7, credits: 3 },
  { id: 'g15', courseId: 'c8', courseCode: 'DS201', courseName: 'Probability & Statistics', semester: '2023-2', grade: 'B+', gpaPoints: 3.5, credits: 4 },
  // Claire Ngo Mbe - stable excellent
  { id: 'g16', courseId: 'c4', courseCode: 'DS301', courseName: 'Statistical Learning', semester: '2024-2', grade: 'A-', gpaPoints: 3.7, credits: 3 },
  { id: 'g17', courseId: 'c5', courseCode: 'DS302', courseName: 'Data Visualization', semester: '2024-2', grade: 'B', gpaPoints: 3.0, credits: 3 },
  { id: 'g18', courseId: 'c8', courseCode: 'DS201', courseName: 'Probability & Statistics', semester: '2024-1', grade: 'A', gpaPoints: 4.0, credits: 4 },
  { id: 'g19', courseId: 'c4', courseCode: 'DS301', courseName: 'Statistical Learning', semester: '2024-1', grade: 'A', gpaPoints: 4.0, credits: 3 },
  { id: 'g20', courseId: 'c10', courseCode: 'DS101', courseName: 'Foundations of Data Science', semester: '2023-2', grade: 'A', gpaPoints: 4.0, credits: 3 },
  // David Tchinda - at-risk
  { id: 'g21', courseId: 'c8', courseCode: 'DS201', courseName: 'Probability & Statistics', semester: '2024-2', grade: 'C+', gpaPoints: 2.3, credits: 4 },
  { id: 'g22', courseId: 'c4', courseCode: 'DS301', courseName: 'Statistical Learning', semester: '2024-2', grade: 'B-', gpaPoints: 2.7, credits: 3 },
  { id: 'g23', courseId: 'c10', courseCode: 'DS101', courseName: 'Foundations of Data Science', semester: '2024-1', grade: 'D+', gpaPoints: 1.3, credits: 3 },
  { id: 'g24', courseId: 'c5', courseCode: 'DS302', courseName: 'Data Visualization', semester: '2024-1', grade: 'C-', gpaPoints: 1.7, credits: 3 },
  { id: 'g25', courseId: 'c8', courseCode: 'DS201', courseName: 'Probability & Statistics', semester: '2023-2', grade: 'C', gpaPoints: 2.0, credits: 4 },
  // Esther Fomba - excellent
  { id: 'g26', courseId: 'c6', courseCode: 'CS401', courseName: 'Software Engineering', semester: '2024-2', grade: 'A', gpaPoints: 4.0, credits: 3 },
  { id: 'g27', courseId: 'c9', courseCode: 'CS303', courseName: 'Computer Networks', semester: '2024-1', grade: 'A+', gpaPoints: 4.0, credits: 3 },
  { id: 'g28', courseId: 'c3', courseCode: 'CS201', courseName: 'Data Structures & Algorithms', semester: '2024-1', grade: 'A', gpaPoints: 4.0, credits: 4 },
  // Fabrice Kamga - new student, limited data
  { id: 'g29', courseId: 'c7', courseCode: 'CS101', courseName: 'Introduction to Programming', semester: '2024-2', grade: 'B', gpaPoints: 3.0, credits: 3 },
];

// ===================== GPA Trends =====================
export const mockGPATrends: Record<string, GPATrend[]> = {
  u1: [ // Ada - improving
    { semester: '2022-2', gpa: 2.50, cumulativeGpa: 2.50 },
    { semester: '2023-1', gpa: 2.30, cumulativeGpa: 2.40 },
    { semester: '2023-2', gpa: 2.85, cumulativeGpa: 2.55 },
    { semester: '2024-1', gpa: 3.60, cumulativeGpa: 2.85 },
    { semester: '2024-2', gpa: 3.79, cumulativeGpa: 3.10 },
  ],
  u2: [ // Bruno - declining
    { semester: '2023-2', gpa: 3.60, cumulativeGpa: 3.60 },
    { semester: '2024-1', gpa: 2.85, cumulativeGpa: 3.30 },
    { semester: '2024-2', gpa: 1.86, cumulativeGpa: 2.85 },
  ],
  u3: [ // Claire - excellent
    { semester: '2023-2', gpa: 4.00, cumulativeGpa: 4.00 },
    { semester: '2024-1', gpa: 4.00, cumulativeGpa: 4.00 },
    { semester: '2024-2', gpa: 3.35, cumulativeGpa: 3.85 },
  ],
  u4: [ // David - at-risk
    { semester: '2023-2', gpa: 2.00, cumulativeGpa: 2.00 },
    { semester: '2024-1', gpa: 1.50, cumulativeGpa: 1.80 },
    { semester: '2024-2', gpa: 2.50, cumulativeGpa: 2.00 },
  ],
  u5: [ // Esther - excellent
    { semester: '2024-1', gpa: 4.00, cumulativeGpa: 4.00 },
    { semester: '2024-2', gpa: 4.00, cumulativeGpa: 4.00 },
  ],
  u6: [ // Fabrice - new
    { semester: '2024-2', gpa: 3.00, cumulativeGpa: 3.00 },
  ],
};

// ===================== Risk Assessments =====================
const makeFactors = (overrides: Partial<RiskFactor>[] = []): RiskFactor[] => [
  { name: 'GPA Trend', value: 75, weight: 0.3, status: 'good', description: 'Your GPA has been steadily improving over the past 3 semesters.' },
  { name: 'Course Completion Rate', value: 90, weight: 0.25, status: 'good', description: 'You have completed 90% of enrolled courses successfully.' },
  { name: 'Attendance', value: 85, weight: 0.2, status: 'good', description: 'Your attendance rate is above the recommended threshold.' },
  { name: 'Assignment Submission', value: 95, weight: 0.15, status: 'good', description: 'Nearly all assignments submitted on time.' },
  { name: 'Engagement Score', value: 70, weight: 0.1, status: 'good', description: 'Moderate participation in class and online forums.' },
  ...overrides,
];

export const mockRiskAssessments: Record<string, RiskAssessment> = {
  u1: {
    studentId: 'u1', level: 'Passing', score: 72,
    factors: makeFactors([
      { name: 'GPA Trend', value: 65, weight: 0.3, status: 'warning', description: 'GPA is improving but still below programme average of 3.2.' },
    ]),
    recommendedActions: [
      { id: 'ra1', title: 'Increase Study Hours', description: 'Allocate an additional 5 hours per week for CS201 (Data Structures).', priority: 'medium', category: 'Academic' },
      { id: 'ra2', title: 'Join Study Group', description: 'Join the weekly CS study group held every Wednesday at 5 PM.', priority: 'low', category: 'Social' },
    ],
    lastUpdated: '2025-01-15',
  },
  u2: {
    studentId: 'u2', level: 'Critical', score: 28,
    factors: makeFactors([
      { name: 'GPA Trend', value: 20, weight: 0.3, status: 'danger', description: 'GPA has declined sharply from 3.6 to 1.86 over 3 semesters.' },
      { name: 'Course Completion Rate', value: 50, weight: 0.25, status: 'danger', description: 'At risk of failing 2 out of 4 current courses.' },
      { name: 'Attendance', value: 55, weight: 0.2, status: 'danger', description: 'Attendance has dropped below 60% — immediate action required.' },
      { name: 'Assignment Submission', value: 40, weight: 0.15, status: 'danger', description: 'Multiple missed assignments in CS301 and CS201.' },
      { name: 'Engagement Score', value: 25, weight: 0.1, status: 'danger', description: 'Very low participation detected across all metrics.' },
    ]),
    recommendedActions: [
      { id: 'ra3', title: 'Schedule Counselling Session', description: 'Book an appointment with the academic counsellor within this week.', priority: 'high', category: 'Support' },
      { id: 'ra4', title: 'Attend Remedial Classes', description: 'Enrol in the CS301 remedial track starting next Monday.', priority: 'high', category: 'Academic' },
      { id: 'ra5', title: 'Meet with Lecturers', description: 'Schedule office hours meetings with Dr. Ngwa and Dr. Ache.', priority: 'high', category: 'Academic' },
    ],
    lastUpdated: '2025-01-15',
  },
  u3: {
    studentId: 'u3', level: 'Excellent', score: 94,
    factors: makeFactors([
      { name: 'GPA Trend', value: 95, weight: 0.3, status: 'good', description: 'Consistently high GPA across all semesters.' },
      { name: 'Course Completion Rate', value: 100, weight: 0.25, status: 'good', description: 'All courses completed with grades B or above.' },
    ]),
    recommendedActions: [
      { id: 'ra6', title: 'Consider Research Assistant Role', description: 'Your strong academic record makes you a great candidate for a research assistantship.', priority: 'low', category: 'Opportunity' },
    ],
    lastUpdated: '2025-01-15',
  },
  u4: {
    studentId: 'u4', level: 'At-Risk', score: 45,
    factors: makeFactors([
      { name: 'GPA Trend', value: 35, weight: 0.3, status: 'danger', description: 'GPA is below 2.0 and has been declining.' },
      { name: 'Course Completion Rate', value: 60, weight: 0.25, status: 'warning', description: 'One failed course last semester.' },
      { name: 'Attendance', value: 65, weight: 0.2, status: 'warning', description: 'Attendance is borderline — needs improvement.' },
    ]),
    recommendedActions: [
      { id: 'ra7', title: 'Improve Attendance', description: 'Focus on attending all DS201 lectures. Your grade correlates strongly with attendance.', priority: 'high', category: 'Academic' },
      { id: 'ra8', title: 'Submit Missing Work', description: 'Submit the 2 outstanding DS201 assignments for partial credit.', priority: 'medium', category: 'Academic' },
    ],
    lastUpdated: '2025-01-15',
  },
  u5: {
    studentId: 'u5', level: 'Excellent', score: 97,
    factors: makeFactors([
      { name: 'GPA Trend', value: 98, weight: 0.3, status: 'good', description: 'Perfect GPA of 4.0 maintained across all semesters.' },
    ]),
    recommendedActions: [
      { id: 'ra9', title: 'Apply for Internship', description: 'Your profile is strong — consider applying for competitive internships.', priority: 'medium', category: 'Career' },
    ],
    lastUpdated: '2025-01-15',
  },
  u6: {
    studentId: 'u6', level: 'Passing', score: 68,
    factors: makeFactors([
      { name: 'GPA Trend', value: 70, weight: 0.3, status: 'warning', description: 'First semester — limited data. Current GPA is 3.0.' },
    ]),
    recommendedActions: [
      { id: 'ra10', title: 'Build Strong Foundation', description: 'Focus on core programming skills in your first year.', priority: 'medium', category: 'Academic' },
    ],
    lastUpdated: '2025-01-15',
  },
};

// ===================== Chat =====================
export const mockChatSessions: ChatSession[] = [
  { id: 'cs1', title: 'GPA Improvement Strategies', createdAt: '2025-01-10T10:00:00Z', lastMessageAt: '2025-01-15T14:30:00Z', messageCount: 8 },
  { id: 'cs2', title: 'Course Selection for Next Semester', createdAt: '2025-01-12T09:00:00Z', lastMessageAt: '2025-01-14T16:00:00Z', messageCount: 5 },
  { id: 'cs3', title: 'Understanding Risk Assessment', createdAt: '2025-01-14T11:00:00Z', lastMessageAt: '2025-01-15T09:00:00Z', messageCount: 3 },
];

export const mockChatMessages: Record<string, ChatMessage[]> = {
  cs1: [
    { id: 'm1', sessionId: 'cs1', role: 'user', content: 'My GPA dropped this semester. What can I do to improve it?', createdAt: '2025-01-10T10:00:00Z' },
    { id: 'm2', sessionId: 'cs1', role: 'assistant', content: 'I can see your GPA declined from 2.85 to the current level. Based on your academic history, here are my recommendations:\n\n1. **Prioritize CS201 (Data Structures)** — this is your weakest subject and carries 4 credits. Consider forming a study group.\n2. **Consistent assignment submission** — you missed 2 CS301 assignments last month.\n3. **Office hours** — Dr. Ngwa holds office hours Tuesdays 2-4 PM.\n\nYour upward trajectory from semesters 2022-2 to 2024-1 shows you have the capability to recover.', sources: [{ title: 'Academic Performance Report', documentName: 'Student_Handbook_v3.pdf', relevance: 0.92 }], createdAt: '2025-01-10T10:01:00Z' },
    { id: 'm3', sessionId: 'cs1', role: 'user', content: 'Should I drop CS201 if I think I will fail?', createdAt: '2025-01-11T09:00:00Z' },
    { id: 'm4', sessionId: 'cs1', role: 'assistant', content: 'Before considering dropping, let me check the withdrawal deadline and implications:\n\n- **Withdrawal deadline**: February 28, 2025\n- **Impact**: A "W" on your transcript is generally better than an "F", but it still affects your completion rate.\n- **Alternative**: Based on your current standing (you\'re passing all other courses), I\'d recommend trying to improve first. Consider the remedial support options available.\n\nIf you\'d like, I can connect you with a peer tutor for CS201.', sources: [{ title: 'Academic Calendar 2024-2025', documentName: 'Academic_Calendar.pdf', relevance: 0.88 }], createdAt: '2025-01-11T09:02:00Z' },
  ],
  cs2: [
    { id: 'm5', sessionId: 'cs2', role: 'user', content: 'What courses should I take next semester as a CS major in my 4th year?', createdAt: '2025-01-12T09:00:00Z' },
    { id: 'm6', sessionId: 'cs2', role: 'assistant', content: 'Based on your completed coursework and remaining degree requirements, here are my recommendations for 2025-1:\n\n**Required (remaining):**\n- CS402: Operating Systems (4 credits)\n- CS403: Capstone Project (6 credits)\n\n**Electives I recommend:**\n- CS410: Machine Learning (matches your AI interest from CS301)\n- CS415: Cloud Computing (aligns with your AWS/Docker skills)\n\nThis gives you 16 credits, which is a manageable load.', sources: [{ title: 'CS Programme Curriculum Guide', documentName: 'CS_Curriculum_2024.pdf', relevance: 0.95 }], createdAt: '2025-01-12T09:01:00Z' },
  ],
  cs3: [
    { id: 'm7', sessionId: 'cs3', role: 'user', content: 'What does my risk assessment mean?', createdAt: '2025-01-14T11:00:00Z' },
    { id: 'm8', sessionId: 'cs3', role: 'assistant', content: 'Your risk assessment evaluates your academic standing across multiple factors:\n\n- **GPA Trend** (30% weight): How your GPA is changing over time\n- **Course Completion Rate** (25%): Percentage of courses passed\n- **Attendance** (20%): Your lecture attendance rate\n- **Assignment Submission** (15%): Timeliness of assignments\n- **Engagement Score** (10%): Participation in academic activities\n\nYour current level is **Passing** with a score of 72/100. The primary area for improvement is your GPA trend, which is still below the programme average.', sources: [{ title: 'Risk Assessment Methodology', documentName: 'Compass_AI_Documentation.pdf', relevance: 0.97 }], createdAt: '2025-01-14T11:01:00Z' },
  ],
};

// ===================== Research Uploads =====================
export const mockResearchUploads: ResearchUpload[] = [
  {
    id: 'ru1', fileName: 'transformer_architecture_survey.pdf', fileSize: 2400000,
    status: 'completed', progress: 100, uploadedAt: '2025-01-10T08:00:00Z',
    result: {
      summary: 'This paper provides a comprehensive survey of transformer architectures, covering the original Attention Is All You Need paper through modern variants like GPT, BERT, and Vision Transformers. It analyzes architectural modifications, efficiency improvements, and application domains.',
      keyFindings: ['Self-attention mechanism enables parallel processing of sequences', 'Pre-training + fine-tuning paradigm has become standard', 'Efficient variants (Linformer, Performer) reduce quadratic complexity', 'Multi-modal transformers unify vision, language, and audio processing'],
      researchGaps: ['Scalability to million-token contexts remains challenging', 'Energy efficiency of large transformer models is underexplored', 'Theoretical understanding of attention patterns is limited'],
      futureWork: ['Developing sub-quadratic attention mechanisms', 'Investigating sparse mixture-of-experts at scale', 'Combining symbolic AI with neural transformers'],
      methodology: 'Systematic literature review covering 150+ papers from 2017-2024, categorized by architectural variants, training strategies, and application domains.',
    },
  },
  {
    id: 'ru2', fileName: 'federated_learning_privacy.pdf', fileSize: 1800000,
    status: 'completed', progress: 100, uploadedAt: '2025-01-12T14:00:00Z',
    result: {
      summary: 'This paper examines federated learning as a privacy-preserving machine learning paradigm. It covers threat models, defense mechanisms, and compares differential privacy, secure aggregation, and trusted execution environments.',
      keyFindings: ['Gradient inversion attacks can reconstruct training data from model updates', 'Differential privacy with ε < 10 provides strong privacy guarantees', 'Communication efficiency improved by 10x with gradient compression', 'Cross-silo federated learning shows promise in healthcare applications'],
      researchGaps: ['Fairness in federated settings is poorly understood', 'Heterogeneous data distribution effects need more study', 'Regulatory compliance frameworks are underdeveloped'],
      futureWork: ['Developing fairness-aware aggregation algorithms', 'Standardizing benchmark datasets for federated evaluation', 'Exploring blockchain for decentralized model governance'],
      methodology: 'Empirical evaluation across 5 datasets with 3 threat models, supplemented by theoretical analysis of privacy bounds.',
    },
  },
];

// ===================== Exam Questions =====================
export const mockExamQuestions: ExamQuestion[] = [
  { id: 'eq1', type: 'mcq', difficulty: 'medium', question: 'Which of the following best describes the backpropagation algorithm?', points: 5, options: [{ label: 'A', text: 'A forward-only computation graph' }, { label: 'B', text: 'Gradient computation using the chain rule through a computational graph' }, { label: 'C', text: 'A random weight initialization technique' }, { label: 'D', text: 'A data augmentation strategy' }], answer: 'B', explanation: 'Backpropagation computes gradients of the loss function with respect to network weights by applying the chain rule recursively from the output layer to the input layer.', order: 1 },
  { id: 'eq2', type: 'mcq', difficulty: 'easy', question: 'What is the primary purpose of an activation function in a neural network?', points: 3, options: [{ label: 'A', text: 'To speed up training' }, { label: 'B', text: 'To introduce non-linearity into the model' }, { label: 'C', text: 'To reduce the number of parameters' }, { label: 'D', text: 'To normalize input data' }], answer: 'B', explanation: 'Activation functions introduce non-linear transformations, enabling neural networks to learn complex patterns that linear models cannot capture.', order: 2 },
  { id: 'eq3', type: 'short-answer', difficulty: 'medium', question: 'Explain the difference between L1 and L2 regularization and when you would use each.', points: 8, answer: 'L1 regularization (Lasso) adds the absolute value of weights as penalty, promoting sparsity. L2 regularization (Ridge) adds the squared magnitude, distributing penalty across all weights. Use L1 when feature selection is important, L2 when you want to keep all features but prevent overfitting.', explanation: 'Both techniques prevent overfitting but have different effects on the weight distribution.', order: 3 },
  { id: 'eq4', type: 'true-false', difficulty: 'easy', question: 'Dropout is applied during both training and inference.', points: 2, answer: 'False', explanation: 'Dropout is only applied during training. During inference, all neurons are active but their outputs are scaled by the dropout probability.', order: 4 },
  { id: 'eq5', type: 'essay', difficulty: 'hard', question: 'Critically evaluate the trade-offs between batch normalization and layer normalization in transformer architectures. Consider training stability, sequence length handling, and computational overhead.', points: 15, answer: 'Batch normalization normalizes across the batch dimension and works well with CNNs but struggles with variable-length sequences. Layer normalization normalizes across the feature dimension, making it more suitable for RNNs and transformers where sequences have different lengths. Pre-LN (pre-normalization) has become standard in transformers for improved training stability.', explanation: 'Full marks should demonstrate understanding of normalization statistics, their impact on gradient flow, and practical implications for different architectures.', order: 5 },
  { id: 'eq6', type: 'mcq', difficulty: 'hard', question: 'In a transformer model, what is the computational complexity of the self-attention mechanism with respect to sequence length n?', points: 5, options: [{ label: 'A', text: 'O(n)' }, { label: 'B', text: 'O(n log n)' }, { label: 'C', text: 'O(n²)' }, { label: 'D', text: 'O(n³)' }], answer: 'C', explanation: 'Standard self-attention computes an n×n attention matrix, resulting in O(n²) complexity with respect to sequence length.', order: 6 },
];

// ===================== Career Recommendations =====================
export const mockCareerRecommendations: CareerRecommendation[] = [
  {
    id: 'cr1', title: 'Machine Learning Engineer', matchScore: 92, demandLevel: 'High',
    rationale: 'Your strong performance in CS301 (AI), combined with Python and SQL skills, makes you an excellent candidate for ML engineering roles. The growing demand for AI solutions across industries aligns perfectly with your academic trajectory.',
    skillsToDevelop: ['PyTorch/TensorFlow', 'MLOps', 'Cloud ML Services', 'Data Pipeline Design'],
    certifications: ['AWS Machine Learning Specialty', 'Google Professional ML Engineer', 'TensorFlow Developer Certificate'],
    averageSalary: '$95,000 - $140,000', growthRate: '35% annually',
  },
  {
    id: 'cr2', title: 'Data Scientist', matchScore: 87, demandLevel: 'High',
    rationale: 'Your analytical skills demonstrated through DS301 and DS302, combined with strong programming abilities, position you well for data science roles. Companies increasingly need professionals who can both code and communicate insights.',
    skillsToDevelop: ['Advanced Statistics', 'A/B Testing', 'Experiment Design', 'Business Acumen'],
    certifications: ['IBM Data Science Professional', 'Microsoft Azure Data Scientist', 'SAS Advanced Analytics'],
    averageSalary: '$85,000 - $130,000', growthRate: '28% annually',
  },
  {
    id: 'cr3', title: 'Software Architect', matchScore: 78, demandLevel: 'Medium',
    rationale: 'With CS401 (Software Engineering) and your experience with React and Node.js, you have the foundation for architectural roles. This path typically requires 3-5 years of experience but offers significant career growth.',
    skillsToDevelop: ['System Design', 'Microservices', 'DevOps', 'Technical Leadership'],
    certifications: ['AWS Solutions Architect', 'TOGAF Certification', 'Kubernetes Administrator'],
    averageSalary: '$120,000 - $180,000', growthRate: '15% annually',
  },
  {
    id: 'cr4', title: 'AI Research Scientist', matchScore: 71, demandLevel: 'Medium',
    rationale: 'Your interest in AI and strong academic performance suggest potential for research. This path typically requires graduate studies but is highly rewarding for those passionate about advancing the field.',
    skillsToDevelop: ['Research Methodology', 'Academic Writing', 'Mathematical Proofs', 'Conference Presentations'],
    certifications: ['PhD in Computer Science/AI', 'Published Papers in Top Venues'],
    averageSalary: '$100,000 - $200,000', growthRate: '25% annually',
  },
  {
    id: 'cr5', title: 'DevOps Engineer', matchScore: 65, demandLevel: 'High',
    rationale: 'Your Docker and AWS skills provide a foundation for DevOps roles. This is a high-demand field with strong salary prospects, though it requires deep infrastructure knowledge.',
    skillsToDevelop: ['CI/CD Pipelines', 'Infrastructure as Code', 'Monitoring & Observability', 'Security Practices'],
    certifications: ['AWS DevOps Engineer', 'Kubernetes Administrator (CKA)', 'Docker Certified Associate'],
    averageSalary: '$90,000 - $145,000', growthRate: '30% annually',
  },
];

// ===================== Admin Users =====================
export const mockAdminUsers: AdminUser[] = [
  { id: 'u1', name: 'Ada Okonkwo', email: 'ada@compass.edu', role: 'STUDENT', programme: 'Computer Science', status: 'active', createdAt: '2022-09-01', lastLogin: '2025-01-15T08:00:00Z' },
  { id: 'u2', name: 'Bruno Minkou', email: 'bruno@compass.edu', role: 'STUDENT', programme: 'Computer Science', status: 'active', createdAt: '2023-09-01', lastLogin: '2025-01-14T16:00:00Z' },
  { id: 'u3', name: 'Claire Ngo Mbe', email: 'claire@compass.edu', role: 'STUDENT', programme: 'Data Science', status: 'active', createdAt: '2022-09-01', lastLogin: '2025-01-15T10:00:00Z' },
  { id: 'u4', name: 'David Tchinda', email: 'david@compass.edu', role: 'STUDENT', programme: 'Data Science', status: 'active', createdAt: '2023-09-01', lastLogin: '2025-01-10T09:00:00Z' },
  { id: 'u5', name: 'Esther Fomba', email: 'esther@compass.edu', role: 'STUDENT', programme: 'Computer Science', status: 'active', createdAt: '2021-09-01', lastLogin: '2025-01-15T07:00:00Z' },
  { id: 'u6', name: 'Fabrice Kamga', email: 'fabrice@compass.edu', role: 'STUDENT', programme: 'Data Science', status: 'active', createdAt: '2024-09-01', lastLogin: '2025-01-12T14:00:00Z' },
  { id: 'l1', name: 'Dr. Ngwa Emmanuel', email: 'dr.ngwa@compass.edu', role: 'LECTURER', status: 'active', createdAt: '2020-01-15', lastLogin: '2025-01-15T09:00:00Z' },
  { id: 'l2', name: 'Dr. Ache Pamela', email: 'dr.ache@compass.edu', role: 'LECTURER', status: 'active', createdAt: '2019-08-01', lastLogin: '2025-01-14T11:00:00Z' },
  { id: 'a1', name: 'System Admin', email: 'admin@compass.edu', role: 'ADMIN', status: 'active', createdAt: '2020-01-01', lastLogin: '2025-01-15T06:00:00Z' },
  { id: 'u7', name: 'George Nkoulou', email: 'george@compass.edu', role: 'STUDENT', programme: 'Computer Science', status: 'inactive', createdAt: '2021-09-01', lastLogin: '2024-06-15T10:00:00Z' },
];

// ===================== RAG Documents =====================
export const mockRAGDocuments: RAGDocument[] = [
  { id: 'rd1', fileName: 'Student_Handbook_v3.pdf', fileType: 'pdf', fileSize: 5200000, chunkCount: 245, uploadedBy: 'admin@compass.edu', uploadedAt: '2024-08-15T10:00:00Z', status: 'indexed' },
  { id: 'rd2', fileName: 'CS_Curriculum_2024.pdf', fileType: 'pdf', fileSize: 1800000, chunkCount: 98, uploadedBy: 'admin@compass.edu', uploadedAt: '2024-08-15T10:05:00Z', status: 'indexed' },
  { id: 'rd3', fileName: 'Academic_Calendar.pdf', fileType: 'pdf', fileSize: 450000, chunkCount: 32, uploadedBy: 'admin@compass.edu', uploadedAt: '2024-08-16T09:00:00Z', status: 'indexed' },
  { id: 'rd4', fileName: 'DS_Curriculum_2024.pdf', fileType: 'pdf', fileSize: 1650000, chunkCount: 87, uploadedBy: 'admin@compass.edu', uploadedAt: '2024-08-16T09:10:00Z', status: 'indexed' },
  { id: 'rd5', fileName: 'Compass_AI_Documentation.pdf', fileType: 'pdf', fileSize: 3200000, chunkCount: 156, uploadedBy: 'admin@compass.edu', uploadedAt: '2024-09-01T14:00:00Z', status: 'indexed' },
  { id: 'rd6', fileName: 'Exam_Regulations_2024.pdf', fileType: 'pdf', fileSize: 890000, chunkCount: 64, uploadedBy: 'dr.ngwa@compass.edu', uploadedAt: '2025-01-10T08:30:00Z', status: 'processing' },
];

// ===================== Lecturer Timetable =====================
export const mockLecturerTimetable: LecturerTimetable[] = [
  { day: 'Monday', slots: [{ time: '08:00-09:30', courseCode: 'CS301', courseName: 'Artificial Intelligence', room: 'Hall A', type: 'lecture' }, { time: '14:00-15:30', courseCode: 'CS302', courseName: 'Database Systems', room: 'Lab 2', type: 'lab' }] },
  { day: 'Tuesday', slots: [{ time: '10:00-11:30', courseCode: 'CS301', courseName: 'Artificial Intelligence', room: 'Room 201', type: 'tutorial' }, { time: '14:00-16:00', courseCode: 'DS302', courseName: 'Data Visualization', room: 'Lab 3', type: 'lab' }] },
  { day: 'Wednesday', slots: [{ time: '08:00-09:30', courseCode: 'CS302', courseName: 'Database Systems', room: 'Hall B', type: 'lecture' }] },
  { day: 'Thursday', slots: [{ time: '10:00-11:30', courseCode: 'DS302', courseName: 'Data Visualization', room: 'Room 305', type: 'lecture' }, { time: '14:00-15:30', courseCode: 'CS301', courseName: 'Artificial Intelligence', room: 'Lab 1', type: 'lab' }] },
  { day: 'Friday', slots: [{ time: '08:00-09:30', courseCode: 'CS302', courseName: 'Database Systems', room: 'Room 201', type: 'tutorial' }] },
];

// ===================== At-Risk Students (for lecturer view) =====================
export const mockAtRiskStudents: AtRiskStudent[] = [
  { id: 'u2', name: 'Bruno Minkou', studentId: 'STD-2023-042', programme: 'Computer Science', riskLevel: 'Critical', riskScore: 28, gpa: 1.86 },
  { id: 'u4', name: 'David Tchinda', studentId: 'STD-2023-058', programme: 'Data Science', riskLevel: 'At-Risk', riskScore: 45, gpa: 2.00 },
  { id: 'u1', name: 'Ada Okonkwo', studentId: 'STD-2022-015', programme: 'Computer Science', riskLevel: 'Passing', riskScore: 72, gpa: 3.10 },
  { id: 'u6', name: 'Fabrice Kamga', studentId: 'STD-2024-077', programme: 'Data Science', riskLevel: 'Passing', riskScore: 68, gpa: 3.00 },
];