import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { Text } from '../text/Text';

export type ScreenTitleProps = {
  title: string;
  /** Dòng nhỏ phía trên tiêu đề, VD ngày hôm nay hoặc "BS. Trần Minh · Khoa Da liễu". */
  eyebrow?: string;
  /** Hành động bên phải (thường là IconButton). */
  right?: ReactNode;
  className?: string;
};

/** Tiêu đề lớn của màn hình gốc trong tab (không có nút quay lại). */
export function ScreenTitle({ title, eyebrow, right, className }: ScreenTitleProps) {
  return (
    <View className={cn('flex-row items-end gap-2 pb-3 pt-2 roomy:gap-3 roomy:pb-4 roomy:pt-3', className)}>
      <View className="min-w-0 flex-1">
        {eyebrow && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {eyebrow}
          </Text>
        )}
        <Text variant="h1" numberOfLines={2} accessibilityRole="header" className={eyebrow ? 'mt-0.5' : undefined}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
