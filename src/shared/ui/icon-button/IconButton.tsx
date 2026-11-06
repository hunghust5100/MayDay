import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View, type PressableProps } from 'react-native';

import { shadowStyle } from '@/shared/theme';
import { tv, type VariantProps } from '@/shared/utils';

import { Icon, type IconColor } from '../icon/Icon';
import { Text } from '../text/Text';

const iconButton = tv({
  base: 'h-11 w-11 items-center justify-center rounded-btn active:opacity-75',
  variants: {
    variant: {
      surface: 'border border-border bg-surface',
      soft: 'bg-primary-soft',
      ghost: 'bg-transparent',
    },
    disabled: { true: 'opacity-50' },
  },
  defaultVariants: { variant: 'surface' },
});

type IconButtonVariant = NonNullable<VariantProps<typeof iconButton>['variant']>;

const ICON_COLOR: Record<IconButtonVariant, IconColor> = {
  surface: 'text',
  soft: 'primary-strong',
  ghost: 'text',
};

export type IconButtonProps = Omit<PressableProps, 'children'> &
  Omit<VariantProps<typeof iconButton>, 'disabled'> & {
    icon: LucideIcon;
    /** Bắt buộc — đọc cho trình đọc màn hình. */
    accessibilityLabel: string;
    /** `true` = chấm đỏ, số = huy hiệu đếm (> 99 hiển thị 99+). */
    badge?: boolean | number;
    className?: string;
  };

export function IconButton({ icon, variant = 'surface', badge, disabled, className, style, ...props }: IconButtonProps) {
  const showCount = typeof badge === 'number' && badge > 0;
  const showDot = badge === true;

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      disabled={disabled}
      className={iconButton({ variant, disabled: Boolean(disabled), className })}
      style={variant === 'surface' ? [shadowStyle.card, style as object] : style}
      {...props}>
      <Icon as={icon} size={22} color={ICON_COLOR[variant]} />
      {showDot && (
        <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-danger" />
      )}
      {showCount && (
        <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1">
          <Text className="font-sans-bold text-[10px] leading-3 text-on-primary">{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}
