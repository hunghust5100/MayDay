import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { shadowStyle } from '@/shared/theme';
import { Icon, Text } from '@/shared/ui';

type ActionBannerProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

/** Thẻ nổi bật màu chủ đạo kêu gọi hành động chính của ngày. */
export function ActionBanner({ icon, title, description, actionLabel, onPress }: ActionBannerProps) {
  return (
    <View className="overflow-hidden rounded-card bg-primary p-5" style={shadowStyle.primary}>
      <View className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <View className="absolute -bottom-16 right-16 h-28 w-28 rounded-full bg-white/10" />
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/20">
        <Icon as={icon} size={22} color="on-primary" />
      </View>
      <Text variant="h2" tone="inverse" className="mt-4">
        {title}
      </Text>
      <Text variant="caption" className="mt-1 text-white/85">
        {description}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="mt-4 h-11 flex-row items-center gap-2 self-start rounded-full bg-white px-5 active:opacity-85">
        <Text weight="bold" tone="primary">
          {actionLabel}
        </Text>
        <Icon as={ArrowRight} size={18} color="primary-strong" />
      </Pressable>
    </View>
  );
}
