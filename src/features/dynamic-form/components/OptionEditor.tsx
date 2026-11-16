import { useState } from 'react';
import { View } from 'react-native';

import { NumberField, SwitchField, TextField } from '@/shared/form';
import { Button, ConfirmDialog, Text } from '@/shared/ui';

import type { OptionInput } from '../types';
import { newContentCode } from '../utils/rule-editor';

export function OptionEditor({ value, onChange, disabled }: {
  value: OptionInput[]; onChange: (options: OptionInput[]) => void; disabled: boolean;
}) {
  const [removing, setRemoving] = useState<number | null>(null);
  const patch = (index: number, change: Partial<OptionInput>) => onChange(value.map((o, i) => i === index ? { ...o, ...change } : o));
  return <View className="gap-4">
    <Text variant="h3">Các lựa chọn</Text>
    <Text variant="caption" tone="muted">Thêm các đáp án để người điền chọn.</Text>
    {value.map((option, i) => <View key={option.id ?? `new-${i}`} className="gap-3 border-b border-border pb-4">
      <Text weight="semibold">Lựa chọn {i + 1}</Text>
      <TextField label={`Nội dung lựa chọn ${i + 1}`} value={option.option_text} onChange={(option_text) => patch(i, { option_text })} disabled={disabled} required />
      <NumberField label={`Thứ tự lựa chọn ${i + 1}`} value={option.order} onChange={(order) => patch(i, { order: order ?? 0 })} disabled={disabled} required />
      <SwitchField label={`Yêu cầu ảnh khi chọn lựa chọn ${i + 1}`} value={option.trigger_image_upload === 1} onChange={(v) => patch(i, { trigger_image_upload: v ? 1 : 0 })} disabled={disabled} />
      <Button title={`Bỏ lựa chọn ${i + 1}`} variant="ghost" disabled={disabled} onPress={() => setRemoving(i)} />
    </View>)}
    <Button title="Thêm lựa chọn" variant="outline" disabled={disabled} onPress={() => onChange([...value, {
      option_text: '', option_value: newContentCode('OPT'), order: Math.max(0, ...value.map((o) => o.order)) + 1, trigger_image_upload: 0,
    }])} />
    <ConfirmDialog visible={removing !== null} title="Bỏ lựa chọn?" description="Lựa chọn sẽ bị xóa khi bạn lưu câu hỏi. Thao tác này không thực hiện được nếu mẫu đã được dùng trong bệnh án." destructive
      confirmLabel="Bỏ lựa chọn" onCancel={() => setRemoving(null)} onConfirm={() => {
        onChange(value.filter((_, i) => i !== removing).sort((a, b) => a.order - b.order).map((o, index) => ({ ...o, order: index + 1 }))); setRemoving(null);
      }} />
  </View>;
}
