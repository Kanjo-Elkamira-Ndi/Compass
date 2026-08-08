import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Inbox, Loader2, MessageSquare, ShieldAlert, UserCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/states';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';
import type { AppNotification, NotificationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NOTIFICATION_ICONS: Record<NotificationType, React.ElementType> = {
  COMPLAINT_SUBMITTED: ShieldAlert,
  COMPLAINT_ASSIGNED: UserCheck,
  COMPLAINT_REPLIED: MessageSquare,
  COMPLAINT_RESOLVED: CheckCircle2,
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pollTimer = useRef<number | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.data?.count ?? 0);
    } catch {
      // ignore polling errors
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getNotifications(false, 0, 20);
      const items = res.data?.content ?? [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    pollTimer.current = window.setInterval(fetchUnreadCount, 30000);
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, [fetchUnreadCount]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) fetchNotifications();
  };

  const handleOpen = async (notification: AppNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id).catch(() => undefined);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleMarkAllRead}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-10 w-10 text-muted-foreground" />}
            title="No notifications"
            description="You're all caught up."
            className="py-8"
          />
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="p-1">
              {notifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type] ?? Bell;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpen(notification)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        notification.read ? 'opacity-70' : 'bg-primary/5',
                      )}
                      aria-label={notification.title}
                    >
                      <div className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                        notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                      )}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{notification.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && <Badge className="mt-1 size-2 shrink-0 rounded-full bg-primary p-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
