import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Pencil, UserX, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState, LoadingState } from '@/components/shared/states';
import { getAdminUsers, createUser, updateUser, deactivateUser } from '@/api/client';
import type { AdminUser, Role } from '@/types';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format } from 'date-fns';

const roleColors: Record<string, string> = {
  STUDENT: 'bg-primary/10 text-primary border-primary/20',
  LECTURER: 'bg-ai/10 text-ai border-ai/20',
  ADMIN: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface UserFormData {
  name: string;
  email: string;
  role: Role;
  programme: string;
  status: 'active' | 'inactive' | 'suspended';
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<UserFormData>({
    defaultValues: { name: '', email: '', role: 'STUDENT', programme: '', status: 'active' },
  });

  const selectedRole = watch('role');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateDialog = () => {
    setEditingUser(null);
    reset({ name: '', email: '', role: 'STUDENT', programme: '', status: 'active' });
    setFormOpen(true);
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    reset({
      name: user.name,
      email: user.email,
      role: user.role,
      programme: user.programme || '',
      status: user.status,
    });
    setFormOpen(true);
  };

  const openDeactivateDialog = (user: AdminUser) => {
    setDeactivatingUser(user);
    setDeactivateOpen(true);
  };

  const onSubmit = async (data: UserFormData) => {
    setIsSaving(true);
    try {
      if (editingUser) {
        const res = await updateUser(editingUser.id, data);
        setUsers(prev => prev.map(u => (u.id === editingUser.id ? res.data : u)));
        toast.success('User updated successfully.');
      } else {
        const res = await createUser(data);
        setUsers(prev => [res.data, ...prev]);
        toast.success('User created successfully.');
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    setIsSaving(true);
    try {
      await deactivateUser(deactivatingUser.id);
      setUsers(prev => prev.map(u => (u.id === deactivatingUser.id ? { ...u, status: 'inactive' } : u)));
      toast.success('User deactivated successfully.');
      setDeactivateOpen(false);
      setDeactivatingUser(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">User Management</h2>
          <Badge variant="secondary" className="text-xs">{filteredUsers.length} users</Badge>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 w-fit">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
                aria-label="Search users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="LECTURER">Lecturer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12 text-muted-foreground" />}
              title="No users found"
              description="Try adjusting your search or filter criteria."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Programme</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${roleColors[user.role]}`}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {user.programme || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${statusColors[user.status]}`}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeactivateDialog(user)}
                            aria-label={`Deactivate ${user.name}`}
                            disabled={user.status === 'inactive'}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" {...register('name', { required: 'Name is required' })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" {...register('email', { required: 'Email is required' })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={v => setValue('role', v as Role)}
              >
                <SelectTrigger aria-label="Select role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="LECTURER">Lecturer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRole === 'STUDENT' && (
              <div className="space-y-2">
                <Label htmlFor="user-programme">Programme</Label>
                <Input id="user-programme" {...register('programme')} placeholder="e.g., BSc Computer Science" />
              </div>
            )}
            {editingUser && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watch('status')}
                  onValueChange={v => setValue('status', v as 'active' | 'inactive' | 'suspended')}
                >
                  <SelectTrigger aria-label="Select status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivatingUser?.name}? They will lose access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={isSaving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isSaving ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}