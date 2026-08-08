import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, GraduationCap, BookOpen, Target, Plus, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState, CardLoadingState, ErrorState } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { getCourseRecommendations, getCareerRecommendations, enrollInCourse } from '@/api/client';
import type { CourseRecommendation, CareerRecommendation } from '@/types';
import { toast } from 'sonner';

function getMatchColor(score: number): string {
  if (score >= 85) return 'text-success [&>div]:bg-success';
  if (score >= 70) return 'text-primary [&>div]:bg-primary';
  if (score >= 50) return 'text-warning [&>div]:bg-warning';
  return 'text-destructive [&>div]:bg-destructive';
}

export function AICourseRecommendation() {
  const { user } = useAuth();
  const [careers, setCareers] = useState<CareerRecommendation[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('auto');
  const [customGoal, setCustomGoal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);

  const resolveGoal = useCallback((): string | undefined => {
    if (selectedGoal === 'auto') return undefined;
    if (selectedGoal === 'custom') return customGoal.trim();
    return selectedGoal;
  }, [selectedGoal, customGoal]);

  const fetchRecommendations = useCallback(async (goal?: string): Promise<CourseRecommendation[]> => {
    try {
      const res = await getCourseRecommendations(goal);
      setRecommendations(res.data);
      // Backend sends a specific reason when it comes back empty (e.g. already
      // enrolled in everything open) rather than a generic "Success" message.
      setEmptyMessage(res.data.length === 0 ? res.message ?? null : null);
      setError(null);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course recommendations');
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await getCareerRecommendations();
        if (!cancelled) setCareers(res.data);
      } catch {
        // Careers are optional — recommendations still work with a custom goal
      }
      try {
        const res = await getCourseRecommendations();
        if (!cancelled) {
          setRecommendations(res.data);
          setEmptyMessage(res.data.length === 0 ? res.message ?? null : null);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load course recommendations');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleGenerate = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const results = await fetchRecommendations(resolveGoal());
      if (results.length > 0) {
        toast.success('Course recommendations generated.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingId(courseId);
    try {
      const res = await enrollInCourse(user.id, courseId);
      toast.success(res.message || 'Successfully enrolled.');
      setRecommendations(prev => prev.filter(r => r.courseId !== courseId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll.');
    } finally {
      setEnrollingId(null);
    }
  };

  if (isLoading) {
    return <CardLoadingState cards={3} className="grid-cols-1 lg:grid-cols-2" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-ai" />
        <h2 className="text-lg font-semibold">Course Recommendations</h2>
        <span className="text-sm text-muted-foreground">— courses that move you toward your career goal</span>
      </div>

      {/* Goal selector */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Career goal</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a career goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic (top career match)</SelectItem>
                {careers.map(career => (
                  <SelectItem key={career.id} value={career.title}>
                    {career.title}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom goal…</SelectItem>
              </SelectContent>
            </Select>
            {selectedGoal === 'custom' && (
              <Input
                value={customGoal}
                onChange={e => setCustomGoal(e.target.value)}
                placeholder="e.g. Become a Data Engineer"
                onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); }}
              />
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isRefreshing || (selectedGoal === 'custom' && !customGoal.trim())}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Get Recommendations
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <ErrorState message={error} onRetry={() => fetchRecommendations(resolveGoal())} />}

      {!error && recommendations.length === 0 && (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12 text-muted-foreground" />}
          title={emptyMessage ? "You're all caught up" : 'No course recommendations yet'}
          description={
            emptyMessage
              ?? 'Choose a career goal above and generate personalized course recommendations based on your profile.'
          }
        />
      )}

      {!error && recommendations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {recommendations.map(rec => (
            <Card
              key={rec.courseId}
              className="hover:shadow-md transition-shadow border hover:border-ai/30"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default">{rec.courseCode}</Badge>
                      <Badge variant="outline" className="text-xs">{rec.credits} cr</Badge>
                      <Badge variant="outline" className="text-xs">
                        Sem {rec.semester} · {rec.academicYear}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold leading-tight mt-2">{rec.courseTitle}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Rank #{rec.rank}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`text-2xl font-bold ${getMatchColor(rec.matchScore).split(' ')[0]}`}>
                      {rec.matchScore}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Match</p>
                  </div>
                </div>

                <Progress value={rec.matchScore} className={`h-2 ${getMatchColor(rec.matchScore)}`} />

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Why it fits</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{rec.rationale}</p>
                </div>

                {rec.alignedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Aligned Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.alignedSkills.map((skill, i) => (
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
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={enrollingId === rec.courseId}
                  onClick={() => handleEnroll(rec.courseId)}
                >
                  {enrollingId === rec.courseId ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Enrolling…
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      Enroll
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <BookOpen className="h-3.5 w-3.5" />
        Recommendations are generated from your programme's currently open courses and refreshed on demand.
      </p>
    </div>
  );
}
