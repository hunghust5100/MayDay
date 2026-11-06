import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/shared/theme';
import { cn } from '@/shared/utils';

import { Text } from '../text/Text';

export type SpinnerProps = {
  size?: 'small' | 'large';
  /** Dòng chữ dưới vòng xoay. */
  label?: string;
  /** Chiếm toàn bộ vùng cha, căn giữa. */
  fill?: boolean;
  className?: string;
};

export function Spinner({ size = 'large', label, fill = false, className }: SpinnerProps) {
  return (
    <View className={cn('items-center justify-center gap-3', fill && 'flex-1', className)}>
      <ActivityIndicator size={size} color={colors.primary.DEFAULT} />
      {label && (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      )}
    </View>
  );
}
