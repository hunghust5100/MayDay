import { ScrollView, View } from 'react-native';

import { cn } from '@/shared/utils';

import { Chip } from '../chip/Chip';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Số đếm hiển thị cạnh nhãn. */
  count?: number;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Xếp các lựa chọn thành nhiều dòng trong bộ lọc ngắn. */
  wrap?: boolean;
};

/** Dãy nút lọc dạng viên thuốc, cuộn ngang — VD lọc trạng thái bệnh án. */
export function SegmentedControl<T extends string>({ options, value, onChange, className, wrap }: SegmentedControlProps<T>) {
  const chips = options.map((option) => (
    <Chip
      key={option.value}
      label={option.label}
      count={option.count}
      selected={option.value === value}
      onPress={() => onChange(option.value)}
    />
  ));
  if (wrap) return <View className={cn('flex-row flex-wrap gap-2', className)}>{chips}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('grow-0', className)}
      contentContainerClassName="gap-2">
      {chips}
    </ScrollView>
  );
}
