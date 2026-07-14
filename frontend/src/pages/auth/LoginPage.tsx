import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigation, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { label: 'Student (Ada)', email: 'ada@compass.edu' },
  { label: 'Lecturer (Dr. Ngwa)', email: 'dr.ngwa@compass.edu' },
  { label: 'Admin', email: 'admin@compass.edu' },
];

const ROLE_DASHBOARD: Record<Role, string> = {
  STUDENT: '/student/dashboard',
  LECTURER: '/lecturer/dashboard',
  ADMIN: '/admin/users',
};

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleFormSubmit(values: LoginFormValues) {
    setError(null);
    try {
      const loggedInUser = await login(values.email, values.password);
      if (loggedInUser) {
        navigate(ROLE_DASHBOARD[loggedInUser.role]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  }

  const onSubmit = form.handleSubmit(handleFormSubmit);

  function fillDemo(email: string) {
    form.setValue('email', email);
    form.setValue('password', 'password');
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Navigation className="size-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Compass</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-Powered Academic Advisor
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@compass.edu"
                        autoComplete="email"
                        aria-label="Email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate('/forgot-password')}
                        aria-label="Go to forgot password"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          aria-label="Password"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || form.formState.isSubmitting}
                aria-label="Sign in to your account"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => navigate('/register')}
              aria-label="Navigate to create account"
            >
              Create one
            </button>
          </p>

          <Separator />

          <div className="w-full">
            <p className="mb-2 text-center text-xs text-muted-foreground">Demo accounts:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemo(account.email)}
                  aria-label={`Fill demo credentials for ${account.label}`}
                  className="text-xs"
                >
                  {account.label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Password for all: password
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}