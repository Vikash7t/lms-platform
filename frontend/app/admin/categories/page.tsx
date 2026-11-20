'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderPlus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  FolderTree,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCategoriesPage() {
  const { user, isInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Query categories
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  // Slug auto-generation helper
  const handleNameChange = (val: string, isEditing = false) => {
    setName(val);
    if (!isEditing || !slug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/categories', {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        iconName: iconName.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editCategory) return;
      const res = await api.patch(`/categories/${editCategory.id}`, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        iconName: iconName.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditCategory(null);
      resetForm();
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteCategory(null);
    },
    onError: (err) => {
      setFormError(getApiErrorMessage(err));
    },
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setIconName('');
    setFormError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    resetForm();
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIconName(cat.iconName || '');
  };

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
          Administrator privileges are required to manage platform category taxonomies.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return to Storefront</Link>
        </Button>
      </div>
    );
  }

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
            <span className="text-foreground font-medium">Categories</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-primary" />
            Category Taxonomy
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, organize, and manage course categories for platform discovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/instructors">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Review Instructors
            </Link>
          </Button>
          <Button onClick={openCreateDialog} className="shadow-sm">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">
          {filteredCategories.length} Categories
        </Badge>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[180px]">Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Icon</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No categories found. Click &quot;New Category&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-semibold text-foreground">
                    {cat.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                      {cat.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                    {cat.description || <span className="italic text-muted-foreground/60">No description</span>}
                  </TableCell>
                  <TableCell>
                    {cat.iconName ? (
                      <Badge variant="secondary" className="text-xs">
                        {cat.iconName}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cat)}
                        title="Edit category"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteCategory(cat)}
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Define a top-level category taxonomy for grouping platform courses.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="my-2 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Category Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Cloud & DevOps"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-slug">Slug (URL identifier) *</Label>
              <Input
                id="create-slug"
                placeholder="e.g., cloud-devops"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
              />
              <p className="text-xs text-muted-foreground">
                URL preview: <code className="bg-muted px-1 rounded">/courses?category={slug || 'slug'}</code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-icon">Icon Name (Lucide icon)</Label>
              <Input
                id="create-icon"
                placeholder="e.g., Cloud, Code, Database"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-desc">Description</Label>
              <Textarea
                id="create-desc"
                placeholder="Brief summary of skills and topics covered..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editCategory}
        onOpenChange={(open) => !open && setEditCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category details and taxonomy parameters.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="my-2 py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value, true)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-icon">Icon Name</Label>
              <Input
                id="edit-icon"
                value={iconName}
                onChange={(e) => setIconName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditCategory(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !name.trim()}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete the category{' '}
              <strong className="text-foreground">{deleteCategory?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCategory(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
