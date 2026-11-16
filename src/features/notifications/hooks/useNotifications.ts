import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usePaginatedQuery } from '@/core/api';

import { notificationsApi } from '../api/notifications-api';
import type { Notification } from '../types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications', 'list'] as const;

export function useNotifications() {
  const query = usePaginatedQuery<Notification, { unread_count: number }>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    pageErrorFeedback: true,
    queryFn: notificationsApi.list,
  });

  return {
    ...query,
    unreadCount: query.firstPage?.unread_count ?? 0,
  };
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: (id: number) => notificationsApi.markRead(id), onSuccess: invalidate });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: (id: number) => notificationsApi.remove(id), onSuccess: invalidate });
}
