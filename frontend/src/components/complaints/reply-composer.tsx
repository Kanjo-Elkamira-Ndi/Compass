import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addComplaintReply, suggestComplaintReply } from '@/api/complaints';
import type { Complaint, Role } from '@/types';

interface ReplyComposerProps {
  complaint: Complaint;
  role: Role;
  onReplied: (complaint: Complaint) => void;
}

export function ReplyComposer({ complaint, role, onReplied }: ReplyComposerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const isStaff = role === 'ADMIN' || role === 'LECTURER';
  const disabled = complaint.status === 'CLOSED';

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      const res = await addComplaintReply(complaint.id, message.trim());
      toast.success('Reply sent.');
      onReplied(res.data);
      setMessage('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await suggestComplaintReply(complaint.id);
      setMessage(res.data.suggestion);
      toast.success('AI suggestion generated. Review and edit before sending.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate suggestion.');
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          disabled
            ? 'This complaint is closed and no longer accepts replies.'
            : isStaff
              ? 'Write a reply to the student...'
              : 'Add more information or follow up...'
        }
        disabled={disabled}
        aria-label="Reply message"
      />
      <div className="flex items-center justify-between gap-2">
        {isStaff && !disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="gap-2"
          >
            {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Suggest Reply
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={handleSend} disabled={disabled || isSending || !message.trim()} className="gap-2">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Reply
        </Button>
      </div>
    </div>
  );
}
