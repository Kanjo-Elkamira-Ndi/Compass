import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getLecturerDashboard, getLecturerTimetable } from '@/api/client';
import type { Course, LecturerTimetable } from '@/types';
import {
  BookOpen,
  Users,
  Clock,
  MapPin,
  Calendar,
  Beaker,
  FlaskConical,
  Presentation,
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 – 09:00',
  '09:00 – 10:00',
  '10:00 – 11:00',
  '11:00 – 12:00',
  '12:00 – 13:00',
  '13:00 – 14:00',
  '14:00 – 15:00',
  '15:00 – 16:00',
  '16:00 – 17:00',
];

function getTypeStyle(type: 'lecture' | 'lab' | 'tutorial') {
  switch (type) {
    case 'lecture':
      return 'bg-primary/10 border-primary/30 text-primary';
    case 'lab':
      return 'bg-secondary/10 border-secondary/30 text-secondary';
    case 'tutorial':
      return 'bg-warning/10 border-warning/30 text-warning';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
}

function getTypeIcon(type: 'lecture' | 'lab' | 'tutorial') {
  switch (type) {
    case 'lecture':
      return <Presentation className="size-3.5" />;
    case 'lab':
      return <Beaker className="size-3.5" />;
    case 'tutorial':
      return <FlaskConical className="size-3.5" />;
    default:
      return null;
  }
}

function getTypeBadgeVariant(type: 'lecture' | 'lab' | 'tutorial'): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'lecture': return 'default';
    case 'lab': return 'secondary';
    case 'tutorial': return 'outline';
    default: return 'outline';
  }
}

export function LecturerCourses() {
  const { user } = useAuth();
  const [coursesState, setCoursesState] = useState<'loading' | 'error' | 'data'>('loading');
  const [coursesError, setCoursesError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);

  const [timetableState, setTimetableState] = useState<'loading' | 'error' | 'data'>('loading');
  const [timetableError, setTimetableError] = useState('');
  const [timetable, setTimetable] = useState<LecturerTimetable[]>([]);

  const retryCourses = async () => {
    setCoursesState('loading');
    setCoursesError('');
    try {
      const res = await getLecturerDashboard(user!.id);
      setCourses(res.data.assignedCourses);
      setCoursesState('data');
    } catch (err) {
      setCoursesError(err instanceof Error ? err.message : 'Failed to load courses.');
      setCoursesState('error');
    }
  };

  const retryTimetable = async () => {
    setTimetableState('loading');
    setTimetableError('');
    try {
      const res = await getLecturerTimetable();
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
    Promise.all([
      getLecturerDashboard(user.id),
      getLecturerTimetable(),
    ]).then(([coursesRes, timetableRes]) => {
      if (!cancelled) {
        setCourses(coursesRes.data.assignedCourses);
        setCoursesState('data');
        setTimetable(timetableRes.data);
        setTimetableState('data');
      }
    }).catch(err => {
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

  // Build a lookup map: day -> time -> slot
  const timetableMap = new Map<string, Map<string, (typeof timetable)[number]['slots'][number]>>();
  for (const day of timetable) {
    const slotMap = new Map<string, (typeof timetable)[number]['slots'][number]>();
    for (const slot of day.slots) {
      slotMap.set(slot.time, slot);
    }
    timetableMap.set(day.day, slotMap);
  }

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="py-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default">{course.code}</Badge>
                        <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                      </div>
                      <p className="font-semibold text-sm">{course.name}</p>
                      <p className="text-xs text-muted-foreground">{course.description}</p>
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5" />
                        <span>{course.enrolledCount}/{course.maxCapacity} students enrolled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5" />
                        <span>Semester {course.semester}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-3.5" />
                        <span>{course.programme}</span>
                      </div>
                    </div>
                    {/* Capacity bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Capacity</span>
                        <span>{Math.round((course.enrolledCount / course.maxCapacity) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Timetable Tab */}
        <TabsContent value="timetable" className="mt-4">
          {timetableState === 'loading' ? (
            <LoadingState />
          ) : timetableState === 'error' ? (
            <ErrorState message={timetableError} onRetry={retryTimetable} />
          ) : timetable.length === 0 ? (
            <EmptyState
              icon={<Clock className="size-12 text-muted-foreground" />}
              title="No Timetable"
              description="Your weekly timetable is not available yet."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5 text-primary" />
                  Weekly Timetable
                </CardTitle>
                <CardDescription>Your teaching schedule for the current semester</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-sm bg-primary/20 border border-primary/30" />
                    <span>Lecture</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-sm bg-secondary/20 border border-secondary/30" />
                    <span>Lab</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3 rounded-sm bg-warning/20 border border-warning/30" />
                    <span>Tutorial</span>
                  </div>
                </div>

                {/* Desktop Grid */}
                <div className="hidden lg:block overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-[100px_repeat(5,1fr)] border rounded-lg overflow-hidden">
                      {/* Header Row */}
                      <div className="bg-muted/50 px-3 py-2 text-xs font-medium border-b border-r" />
                      {DAYS.map(day => (
                        <div key={day} className="bg-muted/50 px-3 py-2 text-xs font-medium text-center border-b border-r last:border-r-0">
                          {day}
                        </div>
                      ))}

                      {/* Time Slots */}
                      {TIME_SLOTS.map(time => (
                        <>
                          <div key={time} className="px-3 py-2 text-xs text-muted-foreground font-mono border-b border-r flex items-center">
                            {time}
                          </div>
                          {DAYS.map(day => {
                            const dayMap = timetableMap.get(day);
                            const slot = dayMap?.get(time);
                            const hasClass = !!slot;
                            return (
                              <div
                                key={`${day}-${time}`}
                                className={`px-2 py-2 border-b border-r last:border-r-0 min-h-[56px] ${
                                  hasClass ? '' : ''
                                }`}
                              >
                                {slot ? (
                                  <div className={`rounded-md border p-2 ${getTypeStyle(slot.type)}`}>
                                    <p className="font-semibold text-xs">{slot.courseCode}</p>
                                    <p className="text-[10px] opacity-80 leading-tight">{slot.courseName}</p>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
                                      <MapPin className="size-2.5" />
                                      {slot.room}
                                    </div>
                                    <Badge
                                      variant={getTypeBadgeVariant(slot.type)}
                                      className="mt-1 text-[9px] px-1.5 py-0"
                                    >
                                      {slot.type}
                                    </Badge>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile: Day-by-day cards */}
                <div className="space-y-4 lg:hidden">
                  {DAYS.map(day => {
                    const dayData = timetable.find(t => t.day === day);
                    if (!dayData || dayData.slots.length === 0) return null;
                    return (
                      <Card key={day} className="py-0">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            <p className="font-semibold text-sm">{day}</p>
                          </div>
                          <div className="space-y-2">
                            {dayData.slots.map((slot, i) => (
                              <div key={i} className={`rounded-md border p-3 ${getTypeStyle(slot.type)}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      {getTypeIcon(slot.type)}
                                      <p className="font-semibold text-xs">{slot.courseCode}</p>
                                      <Badge variant={getTypeBadgeVariant(slot.type)} className="text-[9px] px-1.5 py-0">
                                        {slot.type}
                                      </Badge>
                                    </div>
                                    <p className="text-xs opacity-80">{slot.courseName}</p>
                                  </div>
                                  <span className="text-[10px] font-mono opacity-70 shrink-0">{slot.time}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-70">
                                  <MapPin className="size-2.5" />
                                  {slot.room}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}