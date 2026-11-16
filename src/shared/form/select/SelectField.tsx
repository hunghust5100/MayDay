import { Check } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useDisclosure } from '@/shared/hooks';
import { BottomSheet, Button, ContentModal, EmptyState, Icon, Text } from '@/shared/ui';
import { cn, removeDiacritics } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';
import { Trigger, type TriggerProps } from '../field/Trigger';
import { SearchBar } from '../search-bar/SearchBar';

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
};

/** Danh sách lựa chọn trong BottomSheet, có ô tìm kiếm không phân biệt dấu. */
function OptionList<T extends string | number>({
  options,
  isSelected,
  onSelect,
  searchable,
}: {
  options: readonly SelectOption<T>[];
  isSelected: (value: T) => boolean;
  onSelect: (value: T) => void;
  searchable: boolean;
}) {
  const [keyword, setKeyword] = useState('');
  const filtered = useMemo(() => {
    const key = removeDiacritics(keyword.trim());
    if (!key) return options;
    return options.filter((option) => removeDiacritics(option.label).includes(key));
  }, [options, keyword]);

  return (
    <>
      {searchable && <SearchBar value={keyword} onChange={setKeyword} placeholder="Tìm nhanh" className="mb-2" />}
      <ScrollView keyboardShouldPersistTaps="handled" className="shrink grow-0">
        {filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy" description="Thử từ khóa khác." />
        ) : (
          filtered.map((option) => {
            const selected = isSelected(option.value);
            return (
              <Pressable
                key={String(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: option.disabled }}
                disabled={option.disabled}
                onPress={() => onSelect(option.value)}
                className={cn(
                  'min-h-14 flex-row items-center gap-3 border-b border-border py-3 active:opacity-70',
                  option.disabled && 'opacity-40',
                )}>
                <View className="flex-1 gap-0.5">
                  <Text weight={selected ? 'semibold' : 'regular'} tone={selected ? 'primary' : 'default'}>
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text variant="caption" tone="muted">
                      {option.description}
                    </Text>
                  )}
                </View>
                {selected && <Icon as={Check} size={20} color="primary" />}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </>
  );
}

type SelectBaseProps<T extends string | number> = FieldBaseProps &
  Pick<TriggerProps, 'placeholder' | 'leftIcon' | 'disabled'> & {
    options: readonly SelectOption<T>[];
    /** Hiện ô tìm kiếm; mặc định bật khi có trên 8 lựa chọn. */
    searchable?: boolean;
    /** Tiêu đề cửa sổ (mặc định = label). */
    sheetTitle?: string;
    /** Opt-in cho các module cần cửa sổ giữa màn hình, không hiệu ứng. Mặc định giữ BottomSheet. */
    presentation?: 'sheet' | 'dialog';
  };

export type SelectFieldProps<T extends string | number> = SelectBaseProps<T> & {
  value: T | null | undefined;
  onChange: (value: T) => void;
};

/** Chọn một giá trị từ danh sách (mở BottomSheet) — giới tính, tỉnh/thành, chi nhánh/khoa/phòng... */
export function SelectField<T extends string | number>({
  options,
  value,
  onChange,
  searchable,
  sheetTitle,
  placeholder,
  leftIcon,
  disabled,
  presentation = 'sheet',
  ...shell
}: SelectFieldProps<T>) {
  const sheet = useDisclosure();
  const Popup = presentation === 'dialog' ? ContentModal : BottomSheet;
  const current = options.find((option) => option.value === value);

  return (
    <FieldShell {...shell}>
      <Trigger
        display={current?.label}
        placeholder={placeholder}
        leftIcon={leftIcon}
        disabled={disabled}
        invalid={Boolean(shell.error)}
        accessibilityLabel={shell.label}
        onPress={sheet.open}
      />
      <Popup visible={sheet.isOpen} onClose={sheet.close} title={sheetTitle ?? shell.label}>
        <OptionList
          options={options}
          searchable={searchable ?? options.length > 8}
          isSelected={(v) => v === value}
          onSelect={(v) => {
            onChange(v);
            sheet.close();
          }}
        />
      </Popup>
    </FieldShell>
  );
}

export type MultiSelectFieldProps<T extends string | number> = SelectBaseProps<T> & {
  value: readonly T[] | null | undefined;
  onChange: (value: T[]) => void;
};

/** Chọn nhiều giá trị (mở BottomSheet, bấm "Xong" để áp dụng). */
export function MultiSelectField<T extends string | number>({
  options,
  value,
  onChange,
  searchable,
  sheetTitle,
  placeholder,
  leftIcon,
  disabled,
  presentation = 'sheet',
  ...shell
}: MultiSelectFieldProps<T>) {
  const sheet = useDisclosure();
  const Popup = presentation === 'dialog' ? ContentModal : BottomSheet;
  const [draft, setDraft] = useState<T[]>([]);
  const selected = value ?? [];
  const labels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const display = labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');

  const openSheet = () => {
    setDraft([...selected]);
    sheet.open();
  };

  return (
    <FieldShell {...shell}>
      <Trigger
        display={display}
        placeholder={placeholder}
        leftIcon={leftIcon}
        disabled={disabled}
        invalid={Boolean(shell.error)}
        accessibilityLabel={shell.label}
        onPress={openSheet}
      />
      <Popup visible={sheet.isOpen} onClose={sheet.close} title={sheetTitle ?? shell.label}>
        <OptionList
          options={options}
          searchable={searchable ?? options.length > 8}
          isSelected={(v) => draft.includes(v)}
          onSelect={(v) => setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]))}
        />
        <Button
          title={draft.length ? `Xong (${draft.length})` : 'Xong'}
          fullWidth
          className="mt-4"
          onPress={() => {
            onChange(draft);
            sheet.close();
          }}
        />
      </Popup>
    </FieldShell>
  );
}
