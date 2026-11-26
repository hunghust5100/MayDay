import { View } from 'react-native';
import { CheckboxGroup, FormField, NumberField, SelectField, TextField, useZodForm } from '@/shared/form';
import { Button, toast } from '@/shared/ui';
import { toApiDateTime } from '@/shared/utils';
import type { LesionEpisode, LesionLocation } from '../types';
import { observationSchema, type ObservationValues } from '../schemas';
import { DateTimeField } from './DateTimeField';

export const BODY_PARTS = [
  'Mặt',
  'Cổ',
  'Ngực',
  'Bụng',
  'Lưng',
  'Cánh tay trái',
  'Cánh tay phải',
  'Bàn tay',
  'Đùi trái',
  'Đùi phải',
  'Cẳng chân',
  'Bàn chân',
];
const CONTEXTS = ['Sau ăn', 'Vận động', 'Nóng/lạnh', 'Căng thẳng', 'Không rõ'];
export function observationPayload(values: ObservationValues) {
  return {
    occurred_at: values.occurred_at || null,
    context_tags: values.context_tags,
    context_other: values.context_other || null,
    medication_name: values.medication_name || null,
    medication_unit: values.medication_name ? values.medication_unit : null,
  };
}
export function ObservationForm({
  mode,
  initial,
  loading,
  onSubmit,
  onCancel,
}: {
  mode: 'episode' | 'location';
  initial?: LesionEpisode | LesionLocation;
  loading: boolean;
  onSubmit: (value: ObservationValues) => void;
  onCancel: () => void;
}) {
  const duration =
    initial && 'medication_taken_ago' in initial
      ? initial.medication_taken_ago
      : initial && 'medication_take' in initial
        ? initial.medication_take
        : null;
  const form = useZodForm(observationSchema(mode), {
    defaultValues: {
      name: initial && 'name' in initial ? initial.name : '',
      body_part: initial && 'body_part' in initial ? initial.body_part : '',
      occurred_at: initial ? (initial.occurred_at ?? '') : toApiDateTime(new Date()),
      context_tags: initial?.context_tags ?? [],
      context_other: initial?.context_other ?? '',
      medication_name: initial?.medication_name ?? '',
      medication_unit: initial?.medication_unit === 'day' ? 'day' : 'hour',
      medicationInterval: duration != null && duration !== '' ? Number(duration) : null,
      description: initial && 'description' in initial ? (initial.description ?? '') : '',
    },
  });
  const { control } = form;
  return (
    <View className="gap-4">
      {mode === 'episode' ? (
        <FormField
          control={control}
          name="name"
          render={(field) => (
            <TextField label="Tên đợt tổn thương" required placeholder="VD: Nổi mẩn buổi tối" {...field} />
          )}
        />
      ) : (
        <>
          <SelectField
            label="Gợi ý vị trí"
            options={BODY_PARTS.map((v) => ({ value: v, label: v }))}
            value={form.watch('body_part')}
            onChange={(v) => form.setValue('body_part', v)}
            presentation="dialog"
          />
          <FormField
            control={control}
            name="body_part"
            render={(field) => (
              <TextField
                label="Vị trí cụ thể"
                required
                placeholder="VD: Mặt ngoài cánh tay phải"
                {...field}
              />
            )}
          />
        </>
      )}
      <FormField
        control={control}
        name="occurred_at"
        render={(field) => <DateTimeField label="Thời điểm xuất hiện" {...field} />}
      />
      <FormField
        control={control}
        name="context_tags"
        render={(field) => (
          <CheckboxGroup
            label="Bối cảnh"
            options={[...new Set([...CONTEXTS, ...(initial?.context_tags ?? [])])].map((v) => ({
              value: v,
              label: v,
            }))}
            {...field}
          />
        )}
      />
      <FormField
        control={control}
        name="context_other"
        render={(field) => <TextField label="Bối cảnh khác" {...field} />}
      />
      <FormField
        control={control}
        name="medication_name"
        render={(field) => <TextField label="Thuốc đã dùng trước đó" {...field} />}
      />
      <FormField
        control={control}
        name="medicationInterval"
        render={(field) => <NumberField label="Đã dùng cách đây" decimal {...field} />}
      />
      <FormField
        control={control}
        name="medication_unit"
        render={(field) => (
          <SelectField
            label="Đơn vị thời gian"
            options={[
              { value: 'hour', label: 'Giờ' },
              { value: 'day', label: 'Ngày' },
            ]}
            presentation="dialog"
            {...field}
          />
        )}
      />
      {mode === 'episode' && (
        <FormField
          control={control}
          name="description"
          render={(field) => <TextField label="Mô tả" multiline {...field} />}
        />
      )}
      <Button
        title="Lưu"
        loading={loading}
        onPress={() => {
          void form.handleSubmit(onSubmit, () =>
            toast.warning('Kiểm tra các trường được đánh dấu trong biểu mẫu.'),
          )();
        }}
      />
      <Button title="Hủy" variant="ghost" disabled={loading} onPress={onCancel} />
    </View>
  );
}
