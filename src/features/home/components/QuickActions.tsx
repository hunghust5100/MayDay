import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { IconTile, type IconTileTone } from '@/shared/ui';

export type QuickAction = { label: string; icon: LucideIcon; tone: IconTileTone; onPress: () => void };

/** Lưới lối tắt 4 cột. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View className="-mx-1 flex-row flex-wrap">
      {actions.map((action) => (
        <View key={action.label} className="mb-4 w-1/4 px-1">
          <IconTile icon={action.icon} tone={action.tone} label={action.label} onPress={action.onPress} />
        </View>
      ))}
    </View>
  );
}
