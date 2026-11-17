import type { Page } from '@/core/api';

export type NotificationType = 'appointment' | 'lab_result' | 'prescription' | 'general';

export type Notification = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: NotificationType;
  avatar?: string | null;
  reference_id?: number | null;
  is_read: 0 | 1;
  created_at: string;
  updated_at: string;
};

export type NotificationMetadata = { unread_count: number };
export type NotificationPage = Page<Notification, NotificationMetadata>;
export type RegisterTokenRequest = { fcm_token: string; device_type: 'android' | 'ios' | 'web' };
export type FcmToken = RegisterTokenRequest & {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
};
