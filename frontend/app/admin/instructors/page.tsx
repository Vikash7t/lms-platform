'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ArrowLeft,
  FolderTree,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApplicantUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roles: string[];
  createdAt: string;
}

interface InstructorApplication {
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
  user: ApplicantUser;
}

interface PaginatedApplications {
  data: InstructorApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminInstructorsPage() {
  const { user, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedApplication, setSelectedApplication] = useState<InstructorApplication | null>(null);
  const [approveConfirmApp, setApproveConfirmApp] = useState<InstructorApplication | null>(null);
  const [rejectApp, setRejectApp] = useState<InstructorApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch applications for active status tab
  const {
    data: applicationsData,
    isLoading,
  } = useQuery<PaginatedApplications>({
    queryKey: ['admin-instructors', activeTab],
    queryFn: async () => {
      const res = await api.get('/admin/instructors', {
        params: { status: activeTab, limit: 50 },
      });
      return res.data;
    },
    enabled: !!user && user.roles.includes('ADMIN'),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      setActionError(null);
      const res = await api.patch(`/admin/instructors/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      setApproveConfirmApp(null);
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err));
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      setActionError(null);
      const res = await api.patch(`/admin/instructors/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      setRejectApp(null);
      setRejectionReason('');
    },
    onError: (err) => {
      setActionError(getApiErrorMessage(err));
    },
  });

  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.roles?.includes('ADMIN');

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Administrator privileges are required to moderate instructor applications.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return to Storefront</Link>
        </Button>
      </div>
    );
  }

  const applications = applicationsData?.data || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Storefront
            </Link>
            <span>/</span>
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground font-medium">Instructor Moderation</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Instructor Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review applicant credentials, verify technical backgrounds, and approve platform instructors.
          </p>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/admin/categories">
            <FolderTree className="h-4 w-4 mr-1.5" />
            Manage Categories
          </Link>
        </Button>
      </div>

      {/* Global Action Error Alert */}
      {actionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Failed</AlertTitle>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* Status Tabs */}
      <Tabs
        defaultValue="PENDING"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'PENDING' | 'APPROVED' | 'REJECTED')}
      >
        <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="PENDING" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[240px]">Applicant</TableHead>
                  <TableHead>Headline &amp; Bio</TableHead>
                  <TableHead className="w-[180px]">Links</TableHead>
                  <TableHead className="w-[140px]">Submitted</TableHead>
                  <TableHead className="text-right w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No {activeTab.toLowerCase()} applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const applicant = app.user;
                    const name =
                      applicant?.firstName || applicant?.lastName
                        ? `${applicant.firstName} ${applicant.lastName}`.trim()
                        : 'Unnamed Applicant';

                    return (
                      <TableRow key={app.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {applicant?.avatarUrl && (
                                <AvatarImage src={applicant.avatarUrl} alt={name} />
                              )}
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {applicant?.firstName ? applicant.firstName[0] : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{name}</p>
                              <p className="text-xs text-muted-foreground">{applicant?.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium text-sm text-foreground">{app.headline}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 max-w-md">
                            {app.bio}
                          </p>
                          {app.status === 'REJECTED' && app.rejectionReason && (
                            <p className="text-xs text-destructive mt-1 font-mono">
                              Reason: {app.rejectionReason}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {app.websiteUrl && (
                              <a
                                href={app.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                Portfolio
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {app.linkedinUrl && (
                              <a
                                href={app.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                LinkedIn
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {app.githubUrl && (
                              <a
                                href={app.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-0.5"
                              >
                                GitHub
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedApplication(app)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {app.status !== 'APPROVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-8 px-2.5"
                                onClick={() => setApproveConfirmApp(app)}
                              >
                                Approve
                              </Button>
                            )}

                            {app.status !== 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10 h-8 px-2.5"
                                onClick={() => {
                                  setRejectApp(app);
                                  setRejectionReason('');
                                }}
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedApplication}
        onOpenChange={(open) => !open && setSelectedApplication(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Instructor Application Details</DialogTitle>
            <DialogDescription>
              Complete credentials and background submitted by applicant.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Applicant</Label>
                <p className="font-semibold text-foreground">
                  {selectedApplication.user?.firstName} {selectedApplication.user?.lastName} (
                  {selectedApplication.user?.email})
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Headline</Label>
                <p className="font-medium text-foreground">{selectedApplication.headline}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Full Biography</Label>
                <div className="bg-muted/40 p-3 rounded-md text-foreground text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedApplication.bio}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedApplication.websiteUrl && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Website</Label>
                    <p className="truncate">
                      <a
                        href={selectedApplication.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedApplication.websiteUrl}
                      </a>
                    </p>
                  </div>
                )}
                {selectedApplication.linkedinUrl && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">LinkedIn</Label>
                    <p className="truncate">
                      <a
                        href={selectedApplication.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedApplication.linkedinUrl}
                      </a>
                    </p>
                  </div>
                )}
                {selectedApplication.githubUrl && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">GitHub</Label>
                    <p className="truncate">
                      <a
                        href={selectedApplication.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedApplication.githubUrl}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog
        open={!!approveConfirmApp}
        onOpenChange={(open) => !open && setApproveConfirmApp(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Approve Instructor Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve{' '}
              <strong className="text-foreground">
                {approveConfirmApp?.user?.firstName || approveConfirmApp?.user?.email}
              </strong>
              ? This will grant the user the <code className="bg-muted px-1 rounded">INSTRUCTOR</code> role
              and permit them to publish video courses.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveConfirmApp(null)}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => approveConfirmApp && approveMutation.mutate(approveConfirmApp.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog
        open={!!rejectApp}
        onOpenChange={(open) => !open && setRejectApp(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reject Instructor Application</DialogTitle>
            <DialogDescription>
              Provide clear feedback explaining why this application is not approved at this time. The
              applicant can view this message and revise their submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">Administrative Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Please provide more detail in your biography and include links to code samples or existing lectures..."
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Minimum 10 characters.</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectApp(null)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectApp &&
                rejectMutation.mutate({
                  id: rejectApp.id,
                  reason: rejectionReason.trim(),
                })
              }
              disabled={rejectMutation.isPending || rejectionReason.trim().length < 10}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
