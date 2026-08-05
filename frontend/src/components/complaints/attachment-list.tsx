import React from 'react';
import { Paperclip, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getComplaintAttachmentUrl } from '@/api/complaints';
import type { ComplaintAttachment } from '@/types';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentListProps {
  complaintId: string;
  attachments: ComplaintAttachment[];
}

export function AttachmentList({ complaintId, attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</span>
          <Button asChild variant="ghost" size="icon" className="size-7" aria-label={`Download ${attachment.fileName}`}>
            <a href={getComplaintAttachmentUrl(complaintId, attachment.id)} download>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
