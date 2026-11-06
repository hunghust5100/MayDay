import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';

import { cn } from '@/shared/utils';

import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

export type ListItemProps = Omit<PressableProps, 'children'> & {
  title: string;
  description?: string;
  /** Phần bên trái: Avatar, IconTile, Icon... */
  leading?: ReactNode;
  /** Phần bên phải: Badge, Switch, giá trị... */
  trailing?: ReactNode;
  /** Mũi tên ">" (mặc định có khi bấm được). */
  chevron?: boolean;
  className?: string;
};

/** Dòng danh sách: [leading] tiêu đề + mô tả [trailing] [>] */
export function ListItem({ title, description, leading, trailing, chevron, className, ...props }: ListItemProps) {
  const pressable = Boolean(props.onPress);
  const showChevron = chevron ?? pressable;

  return (
    <Pressable
      accessibilityRole={pressable ? 'button' : undefined}
      disabled={!pressable}
      className={cn('min-h-14 flex-row items-center gap-3 py-3', pressable && 'active:opacity-70', className)}
      {...props}>
      {leading}
      <View className="flex-1 gap-0.5">
        <Text weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {description && (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {trailing && <View className="items-end">{trailing}</View>}
      {showChevron && <Icon as={ChevronRight} size={20} color="subtle" />}
    </Pressable>
  );
}
