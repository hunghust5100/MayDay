import { api, ApiError } from '@/core/api';

import type { FcmToken, Notification, NotificationMetadata, RegisterTokenRequest } from '../types';

export const notificationsApi = {
  list: async ({ signal, ...query }: { page: number; limit: number; signal?: AbortSignal }) => {
    const page = await api.getPage<Notification, NotificationMetadata>('/notifications', { query, signal });
    // Không tự đếm trên trang hiện tại: unread_count là tổng của toàn bộ hộp thư.
    if (!Number.isInteger(page.unread_count) || page.unread_count < 0) throw new ApiError('BAD_RESPONSE');
    return page;
  },
  markRead: (id: number) => api.put<Notification>(`/notifications/${id}`),
  markAllRead: () => api.put<{ updated_count: number }>('/notifications/read-all'),
  remove: (id: number) => api.delete<Record<string, never>>(`/notifications/${id}`),
  /** Chỉ gọi khi hạ tầng native đã cung cấp FCM token thật; không dùng Expo push token thay thế. */
  registerToken: (body: RegisterTokenRequest) => api.post<FcmToken>('/notifications/register_token', body),
};
