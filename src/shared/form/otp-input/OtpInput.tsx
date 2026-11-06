import { useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputInstance } from 'react-native';

import { colors } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';

export type OtpInputProps = FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  /** Gọi khi nhập đủ số ký tự. */
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
};

/** Ô nhập mã OTP dạng N ô vuông; hỗ trợ tự điền OTP từ SMS. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus = false,
  label,
  required,
  hint,
  error,
  className,
}: OtpInputProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      <Pressable accessibilityLabel={label ?? 'Mã OTP'} onPress={() => inputRef.current?.focus()}>
        <View className="flex-row justify-between gap-2">
          {Array.from({ length }, (_, index) => {
            const char = value[index] ?? '';
            const active = focused && (index === value.length || (index === length - 1 && value.length === length));
            return (
              <View
                key={index}
                className={cn(
                  'h-14 flex-1 items-center justify-center rounded-input border-[1.5px] border-border bg-surface',
                  char && 'border-primary/50',
                  active && 'border-primary',
                  error && 'border-danger',
                )}
                style={active ? { boxShadow: `0px 0px 0px 4px ${colors.primary.soft}` } : undefined}>
                <Text variant="h2">{char}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChange}
          maxLength={length}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus={autoFocus}
          caretHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 opacity-0"
        />
      </Pressable>
    </FieldShell>
  );
}
