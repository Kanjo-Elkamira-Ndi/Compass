import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ComplaintStatus } from '@/types';
import { cn } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/complaint-labels';

const statusStyles: Record<ComplaintStatus, string> = {
  SUBMITTED: 'bg-muted text-muted-foreground border-border',
  ASSIGNED: 'bg-primary/10 text-primary border-primary/20',
  IN_PROGRESS: 'bg-ai/10 text-ai border-ai/20',
  RESOLVED: 'bg-success/10 text-success border-success/20',
  CLOSED: 'bg-secondary/10 text-secondary border-secondary/20',
};

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
  className?: string;
}

export function ComplaintStatusBadge({ status, className }: ComplaintStatusBadgeProps) {
  return (
    <Badge className={cn('text-xs', statusStyles[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
