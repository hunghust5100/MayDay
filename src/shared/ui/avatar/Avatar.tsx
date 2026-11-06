import { Image } from 'expo-image';
import { View } from 'react-native';

import { colors } from '@/shared/theme';
import { cn, getInitials, hashString } from '@/shared/utils';

import { Text } from '../text/Text';

const SIZES = { sm: 36, md: 46, lg: 64 } as const;
const TEXT_SIZE = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' } as const;

const PALETTE = [
  { bg: colors.tile.teal, fg: colors.tile['teal-fg'] },
  { bg: colors.tile.indigo, fg: colors.tile['indigo-fg'] },
  { bg: colors.tile.rose, fg: colors.tile['rose-fg'] },
  { bg: colors.tile.amber, fg: colors.tile['amber-fg'] },
];

export type AvatarProps = {
  name: string;
  /** URL ảnh; không có thì hiển thị chữ cái đầu. */
  uri?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Ảnh đại diện tròn; màu nền chữ cái đầu cố định theo tên. */
export function Avatar({ name, uri, size = 'md', className }: AvatarProps) {
  const dimension = SIZES[size];
  const palette = PALETTE[hashString(name) % PALETTE.length];

  return (
    <View
      accessibilityLabel={name}
      className={cn('items-center justify-center overflow-hidden rounded-full', className)}
      style={{ width: dimension, height: dimension, backgroundColor: palette.bg }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: dimension, height: dimension }} contentFit="cover" transition={150} />
      ) : (
        <Text className={cn('font-sans-bold', TEXT_SIZE[size])} style={{ color: palette.fg }}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
