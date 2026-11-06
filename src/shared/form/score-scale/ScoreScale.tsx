import { Pressable, View } from 'react-native';

import { getSeverityColor } from '@/shared/constants';
import { colors } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';

export type ScoreLevel = {
  value: number;
  label?: string;
  /** Mô tả ngắn dưới nhãn, VD "< 20 nốt". */
  description?: string;
  /** Mặc định lấy theo thang màu mức độ. */
  color?: string;
};

export type ScoreScaleProps = FieldBaseProps & {
  value: number | null | undefined;
  onChange: (value: number) => void;
  /**
   * Danh sách mức điểm. Không truyền thì dựng thang `min..max`.
   * ≤ 5 mức → dạng thẻ có nhãn (UAS7 0–3); nhiều hơn → dãy nút tròn (triệu chứng 0–10).
   */
  levels?: readonly ScoreLevel[];
  min?: number;
  max?: number;
  /** Nhãn hai đầu cho dạng dãy nút, VD ['Không', 'Rất nặng']. */
  edgeLabels?: [string, string];
  disabled?: boolean;
};

/** Thang chấm điểm bằng nút bấm, đổi màu theo mức độ. */
export function ScoreScale({
  value,
  onChange,
  levels,
  min = 0,
  max = 3,
  edgeLabels,
  disabled,
  ...shell
}: ScoreScaleProps) {
  const items: ScoreLevel[] = levels
    ? [...levels]
    : Array.from({ length: max - min + 1 }, (_, i) => ({ value: min + i }));
  const top = Math.max(...items.map((item) => item.value));
  const colorOf = (item: ScoreLevel) => item.color ?? getSeverityColor(item.value - min, top - min);

  if (items.length <= 5) {
    return (
      <FieldShell {...shell}>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {items.map((item) => {
            const selected = item.value === value;
            const color = colorOf(item);
            return (
              <Pressable
                key={item.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled }}
                accessibilityLabel={`${item.value} điểm${item.label ? `, ${item.label}` : ''}`}
                disabled={disabled}
                onPress={() => onChange(item.value)}
                className={cn(
                  'flex-1 items-center gap-1.5 rounded-input border-[1.5px] border-border bg-surface px-1 py-3 active:opacity-80',
                  disabled && 'opacity-50',
                )}
                style={selected ? { borderColor: color, borderWidth: 2, backgroundColor: `${color}14` } : undefined}>
                <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
                  <Text weight="extrabold" tone="inverse">
                    {item.value}
                  </Text>
                </View>
                {item.label && (
                  <Text variant="tiny" weight="semibold" align="center" numberOfLines={2}>
                    {item.label}
                  </Text>
                )}
                {item.description && (
                  <Text variant="tiny" tone="muted" align="center" className="text-[11px]" numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </FieldShell>
    );
  }

  return (
    <FieldShell {...shell}>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap justify-between gap-y-2">
        {items.map((item) => {
          const selected = item.value === value;
          const color = colorOf(item);
          return (
            <Pressable
              key={item.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityLabel={`${item.value} điểm`}
              disabled={disabled}
              hitSlop={2}
              onPress={() => onChange(item.value)}
              className={cn(
                'h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-border bg-surface',
                disabled && 'opacity-50',
              )}
              style={selected ? { backgroundColor: color, borderColor: color } : undefined}>
              <Text variant="caption" weight="bold" style={{ color: selected ? colors['on-primary'] : colors.text }}>
                {item.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {edgeLabels && (
        <View className="flex-row justify-between">
          <Text variant="tiny" tone="muted">
            {edgeLabels[0]}
          </Text>
          <Text variant="tiny" tone="muted">
            {edgeLabels[1]}
          </Text>
        </View>
      )}
    </FieldShell>
  );
}
