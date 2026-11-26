import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { View, useWindowDimensions } from 'react-native';

import { Card, Icon, Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

export type QuickAction = { label: string; icon: LucideIcon; onPress: () => void };

export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 340 || fontScale > 1.25;
  return (
    <View className="-mx-1 flex-row flex-wrap">
      {actions.map(({ label, icon, onPress }) => (
        <View key={label} className={cn('mb-2 px-1', singleColumn ? 'w-full' : 'w-1/2')}>
          <Card
            accessibilityLabel={label}
            onPress={onPress}
            padding="sm"
            className="min-h-[60px] flex-1 flex-row items-center gap-2"
          >
            <View className="h-9 w-9 shrink-0 items-center justify-center rounded-input bg-primary-soft">
              <Icon as={icon} size={19} color="primary-strong" />
            </View>
            <Text variant="caption" weight="semibold" className="min-w-0 flex-1">
              {label}
            </Text>
            {singleColumn && <Icon as={ChevronRight} size={17} color="muted" />}
          </Card>
        </View>
      ))}
    </View>
  );
}
