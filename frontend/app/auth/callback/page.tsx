'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth';

function sanitizeRedirect(target?: string | null): string {
  // Reject external schemes or protocol-relative paths (//malicious.com)
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return '/';
  }
  return target;
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const success = await restoreSession();
        if (!isMounted) return;

        if (success) {
          const redirectTarget = sanitizeRedirect(searchParams.get('redirect'));
          router.replace(redirectTarget);
        } else {
          setError('Authentication failed or session expired. Please log in again.');
        }
      } catch {
        if (isMounted) {
          setError('An unexpected error occurred during authentication.');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [restoreSession, router, searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2">Authentication Failed</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">{error}</p>
        <Button onClick={() => router.replace('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        Authenticating...
      </h1>
      <p className="text-xs text-muted-foreground mt-1">
        Please wait while we securely restore your learning session.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
