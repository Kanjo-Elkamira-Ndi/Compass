import React, { useEffect, useState } from 'react';
import { Paperclip, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createComplaint } from '@/api/complaints';
import type { Complaint, ComplaintCategory, ComplaintPriority } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'EXAMINATION', label: 'Examination' },
  { value: 'FACILITY', label: 'Facility' },
  { value: 'FINANCIAL', label: 'Financial' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITIES: { value: ComplaintPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (complaint: Complaint) => void;
}

interface FormValues {
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  anonymous: boolean;
}

export function ComplaintForm({ open, onOpenChange, onCreated }: ComplaintFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { subject: '', description: '', category: 'ACADEMIC', priority: 'MEDIUM', anonymous: false },
  });

  useEffect(() => {
    if (open) {
      reset({ subject: '', description: '', category: 'ACADEMIC', priority: 'MEDIUM', anonymous: false });
      setFiles([]);
    }
  }, [open, reset]);

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const list = Array.from(selected);
    const nonEmpty = list.filter((f) => f.size > 0);
    if (files.length + nonEmpty.length > MAX_FILES) {
      toast.error(`You can attach a maximum of ${MAX_FILES} files.`);
      return;
    }
    if (nonEmpty.some((f) => f.size > MAX_FILE_SIZE)) {
      toast.error('Each file must be 10MB or smaller.');
      return;
    }
    setFiles((prev) => [...prev, ...nonEmpty]);
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.subject.trim() || !values.description.trim()) {
      toast.error('Please fill in the subject and description.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createComplaint({
        subject: values.subject.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
        anonymous: values.anonymous,
        files,
      });
      toast.success('Complaint submitted successfully.');
      onCreated(res.data);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a Complaint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="complaint-subject">Subject</Label>
            <Input
              id="complaint-subject"
              placeholder="Briefly describe the issue"
              {...register('subject')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={watch('category')} onValueChange={(v) => setValue('category', v as ComplaintCategory)}>
                <SelectTrigger aria-label="Select category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v as ComplaintPriority)}>
                <SelectTrigger aria-label="Select priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-description">Description</Label>
            <Textarea
              id="complaint-description"
              rows={5}
              placeholder="Provide as much detail as possible about your complaint"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments (optional)</Label>
            <label
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors',
                'hover:border-primary hover:text-primary',
              )}
            >
              <UploadCloud className="h-5 w-5" />
              <span>Click to attach files (up to {MAX_FILES}, 10MB each)</span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                aria-label="Attach files"
              />
            </label>
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="complaint-anonymous"
              checked={watch('anonymous')}
              onCheckedChange={(checked) => setValue('anonymous', checked === true)}
            />
            <Label htmlFor="complaint-anonymous" className="text-sm font-normal">
              Submit anonymously (your name will be hidden from staff)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
