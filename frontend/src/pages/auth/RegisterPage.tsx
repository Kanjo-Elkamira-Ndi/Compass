import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigation, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN'], { required_error: 'Please select a role' }),
  programme: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLE_DASHBOARD: Record<Role, string> = {
  STUDENT: '/student/dashboard',
  LECTURER: '/lecturer/dashboard',
  ADMIN: '/admin/users',
};

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 20, label: 'Weak', color: 'text-destructive' };
  if (score <= 2) return { score: 40, label: 'Fair', color: 'text-warning' };
  if (score <= 3) return { score: 60, label: 'Good', color: 'text-warning-foreground' };
  if (score <= 4) return { score: 80, label: 'Strong', color: 'text-success' };
  return { score: 100, label: 'Very strong', color: 'text-success' };
}

export function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      programme: '',
    },
  });

  const watchedPassword = form.watch('password');
  const watchedRole = form.watch('role');
  const passwordStrength = getPasswordStrength(watchedPassword);

  async function handleFormSubmit(values: RegisterFormValues) {
    try {
      const newUser = await registerUser(
        values.name,
        values.email,
        values.password,
        values.role,
        values.role === 'STUDENT' ? values.programme : undefined,
      );
      toast.success('Account created successfully!');
      if (newUser) {
        navigate(ROLE_DASHBOARD[newUser.role]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  }

  const onSubmit = form.handleSubmit(handleFormSubmit);

  const strengthChecks = [
    { label: 'At least 8 characters', met: watchedPassword.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(watchedPassword) },
    { label: 'Number', met: /[0-9]/.test(watchedPassword) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(watchedPassword) },
  ];

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
            Create your account
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        autoComplete="name"
                        aria-label="Full name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-3 gap-2"
                        aria-label="Select your role"
                      >
                        {(['STUDENT', 'LECTURER', 'ADMIN'] as const).map((role) => (
                          <Label
                            key={role}
                            htmlFor={`role-${role}`}
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent ${
                              field.value === role
                                ? 'border-primary bg-primary/5 text-primary font-medium'
                                : 'border-input text-muted-foreground'
                            }`}
                          >
                            <RadioGroupItem value={role} id={`role-${role}`} />
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchedRole === 'STUDENT' && (
                <FormField
                  control={form.control}
                  name="programme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programme</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Computer Science"
                          aria-label="Programme of study"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          autoComplete="new-password"
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
                    {watchedPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Progress value={passwordStrength.score} className="h-1.5" />
                          <span className={`ml-2 text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          {strengthChecks.map((check) => (
                            <div key={check.label} className="flex items-center gap-1 text-xs">
                              {check.met ? (
                                <CheckCircle2 className="size-3 text-success shrink-0" />
                              ) : (
                                <XCircle className="size-3 text-muted-foreground shrink-0" />
                              )}
                              <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
                                {check.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          aria-label="Confirm password"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                aria-label="Create account"
              >
                {isLoading || form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => navigate('/login')}
              aria-label="Navigate to sign in"
            >
              Sign in
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}