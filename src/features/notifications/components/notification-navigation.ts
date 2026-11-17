import type { RoleGroup } from '@/core/auth';

import type { Notification } from '../types';

type NotificationRoute = '/patient/prescriptions' | '/doctor/prescriptions' | '/patient/labs' | '/doctor/labs';

/** Route cấp module đã tồn tại; chưa có route chi tiết để diễn giải reference_id. */
export function getNotificationRoute(notification: Notification, roleGroup: RoleGroup): NotificationRoute | null {
  if (roleGroup === 'admin' || !Number.isInteger(notification.reference_id) || (notification.reference_id ?? 0) <= 0) return null;
  if (notification.type === 'prescription') return roleGroup === 'patient' ? '/patient/prescriptions' : '/doctor/prescriptions';
  if (notification.type === 'lab_result') return roleGroup === 'patient' ? '/patient/labs' : '/doctor/labs';
  return null;
}
