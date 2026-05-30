import { apiClient } from '@lib/api-client';
import type { INotification, PaginatedList } from '@contracts';

export interface ListNotificationsFilters {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

export const notificationsService = {
  list(filters: ListNotificationsFilters = {}): Promise<PaginatedList<INotification>> {
    return apiClient.getPaginated<INotification>('/api/v1/notifications', {
      params: { per_page: 20, ...filters } as Record<string, unknown>,
    });
  },

  unreadCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/api/v1/notifications/unread-count');
  },

  markRead(id: string): Promise<void> {
    return apiClient.patch<void>(`/api/v1/notifications/${id}/read`);
  },

  markAllRead(): Promise<{ count: number }> {
    return apiClient.patch<{ count: number }>('/api/v1/notifications/read-all');
  },
};
