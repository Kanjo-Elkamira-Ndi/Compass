import React from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  className?: string;
  rows?: number;
}

export function LoadingState({ className = '', rows = 3 }: LoadingStateProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export function CardLoadingState({ className = '', cards = 3 }: { className?: string; cards?: number }) {
  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = 'Something went wrong.', onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">Error</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" aria-label="Retry loading data">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {icon || <Inbox className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && (
        <Button onClick={action.onClick} aria-label={action.label}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Risk level badge helper
export function getRiskLevelColor(level: string) {
  switch (level) {
    case 'Excellent': return 'bg-success/10 text-success border-success/20';
    case 'Passing': return 'bg-primary/10 text-primary border-primary/20';
    case 'At-Risk': return 'bg-warning/10 text-warning border-warning/20';
    case 'Critical': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export function getRiskLevelDot(level: string) {
  switch (level) {
    case 'Excellent': return 'bg-success';
    case 'Passing': return 'bg-primary';
    case 'At-Risk': return 'bg-warning';
    case 'Critical': return 'bg-destructive';
    default: return 'bg-muted-foreground';
  }
}