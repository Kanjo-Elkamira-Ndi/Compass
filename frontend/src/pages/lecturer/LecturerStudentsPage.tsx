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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingState, ErrorState, EmptyState, getRiskLevelColor, getRiskLevelDot } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getLecturerStudents, getCourses, submitGrade, runRiskAssessment } from '@/api/client';
import type { AtRiskStudent, Course } from '@/types';
import { toast } from 'sonner';
import {
  Users,
  ShieldAlert,
  PenLine,
  Loader2,
  GraduationCap,
} from 'lucide-react';

const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
const gpaPointsMap: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

export function LecturerStudents() {
  const { user } = useAuth();
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [assessingId, setAssessingId] = useState<string | null>(null);

  // Grade dialog state
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const retryStudents = async () => {
    setState('loading');
    setError('');
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        getLecturerStudents(),
        getCourses(),
      ]);
      setStudents(studentsRes.data);
      setCourses(coursesRes.data);
      setState('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students.');
      setState('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getLecturerStudents(),
      getCourses(),
    ]).then(([studentsRes, coursesRes]) => {
      if (!cancelled) {
        setStudents(studentsRes.data);
        setCourses(coursesRes.data);
        setState('data');
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load students.');
        setState('error');
      }
    });
    return () => { cancelled = true; };
  }, []);

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

  const openGradeDialog = (student: AtRiskStudent) => {
    setSelectedStudent(student);
    setSelectedCourseId('');
    setSelectedGrade('');
    setGradeDialogOpen(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedStudent || !selectedCourseId || !selectedGrade) return;
    setSubmittingGrade(true);
    try {
      const gpaPoints = gpaPointsMap[selectedGrade] ?? 0;
      const res = await submitGrade(selectedStudent.id, selectedCourseId, selectedGrade, gpaPoints);
      toast.success(res.message || 'Grade submitted successfully.');
      setGradeDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit grade.');
    } finally {
      setSubmittingGrade(false);
    }
  };

  if (state === 'loading') return <LoadingState />;
  if (state === 'error') return <ErrorState message={error} onRetry={retryStudents} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            All Students
          </CardTitle>
          <CardDescription>Manage students and their academic records</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="size-12 text-muted-foreground" />}
              title="No Students Found"
              description="There are no students in the system yet."
            />
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Programme</TableHead>
                    <TableHead className="hidden md:table-cell text-right">GPA</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{student.studentId}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{student.programme}</TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono">{student.gpa.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`size-2 rounded-full ${getRiskLevelDot(student.riskLevel)}`} />
                          <Badge className={getRiskLevelColor(student.riskLevel)}>
                            {student.riskLevel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={assessingId === student.id}
                            onClick={() => handleRunAssessment(student.id)}
                          >
                            {assessingId === student.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <ShieldAlert className="size-3.5" />
                            )}
                            <span className="hidden lg:inline">Assess</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGradeDialog(student)}
                          >
                            <PenLine className="size-3.5" />
                            <span className="hidden lg:inline">Grade</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Entry Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Grade</DialogTitle>
            <DialogDescription>
              Submit a grade for {selectedStudent?.name} ({selectedStudent?.studentId})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} — {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedCourseId || !selectedGrade || submittingGrade}
              onClick={handleSubmitGrade}
            >
              {submittingGrade ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Grade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}