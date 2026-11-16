import { CalendarDays } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { useDisclosure } from '@/shared/hooks';
import { BottomSheet, Calendar, ContentModal } from '@/shared/ui';
import { formatDate, parseApiDate, toApiDate } from '@/shared/utils';

import { FieldShell, type FieldBaseProps } from '../field/FieldShell';
import { Trigger } from '../field/Trigger';

export type DateFieldProps = FieldBaseProps & {
  /** Ngày theo định dạng API `YYYY-MM-DD`. */
  value: string | null | undefined;
  onChange: (value: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  /** Mặc định giữ BottomSheet; dialog hiện giữa màn hình và không có hiệu ứng. */
  presentation?: 'sheet' | 'dialog';
};

/** Chọn ngày (lịch trong BottomSheet), giá trị theo định dạng API `YYYY-MM-DD`. */
export function DateField({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'dd/mm/yyyy',
  disabled,
  presentation = 'sheet',
  ...shell
}: DateFieldProps) {
  const sheet = useDisclosure();
  const Popup = presentation === 'dialog' ? ContentModal : BottomSheet;
  const date = parseApiDate(value);
  const calendar = <Calendar
    value={date}
    minDate={minDate}
    maxDate={maxDate}
    onChange={(picked) => {
      onChange(toApiDate(picked));
      sheet.close();
    }}
  />;

  return (
    <FieldShell {...shell}>
      <Trigger
        display={date ? formatDate(date) : undefined}
        placeholder={placeholder}
        rightIcon={CalendarDays}
        disabled={disabled}
        invalid={Boolean(shell.error)}
        accessibilityLabel={shell.label}
        onPress={sheet.open}
      />
      <Popup visible={sheet.isOpen} onClose={sheet.close} title={shell.label ?? 'Chọn ngày'}>
        {presentation === 'dialog' ? <ScrollView className="shrink grow-0" keyboardShouldPersistTaps="handled">{calendar}</ScrollView> : calendar}
      </Popup>
    </FieldShell>
  );
}
