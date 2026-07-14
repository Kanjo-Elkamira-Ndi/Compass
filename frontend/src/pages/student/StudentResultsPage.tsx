import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getGradeRecords } from '@/api/client';
import type { GradeRecord } from '@/types';
import { TrendingUp, CreditCard, BookOpen, Award } from 'lucide-react';

const semesters = ['All', '2024-2', '2024-1', '2023-2', '2023-1', '2022-2'];

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'bg-success/10 text-success border-success/20';
  if (grade.startsWith('B')) return 'bg-primary/10 text-primary border-primary/20';
  if (grade.startsWith('C')) return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-destructive/10 text-destructive border-destructive/20';
}

export function StudentResults() {
  const { user } = useAuth();
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>('All');

  const loadGrades = async () => {
    setState('loading');
    setError('');
    try {
      const res = await getGradeRecords(user!.id);
      setGrades(res.data);
      setState('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results.');
      setState('error');
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getGradeRecords(user.id).then(res => {
      if (!cancelled) {
        setGrades(res.data);
        setState('data');
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load results.');
        setState('error');
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const filteredGrades = useMemo(() => {
    if (semesterFilter === 'All') return grades;
    return grades.filter(g => g.semester === semesterFilter);
  }, [grades, semesterFilter]);

  const summaryStats = useMemo(() => {
    const data = filteredGrades;
    const totalCredits = data.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = data.reduce((sum, g) => sum + g.gpaPoints * g.credits, 0);
    const gpa = totalCredits > 0 ? weightedSum / totalCredits : 0;
    return {
      gpa: gpa.toFixed(2),
      credits: totalCredits,
      courses: data.length,
    };
  }, [filteredGrades]);

  if (state === 'loading') return <LoadingState />;
  if (state === 'error') return <ErrorState message={error} onRetry={loadGrades} />;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">GPA</span>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{summaryStats.gpa}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Credits</span>
            </div>
            <p className="text-2xl font-bold text-secondary mt-1">{summaryStats.credits}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-success" />
              <span className="text-xs text-muted-foreground">Courses</span>
            </div>
            <p className="text-2xl font-bold text-success mt-1">{summaryStats.courses}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-primary" />
            Academic Results
          </CardTitle>
          <CardDescription>Your grade records across all semesters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Semester:</span>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All semesters" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map(s => (
                  <SelectItem key={s} value={s}>{s === 'All' ? 'All Semesters' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredGrades.length === 0 ? (
            <EmptyState
              icon={<Award className="size-12 text-muted-foreground" />}
              title="No Results"
              description="No grade records found for the selected semester."
            />
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">GPA Points</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-primary">{record.courseCode}</TableCell>
                      <TableCell>{record.courseName}</TableCell>
                      <TableCell className="text-muted-foreground">{record.semester}</TableCell>
                      <TableCell>
                        <Badge className={getGradeColor(record.grade)}>{record.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{record.gpaPoints.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{record.credits}</TableCell>
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