import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { shadowStyle } from '@/shared/theme';
import { tv, type VariantProps } from '@/shared/utils';

import { Icon, type IconColor } from '../icon/Icon';
import { Text } from '../text/Text';

const button = tv({
  slots: {
    base: 'flex-row items-center justify-center gap-2 rounded-btn active:opacity-85',
    label: 'font-sans-bold',
  },
  variants: {
    variant: {
      primary: { base: 'bg-primary', label: 'text-on-primary' },
      soft: { base: 'bg-primary-soft', label: 'text-primary-strong' },
      outline: { base: 'border-[1.5px] border-primary bg-transparent', label: 'text-primary' },
      ghost: { base: 'bg-transparent', label: 'text-primary-strong' },
      danger: { base: 'bg-danger', label: 'text-on-primary' },
      /** Thao tác nguy hiểm phụ (VD "Xóa" dưới cùng màn chi tiết). */
      'danger-soft': { base: 'bg-danger-soft', label: 'text-danger-strong' },
    },
    size: {
      md: { base: 'h-[52px] px-5', label: 'text-md' },
      sm: { base: 'h-[38px] px-4', label: 'text-sm' },
    },
    fullWidth: { true: { base: 'self-stretch' }, false: { base: 'self-start' } },
    disabled: { true: { base: 'opacity-50' } },
  },
  defaultVariants: { variant: 'primary', size: 'md', fullWidth: false },
});

type ButtonVariant = NonNullable<VariantProps<typeof button>['variant']>;

const CONTENT_COLOR: Record<ButtonVariant, IconColor> = {
  primary: 'on-primary',
  soft: 'primary-strong',
  outline: 'primary',
  ghost: 'primary-strong',
  danger: 'on-primary',
  'danger-soft': 'danger',
};

export type ButtonProps = Omit<PressableProps, 'children'> &
  Omit<VariantProps<typeof button>, 'disabled'> & {
    title: string;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
    /** Hiện vòng xoay và chặn bấm. */
    loading?: boolean;
    className?: string;
  };

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  const styles = button({ variant, size, fullWidth, disabled: isDisabled });
  const contentColor = CONTENT_COLOR[variant];
  const iconSize = size === 'sm' ? 16 : 20;
  const hasShadow = variant === 'primary' && size === 'md' && !isDisabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={styles.base({ className })}
      style={hasShadow ? [shadowStyle.primary, style as object] : style}
      {...props}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : undefined} />
      ) : (
        leftIcon && <Icon as={leftIcon} size={iconSize} color={contentColor} />
      )}
      <Text className={styles.label()}>{title}</Text>
      {!loading && rightIcon && <Icon as={rightIcon} size={iconSize} color={contentColor} />}
    </Pressable>
  );
}
