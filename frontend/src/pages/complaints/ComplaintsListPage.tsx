import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { ComplaintStatusBadge } from '@/components/complaints/status-badge';
import { ComplaintPriorityBadge } from '@/components/complaints/priority-badge';
import { ComplaintForm } from '@/components/complaints/complaint-form';
import { getComplaints } from '@/api/complaints';
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintSummary,
  Role,
} from '@/types';
import { format } from 'date-fns';

const CATEGORY_FILTERS: { value: ComplaintCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'EXAMINATION', label: 'Examination' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_FILTERS: { value: ComplaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_FILTERS: { value: ComplaintPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const PAGE_SIZE = 10;

const ROLE_TITLES: Record<Role, string> = {
  STUDENT: 'My Complaints',
  LECTURER: 'Assigned Complaints',
  ADMIN: 'All Complaints',
};

export function ComplaintsListPage({ role }: { role: Role }) {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [formOpen, setFormOpen] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComplaints({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        page,
        size: PAGE_SIZE,
      });
      setComplaints(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
      setTotalElements(res.data?.totalElements ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints.');
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, categoryFilter, priorityFilter, page]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const detailPath = (id: string) => `/${role.toLowerCase()}/complaints/${id}`;

  if (error) return <ErrorState message={error} onRetry={fetchComplaints} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{ROLE_TITLES[role]}</h2>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">{totalElements} complaint(s)</span>
          )}
        </div>
        {role === 'STUDENT' && (
          <Button onClick={() => setFormOpen(true)} className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Submit Complaint
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by subject or description..."
                className="pl-9"
                aria-label="Search complaints"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ComplaintStatus | 'all'); setPage(0); }}>
              <SelectTrigger className="w-full lg:w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as ComplaintCategory | 'all'); setPage(0); }}>
              <SelectTrigger className="w-full lg:w-44" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTERS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v as ComplaintPriority | 'all'); setPage(0); }}>
              <SelectTrigger className="w-full lg:w-40" aria-label="Filter by priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_FILTERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-12 w-12 text-muted-foreground" />}
              title="No complaints found"
              description={
                role === 'STUDENT'
                  ? "You haven't submitted any complaints yet."
                  : 'No complaints match your filters.'
              }
              action={
                role === 'STUDENT'
                  ? { label: 'Submit a complaint', onClick: () => setFormOpen(true) }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Filed By</TableHead>
                    <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Replies</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      className="cursor-pointer"
                      onClick={() => navigate(detailPath(complaint.id))}
                      aria-label={`Open complaint: ${complaint.subject}`}
                    >
                      <TableCell className="font-medium">{complaint.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {complaint.category.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <ComplaintPriorityBadge priority={complaint.priority} />
                      </TableCell>
                      <TableCell>
                        <ComplaintStatusBadge status={complaint.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {complaint.anonymous ? 'Anonymous' : complaint.studentName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {complaint.assigneeName || '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                        {complaint.replyCount}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && complaints.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} of {Math.max(totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ComplaintForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={(complaint) => navigate(detailPath(complaint.id))}
      />
    </div>
  );
}
