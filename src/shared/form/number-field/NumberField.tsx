import { Minus, Plus, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';
import { Input, type InputProps } from '../field/Input';

export type NumberFieldProps = FieldBaseProps &
  Omit<InputProps, 'value' | 'onChange' | 'onChangeText' | 'keyboardType' | 'invalid'> & {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    /** Cho phép số thập phân (dấu `,` hoặc `.`). */
    decimal?: boolean;
    /** Đơn vị hiển thị bên phải, VD "mg", "tuổi". */
    unit?: string;
  };

const parse = (text: string) => (text === '' ? null : Number(text.replace(',', '.')));

/** Ô nhập số; để trống → `null`. */
export function NumberField({
  label,
  required,
  hint,
  error,
  className,
  value,
  onChange,
  decimal = false,
  unit,
  ...inputProps
}: NumberFieldProps) {
  const [text, setText] = useState(value == null ? '' : String(value));

  // Giá trị đổi từ bên ngoài (reset form...) → cập nhật lại chuỗi đang hiển thị.
  const external = value ?? null;
  if (parse(text) !== external && !(Number.isNaN(parse(text)) && external === null)) {
    setText(external == null ? '' : String(external));
  }

  const handleChange = (raw: string) => {
    const cleaned = decimal ? raw.replace(/[^\d.,]/g, '') : raw.replace(/\D/g, '');
    setText(cleaned);
    const parsed = parse(cleaned);
    if (parsed === null || !Number.isNaN(parsed)) onChange(parsed);
  };

  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      <Input
        value={text}
        onChangeText={handleChange}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        invalid={Boolean(error)}
        accessibilityLabel={label}
        right={unit ? <Text tone="muted">{unit}</Text> : undefined}
        {...inputProps}
      />
    </FieldShell>
  );
}

export type StepperProps = FieldBaseProps & {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
};

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-btn bg-primary-soft active:opacity-75',
        disabled && 'opacity-40',
      )}>
      <Icon as={icon} size={20} color="primary-strong" />
    </Pressable>
  );
}

/** Nút tăng/giảm: [−] giá trị [+] — VD số nốt sẩn, số viên thuốc. */
export function Stepper({
  label,
  required,
  hint,
  error,
  className,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  disabled = false,
}: StepperProps) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max);
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      <View
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: value }}
        className="flex-row items-center gap-4">
        <StepButton
          icon={Minus}
          label="Giảm"
          disabled={disabled || value <= min}
          onPress={() => onChange(clamp(value - step))}
        />
        <Text variant="h2" className="min-w-12 text-center">
          {value}
          {unit && <Text tone="muted"> {unit}</Text>}
        </Text>
        <StepButton
          icon={Plus}
          label="Tăng"
          disabled={disabled || value >= max}
          onPress={() => onChange(clamp(value + step))}
        />
      </View>
    </FieldShell>
  );
}
