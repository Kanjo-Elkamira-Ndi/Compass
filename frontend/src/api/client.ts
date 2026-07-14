import type {
  User, Role, LoginCredentials, RegisterData,
  Course, Enrollment, GradeRecord, GPATrend,
  RiskAssessment, ChatSession, ChatMessage,
  ResearchUpload, ExamQuestion, ExamConfig,
  CareerRecommendation, AdminUser, RAGDocument,
  StudentDashboard, LecturerDashboard, LecturerTimetable,
  ApiResponse, ContactFormData, RiskLevel,
} from '@/types';
import {
  mockUsers, mockCourses, mockEnrollments, mockGrades,
  mockGPATrends, mockRiskAssessments, mockChatSessions,
  mockChatMessages, mockResearchUploads, mockExamQuestions,
  mockCareerRecommendations, mockAdminUsers, mockRAGDocuments,
  mockLecturerTimetable, mockAtRiskStudents,
} from './mock-data';

// Simulate network delay
const delay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate occasional errors (5% chance)
const maybeThrow = () => {
  if (Math.random() < 0.05) throw new Error('Network error. Please try again.');
};

// ===================== Auth API =====================
export async function login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
  await delay(600);
  maybeThrow();
  const user = mockUsers.find(u => u.email === credentials.email);
  if (!user) throw new Error('Invalid email or password.');
  return { data: { user, token: 'mock-jwt-token-' + user.id }, success: true };
}

export async function register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
  await delay(800);
  maybeThrow();
  const newUser: User = {
    id: 'u-new-' + Date.now(),
    email: data.email,
    name: data.name,
    role: data.role,
    programme: data.programme,
    createdAt: new Date().toISOString(),
  };
  return { data: { user: newUser, token: 'mock-jwt-token-' + newUser.id }, success: true, message: 'Account created successfully!' };
}

export async function requestPasswordReset(email: string): Promise<ApiResponse<null>> {
  await delay(600);
  maybeThrow();
  return { data: null, success: true, message: 'If an account exists with that email, a reset link has been sent.' };
}

export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
  await delay(600);
  maybeThrow();
  void token; void newPassword;
  return { data: null, success: true, message: 'Password has been reset successfully.' };
}

// ===================== Student Dashboard =====================
export async function getStudentDashboard(studentId: string): Promise<ApiResponse<StudentDashboard>> {
  await delay(700);
  maybeThrow();
  const gpaTrend = mockGPATrends[studentId] || mockGPATrends['u1'];
  const enrollments = mockEnrollments.filter(e => e.studentId === studentId);
  const risk = mockRiskAssessments[studentId] || mockRiskAssessments['u1'];
  const completedGrades = mockGrades.filter(g =>
    g.semester !== '2024-2' // completed semesters
  );
  const totalCredits = completedGrades.reduce((sum, g) => sum + g.credits, 0);
  const currentGPA = gpaTrend[gpaTrend.length - 1]?.cumulativeGpa || 0;
  return {
    data: {
      gpaTrend: gpaTrend,
      currentGPA,
      enrollments,
      riskAssessment: risk,
      totalCredits,
      completedCredits: Math.floor(totalCredits * 0.7),
    },
    success: true,
  };
}

// ===================== Courses =====================
export async function getCourses(): Promise<ApiResponse<Course[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockCourses, success: true };
}

export async function getStudentCourses(studentId: string): Promise<ApiResponse<Enrollment[]>> {
  await delay(500);
  maybeThrow();
  const enrolled = mockEnrollments.filter(e => e.studentId === studentId);
  return { data: enrolled, success: true };
}

export async function enrollInCourse(studentId: string, courseId: string): Promise<ApiResponse<Enrollment>> {
  await delay(600);
  maybeThrow();
  const course = mockCourses.find(c => c.id === courseId);
  if (!course) throw new Error('Course not found.');
  const enrollment: Enrollment = {
    id: 'e-new-' + Date.now(),
    courseId,
    course,
    studentId,
    enrolledAt: new Date().toISOString(),
  };
  return { data: enrollment, success: true, message: `Successfully enrolled in ${course.name}` };
}

export async function dropCourse(enrollmentId: string): Promise<ApiResponse<null>> {
  await delay(600);
  maybeThrow();
  void enrollmentId;
  return { data: null, success: true, message: 'Course dropped successfully.' };
}

// ===================== Grades =====================
export async function getGradeRecords(studentId: string): Promise<ApiResponse<GradeRecord[]>> {
  await delay(500);
  maybeThrow();
  // Return grades for the "current user" — in mock, we show all grades
  const grades = studentId === 'u1' ? mockGrades.filter(g =>
    ['g1','g2','g3','g4','g5','g6','g7','g8','g9'].includes(g.id)
  ) : mockGrades.slice(0, 10);
  return { data: grades, success: true };
}

// ===================== Risk Assessment =====================
export async function getRiskAssessment(studentId: string): Promise<ApiResponse<RiskAssessment>> {
  await delay(600);
  maybeThrow();
  const risk = mockRiskAssessments[studentId] || mockRiskAssessments['u1'];
  return { data: risk, success: true };
}

export async function runRiskAssessment(studentId: string): Promise<ApiResponse<RiskAssessment>> {
  await delay(1500); // Simulate AI processing
  maybeThrow();
  const risk = mockRiskAssessments[studentId] || mockRiskAssessments['u1'];
  return { data: { ...risk, lastUpdated: new Date().toISOString() }, success: true, message: 'Risk assessment completed.' };
}

// ===================== AI Chat =====================
export async function getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
  await delay(400);
  maybeThrow();
  return { data: mockChatSessions, success: true };
}

export async function getChatMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockChatMessages[sessionId] || [], success: true };
}

export async function sendChatMessage(sessionId: string, content: string): Promise<ApiResponse<ChatMessage>> {
  await delay(1200); // Simulate AI response
  maybeThrow();
  const response: ChatMessage = {
    id: 'm-' + Date.now(),
    sessionId,
    role: 'assistant',
    content: `Thank you for your question about "${content.slice(0, 50)}...". Based on your academic profile and the available resources, I'd recommend reviewing the relevant course materials and scheduling a consultation with your academic advisor. Your current academic standing suggests you're on track, but there are specific areas where focused effort could yield significant improvements.`,
    sources: [{ title: 'Academic Advisory Guide', documentName: 'Student_Handbook_v3.pdf', relevance: 0.89 }],
    createdAt: new Date().toISOString(),
  };
  return { data: response, success: true };
}

export async function createChatSession(title: string): Promise<ApiResponse<ChatSession>> {
  await delay(400);
  maybeThrow();
  const session: ChatSession = {
    id: 'cs-' + Date.now(),
    title,
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    messageCount: 0,
  };
  return { data: session, success: true };
}

// ===================== Research Assistant =====================
export async function getResearchUploads(): Promise<ApiResponse<ResearchUpload[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockResearchUploads, success: true };
}

export async function uploadResearchDocument(file: File): Promise<ApiResponse<ResearchUpload>> {
  // Simulate upload progress — return immediately with "uploading" status
  const upload: ResearchUpload = {
    id: 'ru-' + Date.now(),
    fileName: file.name,
    fileSize: file.size,
    status: 'uploading',
    progress: 0,
    uploadedAt: new Date().toISOString(),
  };
  return { data: upload, success: true, message: 'Upload started.' };
}

export async function getResearchResult(uploadId: string): Promise<ApiResponse<ResearchUpload>> {
  await delay(2000);
  maybeThrow();
  const existing = mockResearchUploads.find(u => u.id === uploadId);
  if (existing?.result) {
    return { data: existing, success: true };
  }
  // Return first mock result as a "processed" version
  return { data: { ...mockResearchUploads[0], id: uploadId, fileName: 'uploaded_document.pdf' }, success: true };
}

// ===================== Exam Generator =====================
export async function generateExam(config: ExamConfig): Promise<ApiResponse<ExamQuestion[]>> {
  await delay(2000);
  maybeThrow();
  void config;
  return { data: mockExamQuestions, success: true, message: 'Exam generated successfully!' };
}

// ===================== Career Advisor =====================
export async function getCareerRecommendations(): Promise<ApiResponse<CareerRecommendation[]>> {
  await delay(800);
  maybeThrow();
  return { data: mockCareerRecommendations, success: true };
}

// ===================== Lecturer =====================
export async function getLecturerDashboard(lecturerId: string): Promise<ApiResponse<LecturerDashboard>> {
  await delay(600);
  maybeThrow();
  const courses = mockCourses.filter(c => c.lecturerId === lecturerId);
  return {
    data: {
      assignedCourses: courses,
      atRiskStudents: mockAtRiskStudents,
      totalStudents: 120,
    },
    success: true,
  };
}

export async function getLecturerStudents(): Promise<ApiResponse<typeof mockAtRiskStudents>> {
  await delay(500);
  maybeThrow();
  return { data: mockAtRiskStudents, success: true };
}

export async function getLecturerTimetable(): Promise<ApiResponse<LecturerTimetable[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockLecturerTimetable, success: true };
}

export async function submitGrade(studentId: string, courseId: string, grade: string, gpaPoints: number): Promise<ApiResponse<null>> {
  await delay(600);
  maybeThrow();
  void studentId; void courseId; void grade; void gpaPoints;
  return { data: null, success: true, message: 'Grade submitted successfully.' };
}

// ===================== Admin =====================
export async function getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  await delay(600);
  maybeThrow();
  return { data: mockAdminUsers, success: true };
}

export async function createUser(data: { name: string; email: string; role: Role; programme?: string }): Promise<ApiResponse<AdminUser>> {
  await delay(800);
  maybeThrow();
  const user: AdminUser = {
    id: 'u-' + Date.now(),
    name: data.name,
    email: data.email,
    role: data.role,
    programme: data.programme,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  return { data: user, success: true, message: 'User created successfully.' };
}

export async function updateUser(userId: string, data: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
  await delay(600);
  maybeThrow();
  const existing = mockAdminUsers.find(u => u.id === userId);
  if (!existing) throw new Error('User not found.');
  return { data: { ...existing, ...data }, success: true, message: 'User updated successfully.' };
}

export async function deactivateUser(userId: string): Promise<ApiResponse<null>> {
  await delay(600);
  maybeThrow();
  void userId;
  return { data: null, success: true, message: 'User deactivated successfully.' };
}

export async function getAdminCourses(): Promise<ApiResponse<Course[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockCourses, success: true };
}

export async function createCourse(data: Omit<Course, 'id' | 'enrolledCount'>): Promise<ApiResponse<Course>> {
  await delay(800);
  maybeThrow();
  const course: Course = { ...data, id: 'c-' + Date.now(), enrolledCount: 0 };
  return { data: course, success: true, message: 'Course created successfully.' };
}

export async function updateCourse(courseId: string, data: Partial<Course>): Promise<ApiResponse<Course>> {
  await delay(600);
  maybeThrow();
  const existing = mockCourses.find(c => c.id === courseId);
  if (!existing) throw new Error('Course not found.');
  return { data: { ...existing, ...data }, success: true, message: 'Course updated successfully.' };
}

export async function getRAGDocuments(): Promise<ApiResponse<RAGDocument[]>> {
  await delay(500);
  maybeThrow();
  return { data: mockRAGDocuments, success: true };
}

export async function uploadRAGDocument(file: File): Promise<ApiResponse<RAGDocument>> {
  await delay(1500);
  maybeThrow();
  const doc: RAGDocument = {
    id: 'rd-' + Date.now(),
    fileName: file.name,
    fileType: file.type || 'pdf',
    fileSize: file.size,
    chunkCount: Math.floor(Math.random() * 200) + 30,
    uploadedBy: 'admin@compass.edu',
    uploadedAt: new Date().toISOString(),
    status: 'processing',
  };
  return { data: doc, success: true, message: 'Document uploaded and processing started.' };
}

// ===================== Contact =====================
export async function submitContactForm(data: ContactFormData): Promise<ApiResponse<null>> {
  await delay(800);
  maybeThrow();
  if (data.honeypot) {
    // Silently "succeed" for bots
    return { data: null, success: true };
  }
  void data;
  return { data: null, success: true, message: 'Thank you for your message! We\'ll get back to you within 24 hours.' };
}

// ===================== User Profile =====================
export async function updateProfile(userId: string, data: { name: string; skills: string[] }): Promise<ApiResponse<User>> {
  await delay(600);
  maybeThrow();
  const existing = mockUsers.find(u => u.id === userId);
  if (!existing) throw new Error('User not found.');
  return { data: { ...existing, ...data }, success: true, message: 'Profile updated successfully.' };
}