import { View } from 'react-native';
import { DateField, TextField } from '@/shared/form';
import { Button } from '@/shared/ui';
import { toApiDate } from '@/shared/utils';

export function DateTimeField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [date = '', time = ''] = value.replace('T', ' ').split(' ');
  return (
    <View className="gap-2">
      <DateField
        label={label}
        presentation="dialog"
        value={date || null}
        onChange={(day) => onChange(day + ' ' + (time || '09:00'))}
      />
      <TextField
        label="Giờ (HH:mm)"
        placeholder="VD: 09:30"
        value={time.slice(0, 5)}
        onChange={(clock) => onChange((date || toApiDate(new Date())) + ' ' + clock)}
        error={error}
      />
      {!!value && (
        <Button title="Không rõ thời điểm" variant="ghost" size="sm" onPress={() => onChange('')} />
      )}
    </View>
  );
}
