import { Switch, View } from 'react-native';

import { colors } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

export type SwitchFieldProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

/** Dòng bật/tắt: nhãn + mô tả bên trái, công tắc bên phải — VD cài đặt thông báo. */
export function SwitchField({ value, onChange, label, description, disabled, className }: SwitchFieldProps) {
  return (
    <View className={cn('min-h-14 flex-row items-center gap-3 py-2', className)}>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">{label}</Text>
        {description && (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        )}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary.DEFAULT }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}
