import { CalendarDays } from 'lucide-react-native';

import { useDisclosure } from '@/shared/hooks';
import { BottomSheet, Calendar } from '@/shared/ui';
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
};

/** Chọn ngày (lịch trong BottomSheet), giá trị theo định dạng API `YYYY-MM-DD`. */
export function DateField({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'dd/mm/yyyy',
  disabled,
  ...shell
}: DateFieldProps) {
  const sheet = useDisclosure();
  const date = parseApiDate(value);

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
      <BottomSheet visible={sheet.isOpen} onClose={sheet.close} title={shell.label ?? 'Chọn ngày'}>
        <Calendar
          value={date}
          minDate={minDate}
          maxDate={maxDate}
          onChange={(picked) => {
            onChange(toApiDate(picked));
            sheet.close();
          }}
        />
      </BottomSheet>
    </FieldShell>
  );
}
