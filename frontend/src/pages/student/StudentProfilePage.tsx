import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/api/client';
import type { User } from '@/types';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  GraduationCap,
  Calendar,
  Tag,
  Plus,
  X,
  Save,
  Loader2,
} from 'lucide-react';

interface ProfileFormValues {
  name: string;
}

export function StudentProfile() {
  const { user, updateUserData } = useAuth();
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    defaultValues: { name: user?.name || '' },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name });
      setSkills(user.skills || []);
    }
  }, [user, reset]);

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await updateProfile(user.id, { name: data.name, skills });
      toast.success(res.message || 'Profile updated successfully.');
      updateUserData({ name: data.name, skills });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>View and update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Read-only fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" /> Email
              </Label>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="size-3.5" /> Programme
              </Label>
              <p className="text-sm font-medium">{user?.programme || 'Not specified'}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <GraduationCap className="size-3.5" /> Year of Study
              </Label>
              <p className="text-sm font-medium">{user?.yearOfStudy ? `Year ${user.yearOfStudy}` : 'Not specified'}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5" /> Joined
              </Label>
              <p className="text-sm font-medium">{joinDate}</p>
            </div>
          </div>

          <Separator />

          {/* Editable Name */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <UserIcon className="size-3.5 text-primary" /> Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <Separator />

            {/* Skills */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="size-3.5 text-secondary" /> Skills
              </Label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="gap-1.5 pl-3 pr-1.5 py-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                    onClick={() => removeSkill(skill)}
                  >
                    {skill}
                    <X className="size-3" />
                  </Badge>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No skills added yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g. Python, Data Analysis)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSkill} disabled={!newSkill.trim()}>
                  <Plus className="size-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}