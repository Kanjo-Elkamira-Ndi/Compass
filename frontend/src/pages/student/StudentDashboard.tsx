import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { LoadingState, ErrorState, getRiskLevelColor, getRiskLevelDot } from '@/components/shared/states';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import { getStudentDashboard } from '@/api/client';
import type { StudentDashboard as StudentDashboardType } from '@/types';
import {
  MessageSquare,
  ShieldAlert,
  FlaskConical,
  Briefcase,
  BookOpen,
  TrendingUp,
  ArrowRight,
  CreditCard,
  Activity,
} from 'lucide-react';

const chartConfig = {
  gpa: {
    label: 'Semester GPA',
    color: 'hsl(221, 83%, 53%)', // primary blue
  },
  cumulativeGpa: {
    label: 'Cumulative GPA',
    color: 'oklch(0.45 0.18 264.38)', // blue (matches secondary)
  },
} satisfies ChartConfig;

function getRiskBadgeVariant(level: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (level) {
    case 'Excellent': return 'default';
    case 'Passing': return 'secondary';
    case 'At-Risk': return 'secondary';
    case 'Critical': return 'destructive';
    default: return 'outline';
  }
}

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'error' | 'data'>('loading');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<StudentDashboardType | null>(null);

  const retryDashboard = async () => {
    setState('loading');
    setError('');
    try {
      const res = await getStudentDashboard(user!.id);
      setDashboard(res.data);
      setState('data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      setState('error');
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getStudentDashboard(user.id).then(res => {
      if (!cancelled) {
        setDashboard(res.data);
        setState('data');
      }
    }).catch(err => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
        setState('error');
      }
    });
    return () => { cancelled = true; };
  }, [user]);

  if (state === 'loading') return <LoadingState />;
  if (state === 'error' || !dashboard) return <ErrorState message={error} onRetry={retryDashboard} />;

  const { gpaTrend, currentGPA, enrollments, riskAssessment, totalCredits, completedCredits } = dashboard;

  const quickActions: { icon: React.ReactNode; title: string; description: string; route: string }[] = [
    {
      icon: <MessageSquare className="size-5 text-secondary" />,
      title: 'AI Chat',
      description: 'Ask questions about courses, grades, and academic planning.',
      route: '/ai/chat',
    },
    {
      icon: <ShieldAlert className="size-5 text-secondary" />,
      title: 'Risk Assessment',
      description: 'View your academic risk analysis and recommendations.',
      route: '/ai/risk',
    },
    {
      icon: <FlaskConical className="size-5 text-secondary" />,
      title: 'Research Assistant',
      description: 'Upload papers and get AI-powered research insights.',
      route: '/ai/research',
    },
    {
      icon: <Briefcase className="size-5 text-secondary" />,
      title: 'Career Advisor',
      description: 'Get career recommendations based on your profile.',
      route: '/ai/career',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">Current GPA</span>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">{currentGPA.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Total Credits</span>
            </div>
            <p className="text-2xl font-bold text-secondary mt-1">{totalCredits}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-success" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold text-success mt-1">{completedCredits}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-warning" />
              <span className="text-xs text-muted-foreground">Risk Level</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`size-2.5 rounded-full ${getRiskLevelDot(riskAssessment.level)}`} />
              <span className={`text-sm font-semibold ${getRiskLevelColor(riskAssessment.level).split(' ')[1]}`}>
                {riskAssessment.level}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Level Badge - Prominent */}
      <Card className="py-4">
        <CardContent className="px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`size-3 rounded-full ${getRiskLevelDot(riskAssessment.level)}`} />
            <div>
              <p className="text-sm font-medium">Academic Risk Level</p>
              <p className="text-xs text-muted-foreground">
                Risk score: {riskAssessment.score}/100 — {riskAssessment.recommendedActions.length} recommended actions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getRiskLevelColor(riskAssessment.level)} variant={getRiskBadgeVariant(riskAssessment.level)}>
              {riskAssessment.level}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/ai/risk')}>
              View Details
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GPA Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            GPA Trend
          </CardTitle>
          <CardDescription>Track your semester and cumulative GPA over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={gpaTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="semester" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis domain={[0, 4]} tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="gpa"
                stroke="var(--color-gpa)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="cumulativeGpa"
                stroke="var(--color-cumulativeGpa)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Current Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Current Enrollments
          </CardTitle>
          <CardDescription>Courses you are currently enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No current enrollments.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="py-4 shadow-none border">
                  <CardContent className="px-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary">{enrollment.course.code}</p>
                        <p className="text-sm font-medium">{enrollment.course.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{enrollment.course.credits} cr</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{enrollment.course.lecturerName}</span>
                      {enrollment.grade ? (
                        <Badge variant="default" className="text-xs">{enrollment.grade}</Badge>
                      ) : (
                        <span className="text-warning font-medium">In Progress</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">AI-Powered Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.route}
              className="py-4 cursor-pointer group hover:border-secondary/50 transition-colors"
              onClick={() => navigate(action.route)}
            >
              <CardContent className="px-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                    {action.icon}
                  </div>
                </div>
                <p className="font-semibold text-sm mb-1">{action.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-secondary font-medium">
                  Open <ArrowRight className="size-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}