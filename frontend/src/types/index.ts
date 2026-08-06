// ===================== Auth =====================
export type Role = 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  programme?: string;
  yearOfStudy?: number;
  skills?: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null; // in-memory only
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  programme?: string;
}

// ===================== Courses =====================
export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  lecturerId: string;
  lecturerName: string;
  semester: string;
  programme: string;
  enrolledCount: number;
  maxCapacity: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  course: Course;
  studentId: string;
  enrolledAt: string;
  grade?: string;
  gpaPoints?: number;
}

// ===================== Grades & GPA =====================
export interface GradeRecord {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
  grade: string;
  gpaPoints: number;
  credits: number;
}

export interface GPATrend {
  semester: string;
  gpa: number;
  cumulativeGpa: number;
}

// ===================== Risk Assessment =====================
export type RiskLevel = 'Excellent' | 'Passing' | 'At-Risk' | 'Critical';

export interface RiskFactor {
  name: string;
  value: number; // 0-100 score
  weight: number;
  status: 'good' | 'warning' | 'danger';
  description: string;
}

export interface RiskAssessment {
  studentId: string;
  level: RiskLevel;
  score: number;
  factors: RiskFactor[];
  recommendedActions: RecommendedAction[];
  lastUpdated: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

// ===================== AI Chat =====================
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  createdAt: string;
}

export interface ChatSource {
  title: string;
  documentName: string;
  relevance: number;
}

// ===================== Research Assistant =====================
export interface ResearchUpload {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: string;
  result?: ResearchResult;
}

export interface ResearchResult {
  summary: string;
  keyFindings: string[];
  researchGaps: string[];
  futureWork: string[];
  methodology: string;
}

// ===================== Exam Generator =====================
export type QuestionType = 'mcq' | 'short-answer' | 'essay' | 'true-false';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  points: number;
  options?: { label: string; text: string; isCorrect?: boolean }[];
  answer?: string;
  explanation: string;
  order: number;
}

export interface ExamConfig {
  topic: string;
  courseId: string;
  difficulty: Difficulty;
  questionCount: number;
  questionTypes: QuestionType[];
}

// ===================== Career Advisor =====================
export interface CareerRecommendation {
  id: string;
  title: string;
  matchScore: number;
  demandLevel: 'High' | 'Medium' | 'Low';
  rationale: string;
  skillsToDevelop: string[];
  certifications: string[];
  averageSalary: string;
  growthRate: string;
}

// ===================== Admin =====================
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  programme?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

export interface RAGDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'indexed' | 'processing' | 'failed';
}

// ===================== Dashboard =====================
export interface StudentDashboard {
  gpaTrend: GPATrend[];
  currentGPA: number;
  enrollments: Enrollment[];
  riskAssessment: RiskAssessment;
  totalCredits: number;
  completedCredits: number;
}

export interface LecturerDashboard {
  assignedCourses: Course[];
  atRiskStudents: AtRiskStudent[];
  totalStudents: number;
}

export interface AtRiskStudent {
  id: string;
  name: string;
  studentId: string;
  programme: string;
  riskLevel: RiskLevel;
  riskScore: number;
  gpa: number;
}

export interface LecturerTimetable {
  day: string;
  slots: TimetableSlot[];
}

export interface TimetableSlot {
  time: string;
  courseCode: string;
  courseName: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

// ===================== Contact =====================
export interface ContactFormData {
  name: string;
  email: string;
  roleInterest: 'Student' | 'Lecturer' | 'Partner';
  message: string;
  honeypot?: string;
}

// ===================== API Response wrapper =====================
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ===================== Pagination =====================
export interface Paginated<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ===================== Complaints =====================
export type ComplaintCategory =
  | 'ACADEMIC'
  | 'ADMINISTRATIVE'
  | 'EXAMINATION'
  | 'FACILITY'
  | 'FINANCIAL'
  | 'HARASSMENT'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface ComplaintSummary {
  id: string;
  subject: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  anonymous: boolean;
  studentName: string;
  studentNumber?: string;
  assigneeName?: string;
  replyCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplaintReply {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  message: string;
  createdAt: string;
}

export interface ComplaintAttachment {
  id: string;
  fileName: string;
  contentType?: string;
  fileSize: number;
  createdAt?: string;
}

export interface ComplaintStatusHistoryEntry {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  changedByName: string;
  changedAt: string;
}

export interface Complaint {
  id: string;
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  anonymous: boolean;
  studentId: string;
  studentName: string;
  studentNumber?: string;
  assignedTo?: string;
  assigneeName?: string;
  resolution?: string;
  replies: ComplaintReply[];
  attachments: ComplaintAttachment[];
  statusHistory: ComplaintStatusHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateComplaintInput {
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  anonymous: boolean;
  files: File[];
}

// ===================== Lecturers =====================
export interface LecturerSummary {
  id: string;
  name: string;
  staffId?: string;
  department?: string;
}

// ===================== Notifications =====================
export type NotificationType =
  | 'COMPLAINT_SUBMITTED'
  | 'COMPLAINT_ASSIGNED'
  | 'COMPLAINT_REPLIED'
  | 'COMPLAINT_RESOLVED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

