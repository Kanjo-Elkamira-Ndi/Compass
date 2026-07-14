import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Award, Briefcase, DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState, CardLoadingState, ErrorState } from '@/components/shared/states';
import { getCareerRecommendations } from '@/api/client';
import type { CareerRecommendation } from '@/types';

const demandColors: Record<string, string> = {
  High: 'bg-success/10 text-success border-success/20',
  Medium: 'bg-warning/10 text-warning border-warning/20',
  Low: 'bg-destructive/10 text-destructive border-destructive/20',
};

const demandIcons: Record<string, React.ReactNode> = {
  High: <TrendingUp className="h-3.5 w-3.5" />,
  Medium: <Minus className="h-3.5 w-3.5" />,
  Low: <TrendingDown className="h-3.5 w-3.5" />,
};

function getMatchColor(score: number): string {
  if (score >= 85) return 'text-success [&>div]:bg-success';
  if (score >= 70) return 'text-primary [&>div]:bg-primary';
  if (score >= 50) return 'text-warning [&>div]:bg-warning';
  return 'text-destructive [&>div]:bg-destructive';
}

export function AICareer() {
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCareers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCareerRecommendations();
      const sorted = [...res.data].sort((a, b) => b.matchScore - a.matchScore);
      setCareers(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load career recommendations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  if (isLoading) {
    return <CardLoadingState cards={3} className="grid-cols-1 lg:grid-cols-2" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCareers} />;
  }

  if (careers.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="h-12 w-12 text-muted-foreground" />}
        title="No career recommendations yet"
        description="Complete your profile and academic records to receive personalized career recommendations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-ai" />
        <h2 className="text-lg font-semibold">Career Recommendations</h2>
        <span className="text-sm text-muted-foreground">— sorted by match score</span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {careers.map(career => (
          <Card
            key={career.id}
            className="hover:shadow-md transition-shadow border hover:border-ai/30"
          >
            <CardContent className="p-5 space-y-4">
              {/* Match score + title */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold leading-tight">{career.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge className={`text-xs ${demandColors[career.demandLevel]}`}>
                      {demandIcons[career.demandLevel]}
                      <span className="ml-1">Demand: {career.demandLevel}</span>
                    </Badge>
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className={`text-2xl font-bold ${getMatchColor(career.matchScore).split(' ')[0]}`}>
                    {career.matchScore}%
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Match</p>
                </div>
              </div>

              {/* Match bar */}
              <Progress value={career.matchScore} className={`h-2 ${getMatchColor(career.matchScore)}`} />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Salary</p>
                    <p className="font-medium text-sm">{career.averageSalary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Growth Rate</p>
                    <p className="font-medium text-sm">{career.growthRate}</p>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Rationale</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{career.rationale}</p>
              </div>

              {/* Skills to Develop */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Skills to Develop</p>
                <div className="flex flex-wrap gap-1.5">
                  {career.skillsToDevelop.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-ai/10 text-ai border-ai/20 text-xs"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Relevant Certifications */}
              {career.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Relevant Certifications
                  </p>
                  <ul className="space-y-1">
                    {career.certifications.map((cert, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-ai shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}