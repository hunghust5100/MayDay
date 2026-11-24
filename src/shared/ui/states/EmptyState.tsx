import { CircleAlert, Inbox, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { Button } from '../button/Button';
import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  /** Chiếm toàn bộ vùng cha, căn giữa. */
  fill?: boolean;
  className?: string;
  /** Nội bộ: tông màu vòng icon. */
  tone?: 'primary' | 'danger';
};

/** Trạng thái rỗng: icon trong vòng tròn, tiêu đề, mô tả, nút hành động. */
export function EmptyState({
  title,
  description,
  icon = Inbox,
  actionLabel,
  onAction,
  fill = false,
  tone = 'primary',
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center px-4 py-6 roomy:px-6 roomy:py-8', fill && 'flex-1', className)}>
      <View
        className={cn(
          'mb-3 h-[52px] w-[52px] items-center justify-center rounded-tile',
          tone === 'danger' ? 'bg-danger-soft' : 'bg-primary-soft',
        )}>
        <Icon as={icon} size={24} color={tone === 'danger' ? 'danger' : 'primary'} />
      </View>
      <Text variant="h3" align="center">
        {title}
      </Text>
      {description && (
        <Text tone="muted" align="center" className="mt-1.5 max-w-[380px]">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="soft" size="sm" onPress={onAction} className="mt-5 self-center" />
      )}
    </View>
  );
}

export type ErrorStateProps = Omit<EmptyStateProps, 'tone' | 'actionLabel' | 'onAction' | 'title'> & {
  title?: string;
  /** Có thì hiện nút "Thử lại". */
  onRetry?: () => void;
};

/** Trạng thái lỗi khi tải dữ liệu, có nút "Thử lại". */
export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description = 'Không tải được dữ liệu. Vui lòng kiểm tra kết nối và thử lại.',
  icon = CircleAlert,
  onRetry,
  ...props
}: ErrorStateProps) {
  return (
    <EmptyState
      {...props}
      tone="danger"
      icon={icon}
      title={title}
      description={description}
      actionLabel={onRetry ? 'Thử lại' : undefined}
      onAction={onRetry}
    />
  );
}

