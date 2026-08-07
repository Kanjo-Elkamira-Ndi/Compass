import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/states';
import { WeeklyTimetable } from '@/components/timetable/WeeklyTimetable';
import { useAuth } from '@/contexts/auth-context';
import { getLecturerCourses, getCourseStudents, getTimetable } from '@/api/client';
import type { Course, Student, LecturerTimetable } from '@/types';
import {
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  IdCard,
} from 'lucide-react';

export function LecturerCourses() {
  const { user } = useAuth();
  const [coursesState, setCoursesState] = useState<'loading' | 'error' | 'data'>('loading');
  const [coursesError, setCoursesError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsByCourse, setStudentsByCourse] = useState<Record<string, Student[]>>({});
  const [studentsState, setStudentsState] = useState<'loading' | 'error' | 'data'>('loading');
  const [studentsError, setStudentsError] = useState('');

  const [timetableState, setTimetableState] = useState<'loading' | 'error' | 'data'>('loading');
  const [timetableError, setTimetableError] = useState('');
  const [timetable, setTimetable] = useState<LecturerTimetable[]>([]);

  const loadCourses = async (): Promise<Course[]> => {
    const res = await getLecturerCourses(user!.id);
    setCourses(res.data);
    setCoursesState('data');
    return res.data;
  };

  const loadStudents = async (courseList: Course[]) => {
    setStudentsState('loading');
    setStudentsError('');
    try {
      const results = await Promise.all(courseList.map((c) => getCourseStudents(c.id)));
      const map: Record<string, Student[]> = {};
      courseList.forEach((c, i) => {
        map[c.id] = results[i].data;
      });
      setStudentsByCourse(map);
      setStudentsState('data');
    } catch (err) {
      setStudentsError(err instanceof Error ? err.message : 'Failed to load students.');
      setStudentsState('error');
    }
  };

  const retryCourses = async () => {
    setCoursesState('loading');
    setCoursesError('');
    try {
      const courseList = await loadCourses();
      await loadStudents(courseList);
    } catch (err) {
      setCoursesError(err instanceof Error ? err.message : 'Failed to load courses.');
      setCoursesState('error');
    }
  };

  const retryStudents = () => loadStudents(courses);

  const retryTimetable = async () => {
    setTimetableState('loading');
    setTimetableError('');
    try {
      const res = await getTimetable();
      setTimetable(res.data);
      setTimetableState('data');
    } catch (err) {
      setTimetableError(err instanceof Error ? err.message : 'Failed to load timetable.');
      setTimetableState('error');
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([getLecturerCourses(user.id), getTimetable()])
      .then(async ([coursesRes, timetableRes]) => {
        if (cancelled) return;
        setCourses(coursesRes.data);
        setCoursesState('data');
        setTimetable(timetableRes.data);
        setTimetableState('data');
        try {
          const results = await Promise.all(coursesRes.data.map((c) => getCourseStudents(c.id)));
          if (cancelled) return;
          const map: Record<string, Student[]> = {};
          coursesRes.data.forEach((c, i) => {
            map[c.id] = results[i].data;
          });
          setStudentsByCourse(map);
          setStudentsState('data');
        } catch (err) {
          if (!cancelled) {
            setStudentsError(err instanceof Error ? err.message : 'Failed to load students.');
            setStudentsState('error');
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load data.';
          setCoursesError(msg);
          setCoursesState('error');
          setTimetableError(msg);
          setTimetableState('error');
        }
      });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        {/* My Courses Tab */}
        <TabsContent value="courses" className="mt-4">
          {coursesState === 'loading' ? (
            <LoadingState />
          ) : coursesState === 'error' ? (
            <ErrorState message={coursesError} onRetry={retryCourses} />
          ) : courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-12 text-muted-foreground" />}
              title="No Courses Assigned"
              description="You don't have any courses assigned this semester."
            />
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const roster = studentsByCourse[course.id] ?? [];
                return (
                  <Card key={course.id} className="py-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="default">{course.code}</Badge>
                            <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                          </div>
                          <p className="font-semibold text-sm">{course.name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3.5" />
                              {course.enrolledCount} enrolled
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="size-3.5" />
                              Semester {course.semester}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="size-3.5" />
                              {course.programme}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {studentsState === 'error' ? (
                        <ErrorState message={studentsError} onRetry={retryStudents} />
                      ) : roster.length === 0 ? (
                        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                          No students enrolled yet.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-10">#</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                              <TableHead>Programme</TableHead>
                              <TableHead className="hidden md:table-cell">Year</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {roster.map((student, index) => (
                              <TableRow key={student.id}>
                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <IdCard className="size-3.5" />
                                    {student.studentId}
                                  </span>
                                </TableCell>
                                <TableCell>{student.programme}</TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                  <span className="inline-flex items-center gap-1">
                                    <GraduationCap className="size-3.5" />
                                    Year {student.yearOfStudy}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Timetable Tab */}
        <TabsContent value="timetable" className="mt-4">
          {timetableState === 'loading' ? (
            <LoadingState />
          ) : timetableState === 'error' ? (
            <ErrorState message={timetableError} onRetry={retryTimetable} />
          ) : (
            <WeeklyTimetable
              timetable={timetable}
              title="Weekly Timetable"
              description="Your teaching schedule for the current semester"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
