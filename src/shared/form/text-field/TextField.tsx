import { Eye, EyeOff, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Icon } from '@/shared/ui';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';
import { Input, type InputProps } from '../field/Input';

export type TextFieldProps = FieldBaseProps &
  Omit<InputProps, 'value' | 'onChange' | 'onChangeText' | 'invalid' | 'className'> & {
    value?: string;
    /** Nhận thẳng giá trị chuỗi (khớp `field.onChange` của react-hook-form). */
    onChange?: (value: string) => void;
    inputClassName?: string;
  };

export function TextField({
  label,
  required,
  hint,
  error,
  className,
  value,
  onChange,
  inputClassName,
  ...inputProps
}: TextFieldProps) {
  return (
    <FieldShell label={label} required={required} hint={hint} error={error} className={className}>
      <Input
        value={value ?? ''}
        onChangeText={onChange}
        invalid={Boolean(error)}
        accessibilityLabel={label}
        className={inputClassName}
        {...inputProps}
      />
    </FieldShell>
  );
}

/** Ô mật khẩu có nút ẩn/hiện. */
export function PasswordField(props: Omit<TextFieldProps, 'secureTextEntry' | 'right'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="password"
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          hitSlop={10}
          onPress={() => setVisible((v) => !v)}>
          <Icon as={visible ? EyeOff : Eye} size={20} color="muted" />
        </Pressable>
      }
    />
  );
}

/** Ô số điện thoại VN: bàn phím số, chỉ nhận chữ số, tối đa 10 số. */
export function PhoneField({ onChange, ...props }: Omit<TextFieldProps, 'keyboardType' | 'maxLength'>) {
  return (
    <TextField
      leftIcon={Phone}
      placeholder="VD: 0912345678"
      autoComplete="tel"
      textContentType="telephoneNumber"
      {...props}
      keyboardType="phone-pad"
      maxLength={10}
      onChange={(text) => onChange?.(text.replace(/\D/g, ''))}
    />
  );
}
