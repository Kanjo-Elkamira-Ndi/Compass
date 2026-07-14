import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigation, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useNavigate } from 'react-router-dom';
import * as api from '@/api/client';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await api.requestPasswordReset(values.email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-xl font-semibold">Reset your password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-6 text-success" />
              </div>
              <p className="text-sm text-foreground">
                If an account exists with that email, a reset link has been sent.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                aria-label="Back to sign in"
              >
                <ArrowLeft className="size-4" />
                Back to Sign In
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || form.formState.isSubmitting}
                  aria-label="Send reset link"
                >
                  {isSubmitting || form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                    {error}
                  </div>
                )}
              </form>
            </Form>
          )}
        </CardContent>

        {!isSuccess && (
          <CardFooter className="justify-center">
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/login')}
              aria-label="Back to sign in"
            >
              <ArrowLeft className="size-3" />
              Back to Sign In
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}