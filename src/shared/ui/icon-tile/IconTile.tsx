import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View, type PressableProps } from 'react-native';

import { colors } from '@/shared/theme';
import { cn } from '@/shared/utils';

import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

const TONES = {
  teal: { bg: colors.tile.teal, fg: colors.tile['teal-fg'] },
  indigo: { bg: colors.tile.indigo, fg: colors.tile['indigo-fg'] },
  rose: { bg: colors.tile.rose, fg: colors.tile['rose-fg'] },
  amber: { bg: colors.tile.amber, fg: colors.tile['amber-fg'] },
} as const;

export type IconTileTone = keyof typeof TONES;

export type IconTileProps = Omit<PressableProps, 'children'> & {
  icon: LucideIcon;
  tone?: IconTileTone;
  size?: 'sm' | 'md';
  /** Nhãn dưới ô (tối đa 2 dòng). */
  label?: string;
  className?: string;
};

/** Ô icon màu 58×58 — dùng cho lối tắt truy cập nhanh. */
export function IconTile({ icon, tone = 'teal', size = 'md', label, className, ...props }: IconTileProps) {
  const { bg, fg } = TONES[tone];
  const content = (
    <>
      <View
        className={cn(
          'items-center justify-center rounded-tile',
          size === 'sm' ? 'h-9 w-9' : 'h-[58px] w-[58px]',
        )}
        style={{ backgroundColor: bg }}
      >
        <Icon as={icon} size={size === 'sm' ? 18 : 24} color={fg} />
      </View>
      {label && (
        <Text variant="tiny" weight="semibold" align="center" numberOfLines={2}>
          {label}
        </Text>
      )}
    </>
  );

  // Không bấm được thì render View — tránh lồng nút trong nút (VD làm leading của ListItem).
  if (!props.onPress) return <View className={cn('items-center gap-2', className)}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      className={cn('items-center gap-2 active:opacity-75', className)}
      {...props}
    >
      {content}
    </Pressable>
  );
}
