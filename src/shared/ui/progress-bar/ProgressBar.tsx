import { View } from 'react-native';

import type { Tone } from '@/shared/types';
import { cn } from '@/shared/utils';

const FILL: Record<Tone, string> = {
  neutral: 'bg-neutral',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export type ProgressBarProps = {
  /** Tiến độ từ 0 tới 1. */
  value: number;
  tone?: Tone;
  className?: string;
};

export function ProgressBar({ value, tone = 'primary', className }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      className={cn('h-2 overflow-hidden rounded-full bg-surface-2', className)}>
      <View className={cn('h-full rounded-full', FILL[tone])} style={{ width: `${percent}%` }} />
    </View>
  );
}
