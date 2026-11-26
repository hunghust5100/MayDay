import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { Icon } from '../icon/Icon';
import { Text } from '../text/Text';

export type InfoRowProps = {
  label: string;
  /** Giá trị; rỗng/null hiển thị "—". */
  value?: ReactNode;
  icon?: LucideIcon;
  /** `inline`: nhãn trái – giá trị phải; `stacked`: nhãn trên – giá trị dưới. */
  layout?: 'inline' | 'stacked';
  className?: string;
};

/** Cặp "nhãn – giá trị" — hồ sơ, chi tiết bệnh án. */
export function InfoRow({ label, value, icon, layout = 'inline', className }: InfoRowProps) {
  const empty = value === undefined || value === null || value === '';
  const valueNode =
    typeof value === 'string' || typeof value === 'number' || empty ? (
      <Text weight="semibold" align={layout === 'inline' ? 'right' : 'left'} tone={empty ? 'subtle' : 'default'}>
        {empty ? '—' : value}
      </Text>
    ) : (
      value
    );

  if (layout === 'stacked') {
    return (
      <View className={cn('gap-1', className)}>
        <View className="flex-row items-center gap-1.5">
          {icon && <Icon as={icon} size={14} color="muted" />}
          <Text variant="caption" tone="muted">
            {label}
          </Text>
        </View>
        {valueNode}
      </View>
    );
  }

  return (
    <View className={cn('min-h-11 flex-row items-center gap-3 py-2', className)}>
      {icon && <Icon as={icon} size={18} color="muted" />}
      <Text tone="muted" className="max-w-[48%] shrink">
        {label}
      </Text>
      <View className="flex-1 items-end">{valueNode}</View>
    </View>
  );
}

export type InfoGridProps = {
  items: readonly (Omit<InfoRowProps, 'layout' | 'className'> & { key?: string })[];
  /** Số cột (mặc định 2). */
  columns?: number;
  className?: string;
};

/** Lưới các cặp nhãn – giá trị dạng xếp chồng. */
export function InfoGrid({ items, columns = 2, className }: InfoGridProps) {
  return (
    <View className={cn('flex-row flex-wrap gap-y-4', className)}>
      {items.map(({ key, ...item }) => (
        <View key={key ?? item.label} style={{ width: `${100 / columns}%` }} className="pr-3">
          <InfoRow {...item} layout="stacked" />
        </View>
      ))}
    </View>
  );
}
