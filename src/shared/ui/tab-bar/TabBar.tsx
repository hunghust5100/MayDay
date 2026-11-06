import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/shared/theme';

import { Text } from '../text/Text';

/**
 * Thanh tab dưới đáy theo thiết kế: nền trắng, viền trên, tab đang chọn màu primary, có huy hiệu số.
 * Dùng: `<Tabs tabBar={(props) => <TabBar {...props} />}>`; icon khai báo qua `options.tabBarIcon`,
 * số đếm qua `options.tabBarBadge`; ẩn tab bằng `href: null`.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-row border-t border-border bg-surface pt-2" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (StyleSheet.flatten(options.tabBarItemStyle)?.display === 'none') return null;

        const focused = state.index === index;
        const color = focused ? colors.primary.DEFAULT : colors.subtle;
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
        const badge = options.tabBarBadge;

        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            className="flex-1 items-center gap-1 py-1">
            <View>
              {options.tabBarIcon?.({ focused, color, size: 24 })}
              {badge !== undefined && badge !== null && badge !== 0 && (
                <View className="absolute -right-2.5 -top-1.5 h-4 min-w-4 items-center justify-center rounded-full border-2 border-surface bg-danger px-1">
                  <Text className="font-sans-bold text-[9px] leading-3 text-on-primary">{badge}</Text>
                </View>
              )}
            </View>
            <Text variant="tiny" weight={focused ? 'bold' : 'medium'} style={{ color }} className="text-[11px]">
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
