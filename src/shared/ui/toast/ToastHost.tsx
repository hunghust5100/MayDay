import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useEffect, useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeOutUp, LinearTransition, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadowStyle } from '@/shared/theme';

import { Icon, type IconColor } from '../icon/Icon';
import { Text } from '../text/Text';
import { dismissToast, getToasts, subscribeToasts, type ToastItem, type ToastType } from './toast-store';

const STYLE: Record<ToastType, { icon: LucideIcon; color: IconColor; bar: string }> = {
  success: { icon: CircleCheck, color: 'success', bar: 'bg-success' },
  error: { icon: CircleAlert, color: 'danger', bar: 'bg-danger' },
  warning: { icon: TriangleAlert, color: 'warning', bar: 'bg-warning' },
  info: { icon: Info, color: 'info', bar: 'bg-info' },
};

function ToastView({ item }: { item: ToastItem }) {
  const { icon, color, bar } = STYLE[item.type];

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration]);

  return (
    <Animated.View entering={SlideInUp.springify().damping(18)} exiting={FadeOutUp} layout={LinearTransition}>
      <Pressable
        accessibilityRole="alert"
        onPress={() => dismissToast(item.id)}
        className="flex-row items-center gap-3 overflow-hidden rounded-card border border-border bg-surface py-3.5 pl-4 pr-4"
        style={shadowStyle.overlay}>
        <View className={`absolute bottom-0 left-0 top-0 w-1 ${bar}`} />
        <Icon as={icon} size={22} color={color} />
        <Text weight="medium" className="flex-1">
          {item.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

/** Vùng hiển thị toast — đặt một lần ở gốc ứng dụng (AppProviders). */
export function ToastHost() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" className="absolute left-4 right-4 gap-2" style={{ top: insets.top + 8 }}>
      {items.map((item) => (
        <ToastView key={item.id} item={item} />
      ))}
    </View>
  );
}
