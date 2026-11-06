import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/utils';

import { Card } from '../card/Card';
import { IconTile, type IconTileTone } from '../icon-tile/IconTile';
import { Text } from '../text/Text';

export type StatCardProps = {
  label: string;
  value: string | number;
  /** Đơn vị/tổng sau giá trị, VD "/42". */
  unit?: string;
  icon?: LucideIcon;
  tone?: IconTileTone;
  /** Dòng phụ dưới giá trị (VD Badge mức độ, "Tăng 4 điểm so với tuần trước"). */
  footer?: ReactNode;
  onPress?: () => void;
  className?: string;
};

/** Thẻ chỉ số nổi bật — tổng điểm UAS7 tuần, số bệnh án chờ tiếp nhận... */
export function StatCard({ label, value, unit, icon, tone = 'teal', footer, onPress, className }: StatCardProps) {
  return (
    <Card onPress={onPress} className={cn('gap-3', className)}>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="caption" weight="semibold" tone="muted" className="flex-1">
          {label}
        </Text>
        {icon && <IconTile icon={icon} tone={tone} className="scale-75" />}
      </View>
      <Text variant="display" className="text-[40px] leading-[44px]">
        {value}
        {unit && (
          <Text variant="body-lg" weight="semibold" tone="muted">
            {' '}
            {unit}
          </Text>
        )}
      </Text>
      {footer}
    </Card>
  );
}
