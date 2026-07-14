import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicLayout from "@/layouts/PublicLayout";
import AppShell from "@/layouts/AppShell";
import { LandingPage } from "@/pages/public/LandingPage";
import { FeaturesPage } from "@/pages/public/FeaturesPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { FAQPage } from "@/pages/public/FaqPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { StudentDashboard } from "@/pages/student/StudentDashboard";
import { StudentCourses } from "@/pages/student/StudentCoursesPage";
import { StudentResults } from "@/pages/student/StudentResultsPage";
import { StudentProfile } from "@/pages/student/StudentProfilePage";
import { LecturerDashboard } from "@/pages/lecturer/LecturerDashboard";
import { LecturerStudents } from "@/pages/lecturer/LecturerStudentsPage";
import { LecturerCourses } from "@/pages/lecturer/LecturerCoursesPage";
import { AIChat } from "@/pages/ai/AIChatPage";
import { AIRisk } from "@/pages/ai/RiskPage";
import { AIResearch } from "@/pages/ai/ResearchPage";
import { AIExamGenerator } from "@/pages/ai/ExamGeneratorPage";
import { AICareer } from "@/pages/ai/CareerPage";
import { AdminUsers } from "@/pages/admin/AdminUsersPage";
import { AdminCourses } from "@/pages/admin/AdminCoursesPage";
import { AdminRAGDocs } from "@/pages/admin/AdminRagPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Auth pages (standalone, no layout wrapper) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected authenticated pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/courses" element={<StudentCourses />} />
                <Route path="/student/results" element={<StudentResults />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
                <Route path="/lecturer/students" element={<LecturerStudents />} />
                <Route path="/lecturer/courses" element={<LecturerCourses />} />
                <Route path="/ai/chat" element={<AIChat />} />
                <Route path="/ai/risk" element={<AIRisk />} />
                <Route path="/ai/research" element={<AIResearch />} />
                <Route path="/ai/exam-generator" element={<AIExamGenerator />} />
                <Route path="/ai/career" element={<AICareer />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/rag" element={<AdminRAGDocs />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                  <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                  <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
