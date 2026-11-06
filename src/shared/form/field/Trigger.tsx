import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

export type TriggerProps = {
  /** Nội dung đang chọn; rỗng thì hiện placeholder. */
  display?: string;
  placeholder?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  invalid?: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Ô "giả input" bấm để mở BottomSheet — dùng cho Select, Date. */
export function Trigger({
  display,
  placeholder = 'Chọn',
  leftIcon,
  rightIcon = ChevronDown,
  invalid,
  disabled,
  onPress,
  accessibilityLabel,
}: TriggerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-[54px] flex-row items-center gap-2.5 rounded-input border-[1.5px] border-border bg-surface px-4 active:opacity-80',
        invalid && 'border-danger',
        disabled && 'bg-surface-2',
      )}>
      {leftIcon && <Icon as={leftIcon} size={20} color="muted" />}
      <View className="flex-1">
        <Text variant="body-lg" tone={display ? (disabled ? 'muted' : 'default') : 'subtle'} numberOfLines={1}>
          {display || placeholder}
        </Text>
      </View>
      <Icon as={rightIcon} size={20} color="muted" />
    </Pressable>
  );
}
