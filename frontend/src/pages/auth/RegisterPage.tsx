import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import AuthLayout from '@/components/auth/AuthLayout';
import type { Role } from '@/types';

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  programme: z.string().optional(),
  terms: z.boolean().refine((value) => value === true, {
    message: 'You must agree to the terms',
  }),
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
      terms: false as unknown as true,
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
    <AuthLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Already have an account?{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Social login */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: 'Google', icon: <svg className="size-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
            { name: 'Facebook', icon: <svg className="size-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
            { name: 'Apple', icon: <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg> },
            { name: 'X', icon: <svg className="size-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
          ].map((provider) => (
            <button
              key={provider.name}
              type="button"
              className="flex items-center justify-center rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              aria-label={`Continue with ${provider.name}`}
            >
              {provider.icon}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Form */}
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

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                      I agree to the{' '}
                      <span className="font-medium text-foreground hover:underline">Terms of Service</span>
                      {' '}and{' '}
                      <span className="font-medium text-foreground hover:underline">Privacy Policy</span>
                    </label>
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
                'Create account'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </AuthLayout>
  );
}
