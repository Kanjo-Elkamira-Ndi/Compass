import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState, getRiskLevelColor, getRiskLevelDot } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { getLecturerDashboard, runRiskAssessment } from '@/api/client';
import type { LecturerDashboard as LecturerDashboardType } from '@/types';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  ShieldAlert,
  FileText,
  ArrowRight,
  Loader2,
  UserCheck,
} from 'lucide-react';

export function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<LecturerDashboardType | null>(null);
  const [assessingId, setAssessingId] = useState<string | null>(null);

  const retryDashboard = async () => {
    setState('loading');
    setError('');
    try {
      const res = await getLecturerDashboard(user!.id);
      setDashboard(res.data);
      setState('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      setState('error');
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getLecturerDashboard(user.id).then(res => {
      if (!cancelled) {
        setDashboard(res.data);
        setState('data');
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
        setState('error');
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const handleRunAssessment = async (studentId: string) => {
    setAssessingId(studentId);
    try {
      const res = await runRiskAssessment(studentId);
      toast.success(res.message || 'Risk assessment completed.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assessment failed.');
    } finally {
      setAssessingId(null);
    }
  };

  if (state === 'loading') return <LoadingState />;
  if (state === 'error' || !dashboard) return <ErrorState message={error} onRetry={retryDashboard} />;

  const { assignedCourses, atRiskStudents, totalStudents } = dashboard;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">My Courses</span>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{assignedCourses.length}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Total Students</span>
            </div>
            <p className="text-2xl font-bold text-secondary mt-1">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card className="py-4 col-span-2 md:col-span-1">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-destructive" />
              <span className="text-xs text-muted-foreground">At-Risk Students</span>
            </div>
            <p className="text-2xl font-bold text-destructive mt-1">{atRiskStudents.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action - Generate Exam */}
      <Card className="py-4">
        <CardContent className="px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-secondary/10">
              <FileText className="size-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Exam Generator</p>
              <p className="text-xs text-muted-foreground">Generate exam papers with AI-powered question generation</p>
            </div>
          </div>
          <Button onClick={() => navigate('/ai/exam-generator')}>
            Generate Exam
            <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Assigned Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Assigned Courses
          </CardTitle>
          <CardDescription>Courses you are currently teaching</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedCourses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-12 text-muted-foreground" />}
              title="No Courses Assigned"
              description="You don't have any courses assigned yet."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedCourses.map((course) => (
                <Card key={course.id} className="py-4 shadow-none border">
                  <CardContent className="px-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary">{course.code}</p>
                        <p className="text-sm font-medium">{course.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      <span>{course.enrolledCount}/{course.maxCapacity} students</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-destructive" />
            At-Risk Students
          </CardTitle>
          <CardDescription>Students who may need additional academic support</CardDescription>
        </CardHeader>
        <CardContent>
          {atRiskStudents.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="size-12 text-success" />}
              title="All Students Performing Well"
              description="No at-risk students detected in your courses."
            />
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Programme</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right hidden md:table-cell">GPA</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Risk Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.studentId}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{student.programme}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${getRiskLevelDot(student.riskLevel)}`} />
                          <Badge className={getRiskLevelColor(student.riskLevel)}>
                            {student.riskLevel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell">{student.gpa.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono hidden md:table-cell">{student.riskScore}/100</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={assessingId === student.id}
                          onClick={() => handleRunAssessment(student.id)}
                        >
                          {assessingId === student.id ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Running
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="size-3.5" />
                              Run Assessment
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}