import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Pencil, GraduationCap, UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { getAdminCourses, createCourse, updateCourse, getAdminUsers } from '@/api/client';
import type { Course, AdminUser, Role } from '@/types';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CourseFormData {
  code: string;
  name: string;
  description: string;
  credits: number;
  lecturerId: string;
  programme: string;
  semester: string;
  maxCapacity: number;
}

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Assign lecturer
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignLecturerId, setAssignLecturerId] = useState('');

  const { register, handleSubmit, reset, setValue, watch } = useForm<CourseFormData>({
    defaultValues: {
      code: '', name: '', description: '', credits: 3,
      lecturerId: '', programme: '', semester: '2024-2', maxCapacity: 40,
    },
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [coursesRes, usersRes] = await Promise.all([getAdminCourses(), getAdminUsers()]);
      setCourses(coursesRes.data);
      setLecturers(usersRes.data.filter(u => u.role === 'LECTURER'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.programme.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingCourse(null);
    reset({
      code: '', name: '', description: '', credits: 3,
      lecturerId: '', programme: '', semester: '2024-2', maxCapacity: 40,
    });
    setFormOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    reset({
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      lecturerId: course.lecturerId,
      programme: course.programme,
      semester: course.semester,
      maxCapacity: course.maxCapacity,
    });
    setFormOpen(true);
  };

  const openAssignDialog = (courseId: string) => {
    setAssignCourseId(courseId);
    const course = courses.find(c => c.id === courseId);
    setAssignLecturerId(course?.lecturerId || '');
    setAssignOpen(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    setIsSaving(true);
    try {
      if (editingCourse) {
        const res = await updateCourse(editingCourse.id, {
          ...data,
          lecturerName: lecturers.find(l => l.id === data.lecturerId)?.name || '',
          enrolledCount: editingCourse.enrolledCount,
        });
        setCourses(prev => prev.map(c => (c.id === editingCourse.id ? res.data : c)));
        toast.success('Course updated successfully.');
      } else {
        const res = await createCourse({
          ...data,
          lecturerName: lecturers.find(l => l.id === data.lecturerId)?.name || '',
          enrolledCount: 0,
        });
        setCourses(prev => [res.data, ...prev]);
        toast.success('Course created successfully.');
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignLecturer = async () => {
    if (!assignCourseId || !assignLecturerId) return;
    setIsSaving(true);
    try {
      const lecturer = lecturers.find(l => l.id === assignLecturerId);
      const res = await updateCourse(assignCourseId, {
        lecturerId: assignLecturerId,
        lecturerName: lecturer?.name || '',
      });
      setCourses(prev => prev.map(c => (c.id === assignCourseId ? res.data : c)));
      toast.success('Lecturer assigned successfully.');
      setAssignOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Course Management</h2>
          <Badge variant="secondary" className="text-xs">{filteredCourses.length} courses</Badge>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code, or programme..."
              className="pl-9"
              aria-label="Search courses"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-12 w-12 text-muted-foreground" />}
              title="No courses found"
              description="Try adjusting your search or create a new course."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Credits</TableHead>
                    <TableHead className="hidden md:table-cell">Lecturer</TableHead>
                    <TableHead className="hidden lg:table-cell">Programme</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="hidden md:table-cell">Semester</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono text-sm font-medium">{course.code}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{course.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{course.credits}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{course.lecturerName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{course.programme}</TableCell>
                      <TableCell>
                        <span className={`text-sm ${course.enrolledCount >= course.maxCapacity ? 'text-destructive font-medium' : ''}`}>
                          {course.enrolledCount}/{course.maxCapacity}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{course.semester}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(course)}
                            aria-label={`Edit ${course.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAssignDialog(course.id)}
                            aria-label={`Assign lecturer to ${course.name}`}
                          >
                            <UserCog className="h-4 w-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-code">Code</Label>
                <Input id="course-code" {...register('code', { required: true })} placeholder="CS101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-credits">Credits</Label>
                <Input id="course-credits" type="number" min={1} max={10}
                  {...register('credits', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-name">Name</Label>
              <Input id="course-name" {...register('name', { required: true })} placeholder="Introduction to Computer Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea id="course-desc" {...register('description')} rows={3} placeholder="Course description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Programme</Label>
                <Input {...register('programme', { required: true })} placeholder="BSc Computer Science" />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Input {...register('semester', { required: true })} placeholder="2024-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lecturer</Label>
                <Select
                  value={watch('lecturerId')}
                  onValueChange={v => setValue('lecturerId', v)}
                >
                  <SelectTrigger aria-label="Select lecturer">
                    <SelectValue placeholder="Select lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-capacity">Max Capacity</Label>
                <Input id="course-capacity" type="number" min={1} max={500}
                  {...register('maxCapacity', { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Lecturer Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Lecturer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={assignCourseId} onValueChange={setAssignCourseId}>
                <SelectTrigger aria-label="Select course">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lecturer</Label>
              <Select value={assignLecturerId} onValueChange={setAssignLecturerId}>
                <SelectTrigger aria-label="Select lecturer">
                  <SelectValue placeholder="Select lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignLecturer} disabled={isSaving || !assignLecturerId}>
              {isSaving ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}