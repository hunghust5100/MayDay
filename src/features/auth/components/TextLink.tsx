import { Pressable, View } from 'react-native';

import { Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

/** "Câu dẫn  Liên kết" — VD "Đã có tài khoản? Đăng nhập". */
export function TextLink({
  prompt,
  label,
  onPress,
  className,
}: {
  prompt?: string;
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-center justify-center gap-1', className)}>
      {prompt && <Text tone="muted">{prompt}</Text>}
      <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress}>
        <Text weight="semibold" tone="primary">
          {label}
        </Text>
      </Pressable>
    </View>
  );
}
