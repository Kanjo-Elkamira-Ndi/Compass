import axios from 'axios';
import type {
  User, Role, LoginCredentials, RegisterData,
  Course, Enrollment, GradeRecord, GPATrend,
  RiskAssessment, ChatSession, ChatMessage,
  ResearchUpload, ExamQuestion, ExamConfig,
  CareerRecommendation, AdminUser, RAGDocument,
  StudentDashboard, LecturerDashboard, LecturerTimetable,
  ApiResponse, ContactFormData, RiskLevel,
} from '@/types';

// Create Axios instance with base URL
const api = axios.create({
  baseURL: '/api/v1',
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===================== Auth API =====================
export async function login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
  const { data } = await api.post('/auth/login', credentials);
  // Backend returns accessToken, frontend expects token
  if (data.data) {
    data.data = {
      user: { id: data.data.id, email: data.data.email, name: data.data.email, role: data.data.role, createdAt: new Date().toISOString() },
      token: data.data.accessToken,
    };
  }
  return data;
}

export async function register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
  // Split name into firstName/lastName for backend
  const nameParts = data.name.split(' ');
  const firstName = nameParts[0] || data.name;
  const lastName = nameParts.slice(1).join(' ') || data.name;

  const { data: response } = await api.post('/auth/register', {
    firstName,
    lastName,
    email: data.email,
    password: data.password,
    role: data.role,
    programme: data.programme,
  });

  // Backend returns accessToken, frontend expects token
  if (response.data) {
    response.data = {
      user: { id: response.data.id, email: response.data.email, name: data.name, role: response.data.role, createdAt: new Date().toISOString() },
      token: response.data.accessToken,
    };
  }
  return response;
}

export async function requestPasswordReset(email: string): Promise<ApiResponse<null>> {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data;
}

// ===================== Student Dashboard =====================
export async function getStudentDashboard(studentId: string): Promise<ApiResponse<StudentDashboard>> {
  // Backend doesn't have a dashboard endpoint yet — return a safe default
  // so the frontend doesn't crash while we build it out
  return {
    success: true,
    data: {
      gpaTrend: [],
      currentGPA: 0,
      enrollments: [],
      riskAssessment: {
        studentId,
        level: 'PASSING',
        score: 0.5,
        factors: [],
        recommendedActions: [],
        lastUpdated: new Date().toISOString(),
      },
      totalCredits: 0,
      completedCredits: 0,
    },
  };
}

// ===================== Courses =====================
export async function getCourses(): Promise<ApiResponse<Course[]>> {
  const { data } = await api.get('/courses');
  // Backend returns paginated: { content: [...], totalElements, ... }
  // Frontend expects a flat array
  const courses = data.data?.content || data.data || [];
  return { success: true, data: courses };
}

export async function getStudentCourses(studentId: string): Promise<ApiResponse<Enrollment[]>> {
  const { data } = await api.get('/courses?studentId=' + studentId);
  const raw = data.data?.content || data.data || [];
  // Transform backend flat fields to frontend nested format
  const enrollments = (Array.isArray(raw) ? raw : []).map((e: any) => ({
    id: e.id,
    courseId: e.courseId,
    course: {
      id: e.courseId,
      code: e.courseCode || '',
      name: e.courseName || '',
      credits: e.credits || 3,
      programme: e.programme || '',
      lecturerName: e.lecturerName || '',
    },
    studentId: e.studentId,
    enrolledAt: e.enrolmentDate || e.createdAt,
    grade: e.finalGrade,
  }));
  return { success: true, data: enrollments };
}

export async function enrollInCourse(studentId: string, courseId: string): Promise<ApiResponse<Enrollment>> {
  const { data } = await api.post(`/courses/${courseId}/enrol`);
  return data;
}

export async function dropCourse(enrollmentId: string): Promise<ApiResponse<null>> {
  const { data } = await api.post(`/courses/${enrollmentId}/drop`);
  return data;
}

// ===================== Grades =====================
export async function getGradeRecords(studentId: string): Promise<GradeRecord[]> {
  const { data } = await api.get(`/performance/students/${studentId}/grades`);
  return data.data.map((r: any) => ({
    id: r.id,
    courseId: r.courseId,
    courseCode: r.courseCode,
    courseName: r.courseName,
    semester: r.academicYear ? `${r.semester}-${r.academicYear}` : String(r.semester),
    grade: r.gradeLetter,
    gpaPoints: r.gradePoints,
    credits: r.credits,
  }));
}

// ===================== Risk Assessment =====================
export async function getRiskAssessment(studentId: string): Promise<ApiResponse<RiskAssessment>> {
  try {
    const { data } = await api.get(`/ai/risk-assessment/${studentId}/latest`);
    return data;
  } catch {
    // Return default if no assessment exists yet
    return {
      success: true,
      data: {
        studentId,
        level: 'PASSING',
        score: 0.5,
        factors: [],
        recommendedActions: [],
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

export async function runRiskAssessment(studentId: string): Promise<ApiResponse<RiskAssessment>> {
  try {
    const { data } = await api.post(`/ai/risk-assessment/${studentId}`);
    return data;
  } catch {
    return {
      success: true,
      data: {
        studentId,
        level: 'PASSING',
        score: 0.5,
        factors: [],
        recommendedActions: [],
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

// ===================== AI Chat =====================
export async function getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
  // Backend doesn't have a sessions list endpoint yet
  return { success: true, data: [] };
}

export async function getChatMessages(sessionId: string): Promise<ApiResponse<ChatMessage[]>> {
  try {
    const { data } = await api.get(`/ai/chat/history/${sessionId}`);
    return data;
  } catch {
    return { success: true, data: [] };
  }
}

export async function sendChatMessage(sessionId: string, content: string): Promise<ApiResponse<ChatMessage>> {
  const { data } = await api.post('/ai/chat', { sessionId, message: content });
  // Backend returns ChatResponse with answer/citations, frontend expects ChatMessage
  const chatData = data.data;
  return {
    success: true,
    data: {
      id: 'm-' + Date.now(),
      sessionId: chatData.sessionId || sessionId,
      role: 'assistant',
      content: chatData.answer || '',
      sources: chatData.citations || [],
      createdAt: new Date().toISOString(),
    },
  };
}

export async function createChatSession(title: string): Promise<ApiResponse<ChatSession>> {
  // Backend doesn't have a sessions endpoint yet — return mock
  return {
    success: true,
    data: {
      id: 'cs-' + Date.now(),
      title,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
    },
  };
}

// ===================== Research Assistant =====================
export async function getResearchUploads(): Promise<ApiResponse<ResearchUpload[]>> {
  const { data } = await api.get('/ai/research-assistant/history');
  const items = data.data || [];
  return {
    success: true,
    data: items.map((item: any) => ({
      id: item.id,
      fileName: item.fileName,
      fileSize: item.fileSize,
      status: 'completed' as const,
      progress: 100,
      uploadedAt: item.createdAt || new Date().toISOString(),
      result: item.summary ? {
        summary: item.summary,
        keyFindings: item.keyFindings || [],
        researchGaps: item.researchGaps || [],
        futureWork: item.futureWork || [],
      } : undefined,
    })),
  };
}

export async function uploadResearchDocument(file: File): Promise<ApiResponse<ResearchUpload>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/ai/research-assistant', formData);
  // Transform backend ResearchAnalysisResponse to frontend ResearchUpload format
  const analysis = data.data;
  return {
    success: true,
    data: {
      id: analysis?.id || 'upload-' + Date.now(),
      fileName: file.name,
      fileSize: file.size,
      status: 'completed',
      progress: 100,
      uploadedAt: analysis?.createdAt || new Date().toISOString(),
      result: analysis ? {
        summary: analysis.summary || '',
        keyFindings: analysis.keyFindings || [],
        researchGaps: analysis.researchGaps || [],
        futureWork: analysis.futureWork || [],
      } : undefined,
    },
  };
}

export async function getResearchResult(uploadId: string): Promise<ApiResponse<ResearchUpload>> {
  // Backend analyzes synchronously — return the upload as-is
  return {
    success: true,
    data: {
      id: uploadId,
      fileName: 'document.pdf',
      fileSize: 0,
      status: 'completed',
      progress: 100,
      uploadedAt: new Date().toISOString(),
    },
  };
}

// ===================== Exam Generator =====================
export async function generateExam(config: ExamConfig): Promise<ApiResponse<ExamQuestion[]>> {
  // Transform frontend fields to backend fields
  const backendConfig = {
    topic: config.topic,
    difficulty: config.difficulty,
    count: config.questionCount,
    types: config.questionTypes,
  };
  const { data } = await api.post('/ai/exam-generator', backendConfig);
  // Transform backend response to frontend format
  const questions = (data.data || []).map((q: any) => ({
    id: q.id,
    type: q.questionType?.toLowerCase() || 'theory',
    question: q.questionText || '',
    difficulty: config.difficulty || 'medium',
    points: 10,
    options: q.options || [],
    explanation: q.explanation || '',
  }));
  return { success: true, data: questions };
}

// ===================== Career Advisor =====================
export async function getCareerRecommendations(): Promise<ApiResponse<CareerRecommendation[]>> {
  const { data } = await api.get('/ai/career-recommendations');
  return data;
}

// ===================== Lecturer =====================
export async function getLecturerDashboard(lecturerId: string): Promise<ApiResponse<LecturerDashboard>> {
  // Backend doesn't have a lecturer dashboard endpoint yet
  return {
    success: true,
    data: {
      assignedCourses: [],
      atRiskStudents: [],
      totalStudents: 0,
    },
  };
}

export async function getLecturerStudents(): Promise<ApiResponse<any[]>> {
  const { data } = await api.get('/students');
  const students = data.data?.content || data.data || [];
  return {
    success: true,
    data: students.map((s: any) => ({
      id: s.id,
      name: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim(),
      studentId: s.studentId,
      programme: s.programme ?? '',
      riskLevel: s.riskLevel ?? 'Passing',
      riskScore: s.riskScore ?? 0,
      gpa: s.gpa ?? 0,
    })),
  };
}

export async function getLecturerTimetable(): Promise<ApiResponse<LecturerTimetable[]>> {
  // Backend doesn't have a timetable endpoint yet
  return { success: true, data: [] };
}

export async function submitGrade(studentId: string, courseId: string, gradeLetter: string, gpaPoints: number): Promise<ApiResponse<null>> {
  const { data } = await api.post('/performance/grades', { studentId, courseId, gradeLetter, gradePoints: gpaPoints });
  return data;
}

// ===================== Admin =====================
export async function getAdminUsers(): Promise<ApiResponse<AdminUser[]>> {
  const { data } = await api.get('/students');
  const users = data.data?.content || data.data || [];
  return { success: true, data: users };
}

export async function createUser(userData: { name: string; email: string; role: Role; programme?: string }): Promise<ApiResponse<AdminUser>> {
  const { data } = await api.post('/admin/users', userData);
  return data;
}

export async function updateUser(userId: string, userData: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
  const { data } = await api.put(`/admin/users/${userId}`, userData);
  return data;
}

export async function deactivateUser(userId: string): Promise<ApiResponse<null>> {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
}

export async function getAdminCourses(): Promise<ApiResponse<Course[]>> {
  const { data } = await api.get('/courses');
  const courses = data.data?.content || data.data || [];
  return { success: true, data: courses };
}

export async function createCourse(courseData: Omit<Course, 'id' | 'enrolledCount'>): Promise<ApiResponse<Course>> {
  const { data } = await api.post('/courses', courseData);
  return data;
}

export async function updateCourse(courseId: string, courseData: Partial<Course>): Promise<ApiResponse<Course>> {
  const { data } = await api.put(`/courses/${courseId}`, courseData);
  return data;
}

export async function getRAGDocuments(): Promise<ApiResponse<RAGDocument[]>> {
  // Backend doesn't have this endpoint yet
  return { success: true, data: [] };
}

export async function uploadRAGDocument(file: File): Promise<ApiResponse<RAGDocument>> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/admin/rag/upload', formData);
  return data;
}

// ===================== Contact =====================
export async function submitContactForm(formData: ContactFormData): Promise<ApiResponse<null>> {
  const { data } = await api.post('/public/contact', formData);
  return data;
}

// ===================== Public Stats =====================
export async function getPublicStats(): Promise<ApiResponse<{ activeStudents: number; coursesOffered: number; aiQueriesAnswered: number }>> {
  const { data } = await api.get('/public/stats');
  return data;
}

// ===================== User Profile =====================
export async function updateProfile(userId: string, profileData: { name: string; skills: string[] }): Promise<ApiResponse<User>> {
  const { data } = await api.put(`/students/${userId}`, profileData);
  return data;
}
