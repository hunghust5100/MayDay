import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, HeartPulse } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME } from '@/shared/constants';
import { shadowStyle } from '@/shared/theme';
import { Icon, Screen, Text } from '@/shared/ui';

import { SecurityNote } from './SecurityNote';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  /** Có thì hiện nút quay lại trên header. */
  onBack?: () => void;
  /** Nội dung trong thẻ trắng (form). */
  children: ReactNode;
  /** Phần dưới thẻ: liên kết chuyển màn… */
  footer?: ReactNode;
};

/**
 * Khung chung của các màn xác thực: header xanh tràn viền (logo, tiêu đề) + thẻ form nổi lên đè header.
 */
export function AuthScaffold({ title, subtitle, onBack, children, footer }: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <Screen padded={false} safeTop={false} contentClassName="pb-6">
      <StatusBar style="light" />
      <View className="overflow-hidden rounded-b-[32px] bg-primary px-6 pb-16" style={{ paddingTop: insets.top + 20 }}>
        {/* Họa tiết trang trí */}
        <View className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <View className="absolute -right-6 top-24 h-28 w-28 rounded-full bg-white/10" />
        <View className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-primary-strong/40" />

        <View className="flex-row items-center gap-3">
          {onBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              hitSlop={8}
              onPress={onBack}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/15 active:opacity-70">
              <Icon as={ChevronLeft} size={22} color="on-primary" />
            </Pressable>
          )}
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
            <Icon as={HeartPulse} size={22} color="primary" />
          </View>
          <Text variant="h2" tone="inverse">
            {APP_NAME}
          </Text>
        </View>

        <Text variant="display" tone="inverse" className="mt-8" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="body-lg" className="mt-2 text-white/80">
          {subtitle}
        </Text>
      </View>

      <View className="-mt-10 mx-5 rounded-sheet bg-surface p-5" style={shadowStyle.raised}>
        {children}
      </View>

      {footer && <View className="mx-5 mt-6">{footer}</View>}
      <SecurityNote className="mt-auto pt-8" />
    </Screen>
  );
}
