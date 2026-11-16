import { Bell, CalendarClock, FlaskConical, Pill, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Avatar, Badge, Icon, IconButton, Text } from '@/shared/ui';
import { cn, formatRelative } from '@/shared/utils';

import type { Notification } from '../types';

const TYPE_META = {
  appointment: { label: 'Lịch khám', icon: CalendarClock },
  lab_result: { label: 'Xét nghiệm', icon: FlaskConical },
  prescription: { label: 'Đơn thuốc', icon: Pill },
  general: { label: 'Thông báo chung', icon: Bell },
};

export function NotificationCard({ notification, disabled, onPress, onDelete }: {
  notification: Notification;
  disabled?: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[notification.type] ?? TYPE_META.general;
  const unread = notification.is_read === 0;
  return (
    <View className={cn('flex-row items-start rounded-card border bg-surface p-3', unread ? 'border-primary bg-primary-soft/30' : 'border-border')}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${unread ? 'Chưa đọc' : 'Đã đọc'}. ${notification.title}. ${notification.body}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        className="min-w-0 flex-1 flex-row gap-3 py-1 active:opacity-80">
        {notification.avatar ? (
          <Avatar name={notification.title} uri={notification.avatar} />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft">
            <Icon as={meta.icon} size={22} color="primary-strong" />
          </View>
        )}
        <View className="min-w-0 flex-1 gap-2">
          <Text weight={unread ? 'bold' : 'medium'}>{notification.title}</Text>
          <Text tone="muted" numberOfLines={3}>{notification.body}</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={unread ? 'Chưa đọc' : 'Đã đọc'} tone={unread ? 'primary' : 'neutral'} />
            <Text variant="caption" tone="muted">{meta.label}</Text>
          </View>
          <Text variant="caption" tone="muted">{formatRelative(notification.created_at)}</Text>
        </View>
      </Pressable>
      <IconButton icon={Trash2} variant="ghost" disabled={disabled} accessibilityLabel={`Xóa thông báo ${notification.title}`} onPress={onDelete} />
    </View>
  );
}
