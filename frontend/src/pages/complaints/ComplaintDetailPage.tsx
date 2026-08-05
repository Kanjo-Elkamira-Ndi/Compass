import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Clock,
  Loader2,
  Lock,
  User,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/states';
import { ComplaintStatusBadge } from '@/components/complaints/status-badge';
import { ComplaintPriorityBadge } from '@/components/complaints/priority-badge';
import { STATUS_LABELS } from '@/lib/complaint-labels';
import { ReplyComposer } from '@/components/complaints/reply-composer';
import { AttachmentList } from '@/components/complaints/attachment-list';
import {
  assignComplaint,
  getComplaint,
  getLecturers,
  updateComplaintStatus,
} from '@/api/complaints';
import { useAuth } from '@/contexts/auth-context';
import type { Complaint, ComplaintStatus, LecturerSummary, Role } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const NEXT_TRANSITIONS: Partial<Record<ComplaintStatus, ComplaintStatus>> = {
  SUBMITTED: 'IN_PROGRESS',
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: 'CLOSED',
};

export function ComplaintDetailPage({ role }: { role: Role }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lecturers, setLecturers] = useState<LecturerSummary[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const listPath = `/${role.toLowerCase()}/complaints`;

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComplaint(id);
      setComplaint(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaint.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const fetchLecturers = useCallback(async () => {
    if (role !== 'ADMIN') return;
    try {
      const res = await getLecturers();
      setLecturers(res.data);
    } catch {
      // lecturers list is best-effort
    }
  }, [role]);

  useEffect(() => {
    fetchLecturers();
  }, [fetchLecturers]);

  useEffect(() => {
    if (role === 'ADMIN' && complaint?.assignedTo) {
      setSelectedLecturer(complaint.assignedTo);
    }
  }, [role, complaint?.assignedTo]);

  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;

  if (isLoading || !complaint) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isAdmin = role === 'ADMIN';
  const isAssignedLecturer = role === 'LECTURER' && complaint.assignedTo === user?.id;
  const canManage = isAdmin || isAssignedLecturer;
  const isClosed = complaint.status === 'CLOSED';
  const nextTransition = NEXT_TRANSITIONS[complaint.status];

  const handleStatusTransition = async () => {
    if (!nextTransition) return;
    setIsUpdating(true);
    try {
      const res = await updateComplaintStatus(complaint.id, nextTransition, resolution || undefined);
      setComplaint(res.data);
      toast.success(`Complaint marked as ${STATUS_LABELS[nextTransition]}.`);
      setResolveOpen(false);
      setResolution('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedLecturer) return;
    setIsAssigning(true);
    try {
      const res = await assignComplaint(complaint.id, selectedLecturer);
      setComplaint(res.data);
      toast.success('Complaint assigned successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign complaint.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-2 text-muted-foreground" onClick={() => navigate(listPath)}>
          <ArrowLeft className="h-4 w-4" />
          Back to complaints
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{complaint.subject}</h2>
          <ComplaintStatusBadge status={complaint.status} />
          <ComplaintPriorityBadge priority={complaint.priority} />
        </div>
        <p className="text-sm text-muted-foreground">
          Filed {format(new Date(complaint.createdAt), 'MMM d, yyyy HH:mm')}
          {complaint.updatedAt && ` · Last updated ${format(new Date(complaint.updatedAt), 'MMM d, yyyy HH:mm')}`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {complaint.anonymous ? 'Anonymous' : complaint.studentName}
                </span>
                {!complaint.anonymous && complaint.studentNumber && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    {complaint.studentNumber}
                  </span>
                )}
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {complaint.category.replace('_', ' ')}
                </span>
                {complaint.assigneeName && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <UserCheck className="h-4 w-4" />
                    Assigned to {complaint.assigneeName}
                  </span>
                )}
              </div>
              {complaint.anonymous && (
                <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  This complaint was submitted anonymously.
                </p>
              )}
              <Separator />
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{complaint.description}</p>
              {complaint.attachments.length > 0 && (
                <>
                  <Separator />
                  <AttachmentList complaintId={complaint.id} attachments={complaint.attachments} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Resolution */}
          {complaint.resolution && (
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{complaint.resolution}</p>
              </CardContent>
            </Card>
          )}

          {/* Replies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                <ul className="space-y-4">
                  {complaint.replies.map((reply) => (
                    <li key={reply.id}>
                      <div className="rounded-lg border p-4">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{reply.authorName}</span>
                          <span>{reply.authorRole?.toLowerCase()}</span>
                          <span>·</span>
                          <span>{format(new Date(reply.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!isClosed && (
                <Separator />
              )}
              {!isClosed && <ReplyComposer complaint={complaint} role={role} onReplied={setComplaint} />}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Staff actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextTransition && !isClosed && (
                  nextTransition === 'RESOLVED' ? (
                    <Button
                      className="w-full gap-2"
                      onClick={() => setResolveOpen(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Resolved
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      onClick={handleStatusTransition}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleDot className="h-4 w-4" />}
                      {nextTransition === 'IN_PROGRESS' ? 'Start Working' : STATUS_LABELS[nextTransition]}
                    </Button>
                  )
                )}

                {isAdmin && !isClosed && (
                  <div className="space-y-2">
                    <Label>Assign to lecturer</Label>
                    <div className="flex gap-2">
                      <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
                        <SelectTrigger className="flex-1" aria-label="Select lecturer">
                          <SelectValue placeholder="Select lecturer" />
                        </SelectTrigger>
                        <SelectContent>
                          {lecturers.map((lecturer) => (
                            <SelectItem key={lecturer.id} value={lecturer.id}>
                              {lecturer.name} — {lecturer.department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={handleAssign} disabled={isAssigning || !selectedLecturer}>
                        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                        Assign
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {complaint.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No status changes yet.</p>
              ) : (
                <ol className="space-y-3">
                  {complaint.statusHistory.map((entry, index) => (
                    <li key={entry.id} className="relative flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          'mt-1 flex size-2 shrink-0 rounded-full',
                          index === complaint.statusHistory.length - 1 ? 'bg-primary' : 'bg-muted-foreground/40',
                        )} />
                        {index < complaint.statusHistory.length - 1 && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm">
                          {entry.fromStatus
                            ? `${STATUS_LABELS[entry.fromStatus]} → ${STATUS_LABELS[entry.toStatus]}`
                            : `Filed as ${STATUS_LABELS[entry.toStatus]}`}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {entry.changedByName} · {format(new Date(entry.changedAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Resolved</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="resolution-text">Resolution</Label>
            <Textarea
              id="resolution-text"
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how this complaint was resolved"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusTransition} disabled={isUpdating || !resolution.trim()}>
              {isUpdating ? 'Updating...' : 'Resolve Complaint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
