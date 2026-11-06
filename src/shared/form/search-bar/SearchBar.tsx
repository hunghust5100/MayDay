import { Search, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { useDebounce } from '@/shared/hooks';
import { colors, shadowStyle } from '@/shared/theme';
import { Icon } from '@/shared/ui';
import { cn } from '@/shared/utils';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  /** Gọi sau khi người dùng ngừng gõ `debounce` ms (đã trim). */
  onSearch?: (term: string) => void;
  debounce?: number;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

/** Ô tìm kiếm: icon kính lúp, nút xóa, chờ gõ xong mới gọi `onSearch`. */
export function SearchBar({
  value,
  onChange,
  onSearch,
  debounce = 400,
  placeholder = 'Tìm kiếm',
  autoFocus,
  className,
}: SearchBarProps) {
  const term = useDebounce(value.trim(), debounce);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const firstRun = useRef(true);

  useEffect(() => {
    // Bỏ qua lần render đầu: chỉ gọi khi người dùng thực sự đổi từ khóa.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    onSearchRef.current?.(term);
  }, [term]);

  return (
    <View
      className={cn('h-[50px] flex-row items-center gap-2.5 rounded-input border border-border bg-surface px-3.5', className)}
      style={shadowStyle.card}>
      <Icon as={Search} size={20} color="muted" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        selectionColor={colors.primary.DEFAULT}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={() => onSearch?.(value.trim())}
        accessibilityRole="search"
        className="h-full flex-1 py-0 font-sans text-base text-text outline-none"
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Xóa từ khóa" hitSlop={10} onPress={() => onChange('')}>
          <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-2">
            <Icon as={X} size={14} color="muted" />
          </View>
        </Pressable>
      )}
    </View>
  );
}
