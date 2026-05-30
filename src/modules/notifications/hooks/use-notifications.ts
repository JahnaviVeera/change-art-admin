import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { toastApiError } from '@lib/toast-error';
import {
  notificationsService,
  type ListNotificationsFilters,
} from '../services/notifications.service';

export function useNotifications(filters: ListNotificationsFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(filters as Record<string, unknown>),
    queryFn: () => notificationsService.list(filters),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
    onError: (err) => toastApiError(err),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
    onError: (err) => toastApiError(err),
  });
}
