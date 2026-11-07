import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon, Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

export function SecurityNote({ className }: { className?: string }) {
  return (
    <View className={cn('flex-row items-center justify-center gap-2', className)}>
      <Icon as={ShieldCheck} size={16} color="muted" />
      <Text variant="tiny" tone="muted">
        Dữ liệu y tế được mã hóa và bảo mật
      </Text>
    </View>
  );
}
