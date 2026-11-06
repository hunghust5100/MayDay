import { Pressable, View } from 'react-native';

import { Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';
import { CheckMark, RadioMark } from './indicators';

export type ChoiceOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

type OptionCardProps = {
  option: ChoiceOption<string | number>;
  checked: boolean;
  multiple: boolean;
  invalid: boolean;
  onPress: () => void;
};

function OptionCard({ option, checked, multiple, invalid, onPress }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked, disabled: option.disabled }}
      disabled={option.disabled}
      onPress={onPress}
      className={cn(
        'min-h-14 flex-row items-center gap-3 rounded-input border-[1.5px] border-border bg-surface px-4 py-3 active:opacity-80',
        checked && 'border-primary bg-primary-soft/40',
        invalid && !checked && 'border-danger/60',
        option.disabled && 'opacity-50',
      )}>
      {multiple ? <CheckMark checked={checked} /> : <RadioMark checked={checked} />}
      <View className="flex-1 gap-0.5">
        <Text weight={checked ? 'semibold' : 'medium'}>{option.label}</Text>
        {option.description && (
          <Text variant="caption" tone="muted">
            {option.description}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

type GroupBaseProps<T extends string | number> = FieldBaseProps & {
  options: readonly ChoiceOption<T>[];
  /** `row`: các thẻ chia đều một hàng (hợp với 2–3 lựa chọn ngắn như Giới tính). */
  direction?: 'column' | 'row';
};

export type RadioGroupProps<T extends string | number> = GroupBaseProps<T> & {
  value: T | null | undefined;
  onChange: (value: T) => void;
};

/** Chọn một — dạng thẻ, vùng chạm lớn. */
export function RadioGroup<T extends string | number>({
  options,
  value,
  onChange,
  direction = 'column',
  ...shell
}: RadioGroupProps<T>) {
  return (
    <FieldShell {...shell}>
      <View accessibilityRole="radiogroup" className={cn('gap-2.5', direction === 'row' && 'flex-row')}>
        {options.map((option) => (
          <View key={String(option.value)} className={direction === 'row' ? 'flex-1' : undefined}>
            <OptionCard
              option={option}
              checked={option.value === value}
              multiple={false}
              invalid={Boolean(shell.error)}
              onPress={() => onChange(option.value)}
            />
          </View>
        ))}
      </View>
    </FieldShell>
  );
}

export type CheckboxGroupProps<T extends string | number> = GroupBaseProps<T> & {
  value: readonly T[] | null | undefined;
  onChange: (value: T[]) => void;
};

/** Chọn nhiều — dạng thẻ, vùng chạm lớn. */
export function CheckboxGroup<T extends string | number>({
  options,
  value,
  onChange,
  direction = 'column',
  ...shell
}: CheckboxGroupProps<T>) {
  const selected = value ?? [];
  const toggle = (item: T) =>
    onChange(selected.includes(item) ? selected.filter((v) => v !== item) : [...selected, item]);

  return (
    <FieldShell {...shell}>
      <View className={cn('gap-2.5', direction === 'row' && 'flex-row flex-wrap')}>
        {options.map((option) => (
          <View key={String(option.value)} className={direction === 'row' ? 'min-w-[45%] flex-1' : undefined}>
            <OptionCard
              option={option}
              checked={selected.includes(option.value)}
              multiple
              invalid={Boolean(shell.error)}
              onPress={() => toggle(option.value)}
            />
          </View>
        ))}
      </View>
    </FieldShell>
  );
}

export type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Checkbox đơn có nhãn — VD "Ghi nhớ đăng nhập", "Tôi đồng ý điều khoản". */
export function Checkbox({ checked, onChange, label, disabled, className }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => onChange(!checked)}
      className={cn('flex-row items-center gap-2.5 self-start', className)}>
      <CheckMark checked={checked} disabled={disabled} />
      <Text variant="caption" tone={disabled ? 'subtle' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}
