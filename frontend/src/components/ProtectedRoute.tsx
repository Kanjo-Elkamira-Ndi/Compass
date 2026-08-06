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
  "/student/complaints": ["STUDENT"],
  "/lecturer/complaints": ["LECTURER"],
  "/admin/complaints": ["ADMIN"],
};

function pathMatches(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + "/");
}

function getDefaultDashboard(role: Role | undefined): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "LECTURER":
      return "/lecturer/dashboard";
    case "ADMIN":
      return "/admin/users";
    default:
      return "/login";
  }
}

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role as Role | undefined;
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) => pathMatches(location.pathname, route));
  const allowedRoles = matchedRoute ? PROTECTED_ROUTES[matchedRoute] : undefined;
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to={getDefaultDashboard(userRole)} replace />;
  }

  return <Outlet />;
}
