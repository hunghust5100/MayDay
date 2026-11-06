import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { colors } from '@/shared/theme';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  /** `true` = hình tròn (avatar). */
  circle?: boolean;
  className?: string;
};

/** Khung giả nhấp nháy, giữ chỗ khi đang tải dữ liệu. */
export function Skeleton({ width = '100%', height = 16, circle = false, className }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.45, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={className}
      style={[{ width, height, borderRadius: circle ? 9999 : 8, backgroundColor: colors.border }, animatedStyle]}
    />
  );
}
