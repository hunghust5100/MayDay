import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { Tone } from '@/shared/types';
import { cn } from '@/shared/utils';

import { Icon, type IconColor } from '../icon/Icon';
import { Text } from '../text/Text';

const DOT: Record<Tone, { bg: string; ring: string; icon: IconColor }> = {
  neutral: { bg: 'bg-neutral', ring: 'bg-neutral-soft', icon: 'on-primary' },
  primary: { bg: 'bg-primary', ring: 'bg-primary-soft', icon: 'on-primary' },
  success: { bg: 'bg-success', ring: 'bg-success-soft', icon: 'on-primary' },
  warning: { bg: 'bg-warning', ring: 'bg-warning-soft', icon: 'on-primary' },
  danger: { bg: 'bg-danger', ring: 'bg-danger-soft', icon: 'on-primary' },
  info: { bg: 'bg-info', ring: 'bg-info-soft', icon: 'on-primary' },
};

export type TimelineItem = {
  key: string | number;
  title: string;
  /** Thời gian đã format, VD "08:30 · 06/11/2026". */
  time?: string;
  description?: string;
  tone?: Tone;
  icon?: LucideIcon;
  /** Nội dung thêm dưới mô tả (ảnh, badge...). */
  content?: ReactNode;
};

/** Dòng thời gian dọc — lịch sử khám, các mốc ảnh tổn thương. */
export function Timeline({ items, className }: { items: readonly TimelineItem[]; className?: string }) {
  return (
    <View className={className}>
      {items.map((item, index) => {
        const dot = DOT[item.tone ?? 'primary'];
        const last = index === items.length - 1;
        return (
          <View key={item.key} className="flex-row gap-3">
            <View className="w-7 items-center">
              <View className={cn('h-7 w-7 items-center justify-center rounded-full', dot.ring)}>
                <View className={cn('items-center justify-center rounded-full', dot.bg, item.icon ? 'h-6 w-6' : 'h-3 w-3')}>
                  {item.icon && <Icon as={item.icon} size={13} strokeWidth={2.5} color={dot.icon} />}
                </View>
              </View>
              {!last && <View className="my-1 w-0.5 flex-1 rounded-full bg-border" />}
            </View>
            <View className={cn('flex-1 gap-1 pt-0.5', !last && 'pb-5')}>
              <View className="flex-row items-start justify-between gap-2">
                <Text weight="semibold" className="flex-1">
                  {item.title}
                </Text>
                {item.time && (
                  <Text variant="caption" tone="muted">
                    {item.time}
                  </Text>
                )}
              </View>
              {item.description && (
                <Text variant="caption" tone="muted">
                  {item.description}
                </Text>
              )}
              {item.content && <View className="mt-1.5">{item.content}</View>}
            </View>
          </View>
        );
      })}
    </View>
  );
}
