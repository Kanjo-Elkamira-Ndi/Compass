import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ComplaintPriority } from '@/types';
import { cn } from '@/lib/utils';

const priorityStyles: Record<ComplaintPriority, string> = {
  LOW: 'bg-muted text-muted-foreground border-border',
  MEDIUM: 'bg-primary/10 text-primary border-primary/20',
  HIGH: 'bg-warning/10 text-warning border-warning/20',
  URGENT: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface ComplaintPriorityBadgeProps {
  priority: ComplaintPriority;
  className?: string;
}

export function ComplaintPriorityBadge({ priority, className }: ComplaintPriorityBadgeProps) {
  return (
    <Badge className={cn('text-xs', priorityStyles[priority], className)}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}
