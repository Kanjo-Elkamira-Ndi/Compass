import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, LoadingState, getRiskLevelColor } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getRiskAssessment, runRiskAssessment } from '@/api/client';
import type { RiskAssessment } from '@/types';
import { format } from 'date-fns';

export function AIRisk() {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRiskAssessment(user.id);
      setAssessment(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk assessment');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const handleRunAssessment = async () => {
    if (!user?.id || isRunning) return;
    setIsRunning(true);
    setError(null);
    try {
      const res = await runRiskAssessment(user.id);
      setAssessment(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run assessment');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Risk badge skeleton */}
        <Card>
          <CardContent className="p-6 flex items-center gap-6">
            <Skeleton className="h-28 w-28 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
        {/* Progress bars skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !assessment) {
    return <ErrorState message={error} onRetry={fetchAssessment} />;
  }

  if (!assessment) return null;

  const riskColors: Record<string, string> = {
    Excellent: 'bg-success/15 text-success border-success/30',
    Passing: 'bg-primary/15 text-primary border-primary/30',
    'At-Risk': 'bg-warning/15 text-warning border-warning/30',
    Critical: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  const riskIcons: Record<string, React.ReactNode> = {
    Excellent: <ShieldCheck className="h-5 w-5" />,
    Passing: <CheckCircle2 className="h-5 w-5" />,
    'At-Risk': <AlertTriangle className="h-5 w-5" />,
    Critical: <XCircle className="h-5 w-5" />,
  };

  const factorStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'danger': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-success/10 text-success border-success/20',
  };

  // Circular progress for score
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (assessment.score / 100) * circumference;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Risk Level Display */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular progress */}
            <div className="relative shrink-0">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle cx="56" cy="56" r="40" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
                <circle
                  cx="56" cy="56" r="40" fill="none"
                  className={
                    assessment.level === 'Excellent' ? 'text-success' :
                    assessment.level === 'Passing' ? 'text-primary' :
                    assessment.level === 'At-Risk' ? 'text-warning' :
                    'text-destructive'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{assessment.score}</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <Badge className={`text-base px-4 py-1.5 border ${riskColors[assessment.level]}`}>
                  {riskIcons[assessment.level]}
                  <span className="ml-1.5">{assessment.level}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Overall academic risk assessment score
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {format(new Date(assessment.lastUpdated), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            </div>

            <Button
              onClick={handleRunAssessment}
              disabled={isRunning}
              className="shrink-0 gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Assessing...' : 'Run New Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contributing Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contributing Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {assessment.factors.map((factor, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {factorStatusIcon(factor.status)}
                  <span className="text-sm font-medium">{factor.name}</span>
                  <span className="text-xs text-muted-foreground">({factor.weight}%)</span>
                </div>
                <span className="text-sm font-semibold">{factor.value}/100</span>
              </div>
              <Progress
                value={factor.value}
                className={`h-2.5 ${
                  factor.status === 'good' ? '[&>div]:bg-success' :
                  factor.status === 'warning' ? '[&>div]:bg-warning' :
                  '[&>div]:bg-destructive'
                }`}
              />
              <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
              {i < assessment.factors.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.recommendedActions.map(action => (
            <div
              key={action.id}
              className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={`text-xs ${priorityColors[action.priority]}`}>
                    {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{action.category}</Badge>
                </div>
                <h4 className="font-medium text-sm">{action.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}