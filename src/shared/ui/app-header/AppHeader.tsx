import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { IconButton } from '../icon-button/IconButton';
import { Text } from '../text/Text';

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  /** Có thì hiện nút quay lại bên trái. */
  onBack?: () => void;
  /** Hành động bên phải (thường là một IconButton). */
  right?: ReactNode;
  className?: string;
};

/** Thanh tiêu đề màn hình con: quay lại – tiêu đề giữa – hành động phải. */
export function AppHeader({ title, subtitle, onBack, right, className }: AppHeaderProps) {
  return (
    <View
      className={cn(
        'min-h-[52px] flex-row items-center gap-2 pb-2 pt-1 roomy:gap-3 roomy:pb-3 roomy:pt-1.5',
        className,
      )}
    >
      <View className="w-[44px]">
        {onBack && <IconButton icon={ChevronLeft} accessibilityLabel="Quay lại" onPress={onBack} />}
      </View>
      <View className="flex-1 items-center">
        <Text variant="h2" align="center" numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View className="min-w-[44px] items-end">{right}</View>
    </View>
  );
}
