import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";

const PROTECTED_ROUTES: Record<string, Role[]> = {
  "/student/dashboard": ["STUDENT"],
  "/student/courses": ["STUDENT"],
  "/student/results": ["STUDENT"],
  "/student/profile": ["STUDENT"],
  "/lecturer/dashboard": ["LECTURER"],
  "/lecturer/students": ["LECTURER"],
  "/lecturer/courses": ["LECTURER"],
  "/ai/chat": ["STUDENT", "LECTURER"],
  "/ai/risk": ["STUDENT"],
  "/ai/research": ["STUDENT"],
  "/ai/exam-generator": ["LECTURER"],
  "/ai/career": ["STUDENT"],
  "/admin/users": ["ADMIN"],
  "/admin/courses": ["ADMIN"],
  "/admin/rag": ["ADMIN"],
};

function getDefaultDashboard(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "LECTURER":
      return "/lecturer/dashboard";
    case "ADMIN":
      return "/admin/users";
  }
}

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = PROTECTED_ROUTES[location.pathname];
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultDashboard(user.role)} replace />;
  }

  return <Outlet />;
}
