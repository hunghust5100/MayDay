import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/shared/theme';

const ICON_COLORS = {
  text: colors.text,
  muted: colors.muted,
  subtle: colors.subtle,
  primary: colors.primary.DEFAULT,
  'primary-strong': colors.primary.strong,
  'on-primary': colors['on-primary'],
  success: colors.success.strong,
  warning: colors.warning.strong,
  danger: colors.danger.DEFAULT,
  info: colors.info.strong,
} as const;

export type IconColor = keyof typeof ICON_COLORS;

export type IconProps = {
  /** Icon từ `lucide-react-native`, VD `Bell`. */
  as: LucideIcon;
  size?: number;
  /** Tên màu trong theme, hoặc mã màu bất kỳ. */
  color?: IconColor | (string & {});
  strokeWidth?: number;
};

export function Icon({ as: Component, size = 20, color = 'text', strokeWidth = 2 }: IconProps) {
  const resolved = color in ICON_COLORS ? ICON_COLORS[color as IconColor] : color;
  return <Component size={size} color={resolved} strokeWidth={strokeWidth} />;
}
