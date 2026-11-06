import { View } from 'react-native';

import { colors } from '@/shared/theme';
import { cn } from '@/shared/utils';

import { Text } from '../text/Text';

export type ScoreBar = {
  /** Nhãn dưới cột, VD "T2". */
  label: string;
  /** `null` = chưa có dữ liệu (cột viền đứt). */
  value: number | null;
  /** Làm nổi bật (VD hôm nay). */
  highlight?: boolean;
};

export type ScoreBarChartProps = {
  data: readonly ScoreBar[];
  /** Giá trị tối đa của trục (UAS7 ngày: 6). */
  max: number;
  /** Màu cột theo giá trị; mặc định màu primary. */
  colorFor?: (value: number) => string;
  /** Chiều cao vùng cột (px). */
  height?: number;
  /** Hiện số trên đầu cột. */
  showValues?: boolean;
  className?: string;
};

/** Biểu đồ cột đơn giản dựng bằng View (không cần thư viện) — VD điểm UAS7 7 ngày. */
export function ScoreBarChart({
  data,
  max,
  colorFor,
  height = 120,
  showValues = true,
  className,
}: ScoreBarChartProps) {
  return (
    <View className={cn('flex-row items-end justify-between px-1', className)} accessibilityRole="image">
      {data.map((bar, index) => {
        const empty = bar.value === null;
        const ratio = empty ? 1 : Math.min(Math.max(bar.value! / max, 0), 1);
        const barHeight = empty ? height * 0.35 : Math.max(height * ratio, 6);
        const color = empty ? undefined : (colorFor?.(bar.value!) ?? colors.primary.DEFAULT);
        return (
          <View
            key={`${bar.label}-${index}`}
            accessibilityLabel={`${bar.label}: ${empty ? 'chưa có' : bar.value}`}
            className="items-center gap-1.5">
            {showValues && (
              <Text variant="tiny" weight="bold" tone={empty ? 'subtle' : 'default'}>
                {empty ? '–' : bar.value}
              </Text>
            )}
            <View
              className={cn(
                'w-[26px] rounded-lg',
                empty && 'border-[1.5px] border-dashed',
                empty && (bar.highlight ? 'border-primary bg-primary-soft' : 'border-border'),
              )}
              style={{ height: barHeight, backgroundColor: color }}
            />
            <Text
              variant="tiny"
              weight={bar.highlight ? 'extrabold' : 'semibold'}
              className={cn('text-[11px]', bar.highlight ? 'text-primary' : 'text-muted')}>
              {bar.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
