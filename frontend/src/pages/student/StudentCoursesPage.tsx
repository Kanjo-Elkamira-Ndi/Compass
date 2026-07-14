import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getStudentCourses, getCourses, enrollInCourse, dropCourse } from '@/api/client';
import type { Enrollment, Course } from '@/types';
import { toast } from 'sonner';
import { BookOpen, Users, Trash2, Plus, BookPlus } from 'lucide-react';

export function StudentCourses() {
  const { user } = useAuth();
  const [enrollmentsState, setEnrollmentsState] = useState<'loading' | 'error' | 'data'>('loading');
  const [enrollmentsError, setEnrollmentsError] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [coursesState, setCoursesState] = useState<'loading' | 'error' | 'data'>('loading');
  const [coursesError, setCoursesError] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  const [programmeFilter, setProgrammeFilter] = useState<string>('all');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  const retryEnrollments = async () => {
    setEnrollmentsState('loading');
    setEnrollmentsError('');
    try {
      const res = await getStudentCourses(user!.id);
      setEnrollments(res.data);
      setEnrollmentsState('data');
    } catch (err) {
      setEnrollmentsError(err instanceof Error ? err.message : 'Failed to load enrollments.');
      setEnrollmentsState('error');
    }
  };

  const retryCourses = async () => {
    setCoursesState('loading');
    setCoursesError('');
    try {
      const res = await getCourses();
      setAvailableCourses(res.data);
      setCoursesState('data');
    } catch (err) {
      setCoursesError(err instanceof Error ? err.message : 'Failed to load courses.');
      setCoursesState('error');
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      getStudentCourses(user.id),
      getCourses(),
    ]).then(([enrollmentsRes, coursesRes]) => {
      if (!cancelled) {
        setEnrollments(enrollmentsRes.data);
        setEnrollmentsState('data');
        setAvailableCourses(coursesRes.data);
        setCoursesState('data');
      }
    }).catch(err => {
      if (!cancelled) {
        const msg = err instanceof Error ? err.message : 'Failed to load data.';
        setEnrollmentsError(msg);
        setEnrollmentsState('error');
        setCoursesError(msg);
        setCoursesState('error');
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  const handleDrop = async (enrollmentId: string) => {
    setDroppingId(enrollmentId);
    try {
      const res = await dropCourse(enrollmentId);
      toast.success(res.message || 'Course dropped successfully.');
      retryEnrollments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to drop course.');
    } finally {
      setDroppingId(null);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      const res = await enrollInCourse(user!.id, courseId);
      toast.success(res.message || 'Successfully enrolled.');
      retryEnrollments();
      retryCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll.');
    } finally {
      setEnrollingId(null);
    }
  };

  const programmes = Array.from(new Set(availableCourses.map(c => c.programme)));
  const filteredCourses = programmeFilter === 'all'
    ? availableCourses
    : availableCourses.filter(c => c.programme === programmeFilter);

  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="enrollments">
        <TabsList>
          <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
          <TabsTrigger value="available">Available Courses</TabsTrigger>
        </TabsList>

        {/* My Enrollments Tab */}
        <TabsContent value="enrollments" className="mt-4">
          {enrollmentsState === 'loading' ? (
            <LoadingState />
          ) : enrollmentsState === 'error' ? (
            <ErrorState message={enrollmentsError} onRetry={retryEnrollments} />
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-12 text-muted-foreground" />}
              title="No Enrollments"
              description="You haven't enrolled in any courses yet. Browse available courses to get started."
              action={{ label: 'Browse Courses', onClick: () => {} }}
            />
          ) : (
            <div className="grid gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="py-0">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default">{enrollment.course.code}</Badge>
                        <span className="font-medium text-sm">{enrollment.course.name}</span>
                        <Badge variant="outline" className="text-xs">{enrollment.course.credits} credits</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{enrollment.course.lecturerName} · {enrollment.course.programme}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {enrollment.grade ? (
                        <Badge className="bg-success/10 text-success border-success/20">{enrollment.grade}</Badge>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDrop(enrollment.id)}
                          disabled={droppingId === enrollment.id}
                        >
                          {droppingId === enrollment.id ? 'Dropping...' : (
                            <>
                              <Trash2 className="size-3.5" />
                              Drop
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Courses Tab */}
        <TabsContent value="available" className="mt-4 space-y-4">
          {coursesState === 'loading' ? (
            <LoadingState />
          ) : coursesState === 'error' ? (
            <ErrorState message={coursesError} onRetry={retryCourses} />
          ) : (
            <>
              {/* Programme Filter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Filter by programme:</span>
                <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All programmes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programmes</SelectItem>
                    {programmes.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredCourses.length === 0 ? (
                <EmptyState
                  icon={<BookPlus className="size-12 text-muted-foreground" />}
                  title="No Courses Found"
                  description="No courses match the selected filter. Try a different programme."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const isEnrolled = enrolledCourseIds.has(course.id);
                    const isFull = course.enrolledCount >= course.maxCapacity;

                    return (
                      <Card key={course.id} className="py-0">
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{course.code}</Badge>
                              <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                            </div>
                            <p className="font-medium text-sm">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{course.lecturerName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Users className="size-3.5" />
                              <span>{course.enrolledCount}/{course.maxCapacity} enrolled</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    course.enrolledCount / course.maxCapacity > 0.9
                                      ? 'bg-destructive'
                                      : course.enrolledCount / course.maxCapacity > 0.7
                                        ? 'bg-warning'
                                        : 'bg-success'
                                  }`}
                                  style={{ width: `${(course.enrolledCount / course.maxCapacity) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            variant={isEnrolled ? 'outline' : 'default'}
                            size="sm"
                            className="w-full"
                            disabled={isEnrolled || isFull || enrollingId === course.id}
                            onClick={() => handleEnroll(course.id)}
                          >
                            {isEnrolled ? (
                              <>Already Enrolled</>
                            ) : isFull ? (
                              <>Class Full</>
                            ) : enrollingId === course.id ? (
                              <>Enrolling...</>
                            ) : (
                              <>
                                <Plus className="size-3.5" />
                                Enroll
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}