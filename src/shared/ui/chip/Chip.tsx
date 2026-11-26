import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View, type PressableProps } from 'react-native';

import { cn, tv } from '@/shared/utils';

import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

const chip = tv({
  slots: {
    base: 'min-h-9 max-w-full flex-row items-center gap-1.5 self-start rounded-full px-3 py-1',
    label: 'shrink font-sans-semibold text-sm',
    count: 'min-h-5 min-w-5 items-center justify-center rounded-full px-1.5',
    countLabel: 'font-sans-semibold text-xs',
  },
  variants: {
    variant: {
      /** Bộ lọc: viền xám, chọn → nền primary. */
      filter: {},
      /** Nhãn mềm nền primary-soft (VD chip ngày). */
      soft: { base: 'bg-primary-soft', label: 'text-primary-strong' },
    },
    selected: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      variant: 'filter',
      selected: false,
      class: { base: 'border border-border bg-surface', label: 'text-muted', count: 'bg-surface-2', countLabel: 'text-text' },
    },
    {
      variant: 'filter',
      selected: true,
      class: { base: 'border border-primary bg-primary', label: 'text-on-primary', count: 'bg-white/25', countLabel: 'text-on-primary' },
    },
  ],
  defaultVariants: { variant: 'filter', selected: false },
});

export type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'filter' | 'soft';
  selected?: boolean;
  count?: number;
  icon?: LucideIcon;
  className?: string;
};

export function Chip({ label, variant = 'filter', selected = false, count, icon, className, ...props }: ChipProps) {
  const styles = chip({ variant, selected });
  const iconColor = variant === 'soft' ? 'primary-strong' : selected ? 'on-primary' : 'muted';

  const content = (
    <>
      {icon && <Icon as={icon} size={16} color={iconColor} />}
      <Text className={styles.label()}>{label}</Text>
      {count !== undefined && (
        <View className={styles.count()}>
          <Text className={styles.countLabel()}>{count}</Text>
        </View>
      )}
    </>
  );

  if (!props.onPress) return <View className={styles.base({ className })}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={styles.base({ className: cn('min-h-[44px] active:opacity-80', className) })}
      {...props}>
      {content}
    </Pressable>
  );
}
