import { Search, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';

import { useDebounce } from '@/shared/hooks';
import { Icon } from '@/shared/ui';
import { cn } from '@/shared/utils';

import { Input } from '../field/Input';

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
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);
  const lastSearch = useRef(value.trim());

  useEffect(() => {
    if (lastSearch.current === term) return;
    lastSearch.current = term;
    onSearchRef.current?.(term);
  }, [term]);

  const searchNow = (query: string) => {
    if (lastSearch.current === query) return;
    lastSearch.current = query;
    onSearch?.(query);
  };

  return (
    <Input
      value={value}
      onChangeText={onChange}
      leftIcon={Search}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      autoFocus={autoFocus}
      autoCorrect={false}
      returnKeyType="search"
      onSubmitEditing={() => searchNow(value.trim())}
      containerClassName={cn('min-h-[46px] gap-2 roomy:min-h-[50px]', value.length > 0 && 'pr-1 roomy:pr-1', className)}
      right={value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa từ khóa"
          className="h-11 w-11 items-center justify-center rounded-btn active:bg-surface-2"
          onPress={() => {
            onChange('');
            searchNow('');
          }}>
          <Icon as={X} size={18} color="muted" />
        </Pressable>
      )}
    />
  );
}
