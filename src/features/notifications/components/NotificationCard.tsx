import { Bell, CalendarClock, FlaskConical, Pill } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Avatar, Icon, Text } from '@/shared/ui';
import { cn, formatRelative } from '@/shared/utils';

import type { Notification } from '../types';

const TYPE_META = {
  appointment: { label: 'Lịch khám', icon: CalendarClock },
  lab_result: { label: 'Xét nghiệm', icon: FlaskConical },
  prescription: { label: 'Đơn thuốc', icon: Pill },
  general: { label: 'Thông báo chung', icon: Bell },
};

export function NotificationCard({ notification, onPress }: {
  notification: Notification;
  onPress: () => void;
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.general;
  const unread = notification.is_read === 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Chưa đọc. ' : ''}${notification.title}`}
      onPress={onPress}
      className={cn('min-h-[48px] flex-row items-start gap-2.5 rounded-card border p-3 active:opacity-80', unread ? 'border-primary/30 bg-primary-soft/40' : 'border-border bg-surface')}>
      {notification.avatar ? (
        <Avatar name={notification.title} uri={notification.avatar} size="sm" className="shrink-0" />
      ) : (
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft">
          <Icon as={meta.icon} size={18} color="primary-strong" />
        </View>
      )}
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-start gap-2">
          <Text weight={unread ? 'bold' : 'semibold'} numberOfLines={2} className="min-w-0 flex-1">{notification.title}</Text>
          {unread && <View className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>{notification.body}</Text>
        <Text variant="caption" tone="muted">{meta.label} · {formatRelative(notification.created_at)}</Text>
      </View>
    </Pressable>
  );
}
