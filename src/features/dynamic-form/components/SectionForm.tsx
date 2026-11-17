import type { z } from 'zod';
import { View } from 'react-native';

import { FormField, NumberField, SelectField, SwitchField, TextField, useZodForm } from '@/shared/form';
import { Button, Text } from '@/shared/ui';

import { sectionSchema } from '../schemas';
import type { TemplateSection } from '../types';
import { FILLED_BY_LABELS } from '../utils/tree';

export function SectionForm({ initial, nextOrder, loading, errorMessage, onSubmit, onCancel }: {
  initial?: TemplateSection; nextOrder: number; loading: boolean; errorMessage?: string;
  onSubmit: (values: z.output<typeof sectionSchema>) => void; onCancel: () => void;
}) {
  const form = useZodForm(sectionSchema, { defaultValues: {
    title: initial?.title ?? '', order: initial?.order ?? nextOrder,
    is_required: initial?.is_required ?? 0, filled_by: initial?.filled_by ?? 'patient',
  } });
  return <View className="gap-4">
    <FormField control={form.control} name="title" render={(field) => <TextField {...field} label="Tiêu đề phần" required disabled={loading} />} />
    <FormField control={form.control} name="order" render={(field) => <NumberField {...field} onChange={(v) => field.onChange(v ?? 0)} label="Thứ tự phần" required disabled={loading} />} />
    <FormField control={form.control} name="filled_by" render={(field) => <SelectField {...field} presentation="dialog" label="Người điền" disabled={loading}
      options={Object.entries(FILLED_BY_LABELS).map(([value, label]) => ({ value: value as TemplateSection['filled_by'], label }))} />} />
    <FormField control={form.control} name="is_required" render={({ value, onChange }) => <SwitchField label="Phần bắt buộc" value={value === 1} onChange={(v) => onChange(v ? 1 : 0)} disabled={loading} />} />
    {Boolean(errorMessage) && <Text tone="danger" accessibilityRole="alert">{errorMessage}</Text>}
    <Button title="Lưu phần" loading={loading} onPress={() => form.handleSubmit(onSubmit)()} />
    <Button title="Hủy chỉnh sửa" variant="ghost" disabled={loading} onPress={onCancel} />
  </View>;
}
