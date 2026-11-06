import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn, isSameDay, startOfDay } from '@/shared/utils';

import { IconButton } from '../icon-button/IconButton';
import { Text } from '../text/Text';

const WEEK_HEADER = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export type CalendarProps = {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
};

/** Lịch tháng (tuần bắt đầu thứ 2). Có nút lùi/tiến tháng và năm. */
export function Calendar({ value, onChange, minDate, maxDate, className }: CalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const base = value ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // thứ 2 = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day++) list.push(new Date(year, month, day));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [cursor]);

  const shift = (months: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + months, 1));

  return (
    <View className={cn('gap-2', className)}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row">
          <IconButton icon={ChevronsLeft} variant="ghost" accessibilityLabel="Năm trước" onPress={() => shift(-12)} />
          <IconButton icon={ChevronLeft} variant="ghost" accessibilityLabel="Tháng trước" onPress={() => shift(-1)} />
        </View>
        <Text variant="h3">
          Tháng {cursor.getMonth() + 1}, {cursor.getFullYear()}
        </Text>
        <View className="flex-row">
          <IconButton icon={ChevronRight} variant="ghost" accessibilityLabel="Tháng sau" onPress={() => shift(1)} />
          <IconButton icon={ChevronsRight} variant="ghost" accessibilityLabel="Năm sau" onPress={() => shift(12)} />
        </View>
      </View>

      <View className="flex-row">
        {WEEK_HEADER.map((day) => (
          <Text key={day} variant="caption" weight="semibold" tone="muted" align="center" className="flex-1">
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {cells.map((date, index) => {
          if (!date) return <View key={`empty-${index}`} className="aspect-square w-[14.285%]" />;
          const disabled = (min && date < min) || (max && date > max);
          const selected = value ? isSameDay(date, value) : false;
          const isToday = isSameDay(date, today);
          return (
            <View key={date.getDate()} className="aspect-square w-[14.285%] p-0.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`}
                accessibilityState={{ selected, disabled: Boolean(disabled) }}
                disabled={Boolean(disabled)}
                onPress={() => onChange(date)}
                className={cn(
                  'flex-1 items-center justify-center rounded-full active:bg-primary-soft',
                  isToday && !selected && 'border-[1.5px] border-primary',
                  selected && 'bg-primary',
                )}>
                <Text
                  weight={selected || isToday ? 'bold' : 'regular'}
                  tone={selected ? 'inverse' : disabled ? 'subtle' : isToday ? 'primary' : 'default'}
                  className={cn(disabled && 'opacity-50')}>
                  {date.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
