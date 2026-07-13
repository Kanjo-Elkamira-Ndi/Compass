export const ROUTES = {
  HOME: "/",
  FEATURES: "/features",
  ABOUT: "/about",
  FAQ: "/faq",
  CONTACT: "/contact",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",

  STUDENT_DASHBOARD: "/student/dashboard",
  STUDENT_COURSES: "/student/courses",
  STUDENT_RESULTS: "/student/results",
  STUDENT_PROFILE: "/student/profile",

  LECTURER_DASHBOARD: "/lecturer/dashboard",
  LECTURER_STUDENTS: "/lecturer/students",
  LECTURER_COURSES: "/lecturer/courses",

  AI_CHAT: "/ai/chat",
  AI_RISK: "/ai/risk",
  AI_CAREER: "/ai/career",
  AI_RESEARCH: "/ai/research",
  AI_EXAM_GENERATOR: "/ai/exam-generator",

  ADMIN_USERS: "/admin/users",
  ADMIN_COURSES: "/admin/courses",
  ADMIN_RAG: "/admin/rag",
} as const;
