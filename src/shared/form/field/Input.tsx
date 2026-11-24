import type { LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode, type Ref } from 'react';
import { TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors } from '@/shared/theme';
import { Icon } from '@/shared/ui';
import { cn } from '@/shared/utils';

export type InputProps = Omit<TextInputProps, 'editable'> & {
  ref?: Ref<TextInputInstance>;
  leftIcon?: LucideIcon;
  /** Phần bên phải ô nhập (nút ẩn/hiện mật khẩu, đơn vị...). */
  right?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  /** Class cho khung ngoài (className áp cho TextInput). */
  containerClassName?: string;
};

/** Ô nhập cơ bản: cao 54, viền 1.5, focus viền primary + quầng primary-soft, lỗi viền đỏ. */
export function Input({
  ref,
  leftIcon,
  right,
  invalid,
  disabled,
  containerClassName,
  className,
  onFocus,
  onBlur,
  multiline,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={cn(
        'min-w-0 flex-row gap-2.5 rounded-input border-[1.5px] border-border bg-surface px-3 roomy:px-4',
        multiline
          ? 'min-h-24 items-start py-2 roomy:min-h-28'
          : 'min-h-[48px] items-center roomy:min-h-[54px]',
        focused && 'border-primary',
        invalid && 'border-danger',
        disabled && 'bg-surface-2',
        containerClassName,
      )}
      style={
        focused
          ? { boxShadow: `0px 0px 0px 4px ${invalid ? colors.danger.soft : colors.primary.soft}` }
          : undefined
      }
    >
      {leftIcon && <Icon as={leftIcon} size={20} color={focused ? 'primary' : 'muted'} />}
      <TextInput
        ref={ref}
        editable={!disabled}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : undefined}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.primary.DEFAULT}
        className={cn(
          'min-w-0 flex-1 py-0 font-sans text-md text-text outline-none',
          multiline ? 'min-h-20 roomy:min-h-24' : 'min-h-[44px] py-1.5',
          disabled && 'text-muted',
          className,
        )}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {right && <View className="shrink-0">{right}</View>}
    </View>
  );
}
