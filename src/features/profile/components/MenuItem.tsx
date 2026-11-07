import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon, ListItem } from '@/shared/ui';

/** Dòng menu có icon trong ô tròn màu nhạt. */
export function MenuItem({
  icon,
  title,
  description,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  onPress: () => void;
}) {
  return (
    <ListItem
      title={title}
      description={description}
      onPress={onPress}
      leading={
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
          <Icon as={icon} size={20} color="primary-strong" />
        </View>
      }
    />
  );
}
