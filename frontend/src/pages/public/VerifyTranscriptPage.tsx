import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, ScanLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/states';
import { verifyTranscriptToken } from '@/api/client';
import { ROUTES } from '@/routes';
import type { TranscriptVerification } from '@/types';

type VerifyState = 'loading' | 'done' | 'error';

export function VerifyTranscriptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>('loading');
  const [result, setResult] = useState<TranscriptVerification | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('No verification token was provided in the link.');
      setState('error');
      return;
    }

    let cancelled = false;
    verifyTranscriptToken(token)
      .then((res) => {
        if (!cancelled) {
          setResult(res.data);
          setState('done');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('The verification service is temporarily unavailable. Please try again later.');
          setState('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-[60vh]">
      <section className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-8 text-center">
          <ScanLine className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Transcript Verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authenticate an official YIBS academic transcript by its QR code.
          </p>
        </div>

        {state === 'loading' && (
          <Card>
            <CardContent className="py-8">
              <LoadingState rows={3} />
            </CardContent>
          </Card>
        )}

        {state === 'error' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldX className="size-5" />
                Unable to verify
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="mt-2">
                <Link to={ROUTES.HOME}>Return to home</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state === 'done' && result && (
          <Card className={result.valid ? 'border-success' : 'border-destructive'}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${result.valid ? 'text-success' : 'text-destructive'}`}
              >
                {result.valid ? <ShieldCheck className="size-5" /> : <ShieldX className="size-5" />}
                {result.valid ? 'Document is authentic' : 'Verification failed'}
              </CardTitle>
              <CardDescription>
                {result.valid
                  ? 'This transcript matches the details registered with YIBS.'
                  : reasonLabel(result.reason)}
              </CardDescription>
            </CardHeader>
            {result.valid && result.data && (
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{result.data.studentName}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Student ID</span>
                  <span className="font-medium">{result.data.studentIdCode}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Programme</span>
                  <span className="font-medium">{result.data.programme}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">CGPA</span>
                  <span className="font-medium">{result.data.cgpa}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Credits / Courses</span>
                  <span className="font-medium">
                    {result.data.credits} / {result.data.gradeCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">{formatDate(result.data.issuedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Valid until</span>
                  <span className="font-medium">{formatDate(result.data.expiresAt)}</span>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}

function reasonLabel(reason?: string): string {
  switch (reason) {
    case 'expired':
      return 'The authenticity link for this transcript has expired. Please request a new transcript.';
    case 'tampered':
      return 'The authenticity data for this document does not match what was registered. The document may have been altered.';
    default:
      return 'The authenticity token is invalid or malformed. This document could not be verified.';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
