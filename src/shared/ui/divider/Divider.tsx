import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { Text } from '../text/Text';

/** Đường kẻ ngang; có `label` thì chữ nằm giữa (VD "hoặc"). */
export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <View className={cn('h-px bg-border', className)} />;
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <View className="h-px flex-1 bg-border" />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
