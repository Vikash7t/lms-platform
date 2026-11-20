'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const applySchema = z.object({
  headline: z
    .string()
    .min(5, 'Headline must be at least 5 characters long')
    .max(100, 'Headline cannot exceed 100 characters'),
  bio: z
    .string()
    .min(30, 'Bio must be at least 30 characters long to demonstrate your background')
    .max(2000, 'Bio cannot exceed 2000 characters'),
  websiteUrl: z
    .string()
    .url('Must be a valid URL (starting with http:// or https://)')
    .max(255)
    .optional()
    .or(z.literal('')),
  twitterUrl: z
    .string()
    .url('Must be a valid URL (starting with http:// or https://)')
    .max(255)
    .optional()
    .or(z.literal('')),
  linkedinUrl: z
    .string()
    .url('Must be a valid URL (starting with http:// or https://)')
    .max(255)
    .optional()
    .or(z.literal('')),
  githubUrl: z
    .string()
    .url('Must be a valid URL (starting with http:// or https://)')
    .max(255)
    .optional()
    .or(z.literal('')),
});

type ApplyFormValues = z.infer<typeof applySchema>;

interface InstructorProfile {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InstructorApplyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isInitialized, restoreSession } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRefreshingRole, setIsRefreshingRole] = useState(false);

  // Fetch current user's instructor profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
  } = useQuery<InstructorProfile | null>({
    queryKey: ['instructor-profile-me'],
    queryFn: async () => {
      const res = await api.get('/instructor/profile/me');
      return res.data;
    },
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      headline: '',
      bio: '',
      websiteUrl: '',
      twitterUrl: '',
      linkedinUrl: '',
      githubUrl: '',
    },
  });

  // Prefill form if profile was previously rejected
  useEffect(() => {
    if (profile && profile.status === 'REJECTED') {
      reset({
        headline: profile.headline || '',
        bio: profile.bio || '',
        websiteUrl: profile.websiteUrl || '',
        twitterUrl: profile.twitterUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
      });
    }
  }, [profile, reset]);

  // Handle token synchronization if user is approved
  const handleSyncSession = async () => {
    setIsRefreshingRole(true);
    await restoreSession();
    setIsRefreshingRole(false);
  };

  const applyMutation = useMutation({
    mutationFn: async (data: ApplyFormValues) => {
      setSubmitError(null);
      const payload = {
        headline: data.headline.trim(),
        bio: data.bio.trim(),
        websiteUrl: data.websiteUrl?.trim() || undefined,
        twitterUrl: data.twitterUrl?.trim() || undefined,
        linkedinUrl: data.linkedinUrl?.trim() || undefined,
        githubUrl: data.githubUrl?.trim() || undefined,
      };
      const res = await api.post('/instructor/apply', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-profile-me'] });
    },
    onError: (err) => {
      setSubmitError(getApiErrorMessage(err));
    },
  });

  const onSubmit = (data: ApplyFormValues) => {
    applyMutation.mutate(data);
  };

  if (!isInitialized || (user && isLoadingProfile)) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <GraduationCap className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Sign In Required</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in or create an account to submit your instructor application.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go to Home</Link>
        </Button>
      </div>
    );
  }

  // State 1: User is already an APPROVED instructor
  if (profile?.status === 'APPROVED' || user.roles.includes('INSTRUCTOR')) {
    const hasRoleInSession = user.roles.includes('INSTRUCTOR');

    return (
      <div className="container mx-auto px-4 sm:px-6 py-16 max-w-3xl">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <Badge variant="outline" className="mx-auto mb-2 border-primary text-primary">
              Approved Instructor
            </Badge>
            <CardTitle className="text-2xl font-bold">You are an Approved Instructor!</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto mt-2">
              Your instructor credentials have been approved. You have full access to author, publish,
              and manage video courses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {!hasRoleInSession && (
              <Alert className="bg-muted/50">
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>Role Token Synchronization</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-4 mt-2">
                  <span className="text-xs">
                    Your session role claims are refreshing. Click below to synchronize your active token.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncSession}
                    disabled={isRefreshingRole}
                  >
                    {isRefreshingRole && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    Sync Role
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/instructor/courses">
                  Go to Instructor Studio
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/">Back to Storefront</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 2: Application is PENDING review
  if (profile?.status === 'PENDING') {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-16 max-w-2xl">
        <Card className="border-border shadow-xs">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <Badge variant="secondary" className="mx-auto mb-2 text-amber-600 bg-amber-500/10">
              Pending Review
            </Badge>
            <CardTitle className="text-2xl font-bold">Application Under Review</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto mt-2">
              Thank you for applying to teach. Our administrative team is currently reviewing your profile
              and technical credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/40 p-4 border text-sm space-y-2">
              <p>
                <strong className="text-foreground">Submitted Headline:</strong>{' '}
                <span className="text-muted-foreground">{profile.headline}</span>
              </p>
              <p>
                <strong className="text-foreground">Bio:</strong>{' '}
                <span className="text-muted-foreground line-clamp-3">{profile.bio}</span>
              </p>
              {profile.websiteUrl && (
                <p>
                  <strong className="text-foreground">Website:</strong>{' '}
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {profile.websiteUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Review decisions are typically completed within 24 to 48 business hours. You will see an update
              here as soon as your application is evaluated.
            </p>

            <div className="flex justify-center pt-2">
              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // State 3: Fresh application OR resubmission after REJECTED
  const isRejected = profile?.status === 'REJECTED';

  return (
    <div className="container mx-auto px-4 sm:px-6 py-12 max-w-3xl">
      {/* Page Title */}
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-2">
          <GraduationCap className="h-3.5 w-3.5 mr-1 text-primary" />
          Instructor Portal
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {isRejected ? 'Revise Your Instructor Application' : 'Teach on LMS Platform'}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Share your industry knowledge, publish high-impact engineering courses, and mentor
          developers worldwide.
        </p>
      </div>

      {/* Rejection Alert if applicable */}
      {isRejected && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Application Requires Changes</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="font-semibold mb-1">Administrative Feedback:</p>
            <p className="bg-destructive/10 p-3 rounded-md text-sm border border-destructive/20 font-mono">
              {profile?.rejectionReason || 'Please provide more detail in your bio and technical background.'}
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              Update the fields below addressing this feedback and click &quot;Resubmit Application&quot;.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Global Form Error */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Submission Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Application Form */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>Professional Profile &amp; Background</CardTitle>
          <CardDescription>
            Tell our review team about your engineering background, teaching philosophy, and portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Headline */}
            <div className="space-y-1.5">
              <Label htmlFor="headline">Professional Headline *</Label>
              <Input
                id="headline"
                placeholder="e.g., Staff Software Engineer | Distributed Systems Specialist"
                {...register('headline')}
              />
              {errors.headline && (
                <p className="text-xs text-destructive">{errors.headline.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Instructor Biography *</Label>
              <Textarea
                id="bio"
                rows={5}
                placeholder="Provide a comprehensive summary of your professional experience, technical credentials, technologies you teach, and previous speaking/teaching background (minimum 30 characters)..."
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              )}
            </div>

            {/* Social & Portfolio Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="websiteUrl">Portfolio / Personal Website</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://yourportfolio.dev"
                  {...register('websiteUrl')}
                />
                {errors.websiteUrl && (
                  <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linkedinUrl">LinkedIn Profile</Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/username"
                  {...register('linkedinUrl')}
                />
                {errors.linkedinUrl && (
                  <p className="text-xs text-destructive">{errors.linkedinUrl.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="githubUrl">GitHub Profile</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/username"
                  {...register('githubUrl')}
                />
                {errors.githubUrl && (
                  <p className="text-xs text-destructive">{errors.githubUrl.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="twitterUrl">X (Twitter) Profile</Label>
                <Input
                  id="twitterUrl"
                  placeholder="https://x.com/username"
                  {...register('twitterUrl')}
                />
                {errors.twitterUrl && (
                  <p className="text-xs text-destructive">{errors.twitterUrl.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || applyMutation.isPending}
            >
              {applyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isRejected ? 'Resubmit Application' : 'Submit Instructor Application'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
