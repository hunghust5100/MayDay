import { Pressable, View } from 'react-native';

import { cn } from '@/shared/utils';

import { Text } from '../text/Text';

export type SectionHeaderProps = {
  title: string;
  /** Nhãn link bên phải, VD "Xem tất cả". */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={cn('mb-2.5 mt-5 flex-row items-center justify-between', className)}>
      <Text variant="h2" accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onAction} className="active:opacity-60">
          <Text variant="caption" weight="semibold" tone="primary">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
