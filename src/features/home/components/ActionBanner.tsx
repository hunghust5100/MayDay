import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button, Icon, Text } from '@/shared/ui';

type ActionBannerProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
};

export function ActionBanner({ icon, title, description, actionLabel, onPress }: ActionBannerProps) {
  return (
    <View className="gap-4 rounded-sheet bg-primary-strong p-4 roomy:p-6">
      <View className="flex-row items-start gap-3">
        <View className="h-[44px] w-[44px] shrink-0 items-center justify-center rounded-input bg-white/15">
          <Icon as={icon} size={24} color="on-primary" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text variant="h2" tone="inverse" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="caption" tone="inverse">
            {description}
          </Text>
        </View>
      </View>
      <Button title={actionLabel} variant="soft" rightIcon={ArrowRight} onPress={onPress} />
    </View>
  );
}
