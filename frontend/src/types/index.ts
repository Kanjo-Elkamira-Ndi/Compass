export type Role = "STUDENT" | "LECTURER" | "ADMIN";

export type RiskLevel = "EXCELLENT" | "PASSING" | "AT_RISK" | "CRITICAL";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  timestamp: string;
}

export interface PublicStats {
  activeStudents: number;
  coursesOffered: number;
  aiQueriesAnswered: number;
}
