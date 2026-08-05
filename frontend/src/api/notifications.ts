import { api } from './client';
import type { ApiResponse, AppNotification, Paginated } from '@/types';

export async function getNotifications(
  unreadOnly = false,
  page = 0,
  size = 20,
): Promise<ApiResponse<Paginated<AppNotification>>> {
  const { data } = await api.get('/notifications', { params: { unreadOnly, page, size } });
  return data;
}

export async function getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
  const { data } = await api.get('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}
