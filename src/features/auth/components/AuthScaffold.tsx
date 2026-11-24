import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, HeartPulse } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { APP_NAME } from '@/shared/constants';
import { Card, Icon, IconButton, Screen, Text } from '@/shared/ui';

type AuthScaffoldProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScaffold({ title, subtitle, onBack, children, footer }: AuthScaffoldProps) {
  return (
    <Screen contentClassName="justify-center py-4 roomy:py-8">
      <StatusBar style="dark" />
      <View className="w-full max-w-[460px] self-center gap-4 roomy:gap-6">
        <View className="flex-row items-center gap-2">
          {onBack && <IconButton icon={ChevronLeft} accessibilityLabel="Quay lại" onPress={onBack} />}
          <View className="h-[40px] w-[40px] items-center justify-center rounded-input bg-primary">
            <Icon as={HeartPulse} size={23} color="on-primary" />
          </View>
          <Text variant="h2" tone="primary">
            {APP_NAME}
          </Text>
        </View>
        <Card padding="lg" className="gap-4 roomy:gap-5">
          <View className="gap-1">
            <Text variant="h1" accessibilityRole="header">
              {title}
            </Text>
            {subtitle && <Text tone="muted">{subtitle}</Text>}
          </View>
          {children}
        </Card>
        {footer && <View className="gap-2">{footer}</View>}
      </View>
    </Screen>
  );
}
