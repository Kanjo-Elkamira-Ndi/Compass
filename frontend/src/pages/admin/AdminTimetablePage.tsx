import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Loader2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { LoadingState, ErrorState } from '@/components/shared/states';
import { WeeklyTimetable } from '@/components/timetable/WeeklyTimetable';
import { getAdminCourses, getAllAvailability, generateTimetable, getTimetable } from '@/api/client';
import type { Course, LecturerAvailabilityGroup, LecturerTimetable, GenerateTimetableResult } from '@/types';
import { toast } from 'sonner';

export function AdminTimetable() {
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [availability, setAvailability] = useState<LecturerAvailabilityGroup[]>([]);
  const [timetable, setTimetable] = useState<LecturerTimetable[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateTimetableResult | null>(null);

  const load = useCallback(async () => {
    try {
      const [coursesRes, availabilityRes, timetableRes] = await Promise.all([
        getAdminCourses(),
        getAllAvailability(),
        getTimetable(),
      ]);
      setCourses(coursesRes.data);
      setAvailability(availabilityRes.data);
      setTimetable(timetableRes.data);
      setState('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timetable data.');
      setState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await generateTimetable();
      setResult(res.data);
      toast.success(res.message || `${res.data.scheduled} courses scheduled.`);
      const [coursesRes, timetableRes] = await Promise.all([getAdminCourses(), getTimetable()]);
      setCourses(coursesRes.data);
      setTimetable(timetableRes.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate timetable.');
    } finally {
      setGenerating(false);
    }
  };

  if (state === 'loading') return <LoadingState />;
  if (state === 'error') return <ErrorState message={error} onRetry={load} />;

  const assignedCourses = courses.filter(c => c.lecturerId);
  const unassignedCourses = courses.filter(c => !c.lecturerId);
  const lecturersWithAvailability = availability.filter(a => a.slots.length > 0).length;
  const scheduledCount = timetable.reduce((acc, day) => acc + day.slots.length, 0);

  const availabilityByLecturerId = new Map(availability.map(a => [a.lecturerId, a]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Timetable Generation</h2>
        </div>
        <Button onClick={handleGenerate} disabled={generating} className="gap-2 w-fit">
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate Timetable
            </>
          )}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Assigned Courses</p>
            <p className="text-2xl font-bold text-primary mt-1">{assignedCourses.length}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Lecturers w/ Availability</p>
            <p className="text-2xl font-bold text-secondary mt-1">{lecturersWithAvailability}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Courses Scheduled</p>
            <p className="text-2xl font-bold text-success mt-1">{scheduledCount}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Unassigned Courses</p>
            <p className="text-2xl font-bold text-warning mt-1">{unassignedCourses.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Generation result */}
      {result && (
        <Card className="py-4 border-success/40">
          <CardContent className="px-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-8 text-success" />
              <div>
                <p className="text-sm font-semibold">Timetable generated</p>
                <p className="text-xs text-muted-foreground">
                  {result.scheduled} course{result.scheduled === 1 ? '' : 's'} scheduled
                  {result.skipped.length > 0 ? ` · ${result.skipped.length} skipped` : ''}
                </p>
              </div>
            </div>
            {result.skipped.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Skipped: {result.skipped.join(', ')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lecturer coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lecturer Coverage</CardTitle>
          <CardDescription>Assigned courses vs availability slots — only ready lecturers are scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lecturer</TableHead>
                  <TableHead className="hidden sm:table-cell">Assigned Courses</TableHead>
                  <TableHead>Availability Slots</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availability.map(lecturer => {
                  const assignedCount = courses.filter(c => c.lecturerId === lecturer.lecturerId).length;
                  return (
                    <TableRow key={lecturer.lecturerId}>
                      <TableCell className="font-medium">{lecturer.lecturerName}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{assignedCount}</TableCell>
                      <TableCell className="text-muted-foreground">{lecturer.slots.length}</TableCell>
                      <TableCell>
                        {lecturer.slots.length > 0 ? (
                          <Badge className="bg-success/10 text-success border-success/20">Ready</Badge>
                        ) : (
                          <Badge className="bg-warning/10 text-warning border-warning/20">Needs Availability</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled courses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Assignments</CardTitle>
          <CardDescription>Time slot assigned to each course (from the generated timetable)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="hidden sm:table-cell">Title</TableHead>
                  <TableHead className="hidden md:table-cell">Lecturer</TableHead>
                  <TableHead>Slot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses
                  .filter(c => c.timetableSlot)
                  .map(course => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-sm font-medium">{course.code}</TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[220px] truncate">{course.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{course.lecturerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {course.timetableSlot}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Full timetable */}
      <WeeklyTimetable
        timetable={timetable}
        title="Generated Timetable"
        description="Complete timetable across all programmes"
      />
    </div>
  );
}
