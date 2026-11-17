import type { z } from 'zod';
import { View } from 'react-native';

import { FormField, SwitchField, TextField, useZodForm } from '@/shared/form';
import { Button, Text } from '@/shared/ui';

import { createTemplateSchema, updateTemplateSchema } from '../schemas';
import type { TemplateSummary } from '../types';

export type TemplateFormValues = z.output<typeof createTemplateSchema>;

export function TemplateForm({ initial, loading, errorMessage, duplicateCode, onSubmit }: {
  initial?: TemplateSummary;
  loading: boolean;
  errorMessage?: string;
  duplicateCode?: boolean;
  onSubmit: (values: TemplateFormValues) => void;
}) {
  const form = useZodForm(initial ? updateTemplateSchema : createTemplateSchema, {
    defaultValues: {
      code_template: initial?.code_template ?? '',
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      version: initial?.version ?? '1.0',
      is_active: initial?.is_active ?? 1,
    },
  });
  const submit = form.handleSubmit((values) => { if (!loading) onSubmit(values); });
  return (
    <View className="gap-[18px]">
      <Text tone="muted">{initial ? 'Cập nhật thông tin chung. Mã mẫu không thể thay đổi.' : 'Tạo thông tin chung cho mẫu phiếu khám mới.'}</Text>
      <FormField control={form.control} name="code_template" render={(field) => (
        <TextField
          {...field}
          error={field.error ?? (duplicateCode ? 'Mã mẫu đã tồn tại. Hãy chọn mã khác.' : undefined)}
          label="Mã mẫu phiếu" required maxLength={255} disabled={Boolean(initial) || loading}
          placeholder="VD: TMPL_URT_CHRONIC" autoCapitalize="characters" autoCorrect={false}
          hint="Chữ in hoa, số và dấu gạch dưới. Mã không thể đổi sau khi tạo."
        />
      )} />
      <FormField control={form.control} name="name" render={(field) => (
        <TextField {...field} label="Tên mẫu phiếu" required disabled={loading} placeholder="VD: Phiếu khám mề đay mạn tính" />
      )} />
      <FormField control={form.control} name="description" render={(field) => (
        <TextField {...field} label="Mô tả" disabled={loading} placeholder="Đối tượng và mục đích sử dụng" />
      )} />
      <FormField control={form.control} name="version" render={(field) => (
        <TextField {...field} label="Phiên bản" required disabled={loading} placeholder="1.0" autoCapitalize="none" />
      )} />
      <FormField control={form.control} name="is_active" render={({ value, onChange }) => (
        <SwitchField value={value === 1} onChange={(checked) => onChange(checked ? 1 : 0)} disabled={loading}
          label="Đang hoạt động" description="Chỉ mẫu đang hoạt động mới được dùng để tạo bệnh án mới. Bệnh án cũ vẫn được giữ lại." />
      )} />
      {errorMessage && <Text tone="danger" accessibilityRole="alert">{errorMessage}</Text>}
      <Button title={initial ? 'Lưu thay đổi' : 'Tạo mẫu phiếu'} fullWidth loading={loading} onPress={() => submit()} />
    </View>
  );
}
