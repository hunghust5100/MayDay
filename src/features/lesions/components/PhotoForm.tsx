import { useState } from 'react';
import { View } from 'react-native';
import { AttachmentPicker } from '@/features/media';
import { FormField, NumberField, SelectField, useZodForm } from '@/shared/form';
import type { ImageSelection } from '@/shared/types/clinical-form';
import { Button, Text, toast } from '@/shared/ui';
import { toApiDateTime } from '@/shared/utils';
import { photoSchema } from '../schemas';
import type { LesionPhoto, PhotoInput } from '../types';
import { DateTimeField } from './DateTimeField';

export const MILESTONES = [
  { value: 'start' as const, label: 'Khởi phát' },
  { value: 'peak' as const, label: 'Đỉnh điểm' },
  { value: 'normal' as const, label: 'Trở lại bình thường' },
];
export function PhotoForm({
  episodeId,
  locationId,
  recordId,
  initial,
  loading,
  onSubmit,
  onCancel,
}: {
  episodeId: string;
  locationId: string;
  recordId: number;
  initial?: LesionPhoto;
  loading: boolean;
  onSubmit: (value: PhotoInput) => void;
  onCancel: () => void;
}) {
  const [images, setImages] = useState<ImageSelection[]>(
    initial ? [{ attachment_id: initial.attachment_id, file_url: initial.attachment.file_url }] : [],
  );
  const form = useZodForm(photoSchema, {
    defaultValues: {
      attachment_id: initial?.attachment_id ?? '',
      milestone: initial?.milestone ?? 'start',
      taken_at: initial?.taken_at ?? toApiDateTime(new Date()),
      itch_score: initial?.itch_score ?? null,
      pain_score: initial?.pain_score ?? null,
      burn_score: initial?.burn_score ?? null,
      hives_count: initial?.hives_count ?? null,
    },
  });
  return (
    <View className="gap-4">
      <AttachmentPicker
        label="Ảnh tổn thương *"
        max={1}
        value={images}
        disabled={Boolean(initial) || loading}
        context={{ medical_record_id: recordId, category: 'lesion' }}
        onChange={(next) => {
          setImages(next);
          form.setValue('attachment_id', next[0]?.attachment_id ?? '', { shouldValidate: true });
        }}
      />
      {form.formState.errors.attachment_id && (
        <Text tone="danger">{form.formState.errors.attachment_id.message}</Text>
      )}
      <FormField
        control={form.control}
        name="milestone"
        render={(field) => (
          <SelectField
            label="Mốc tiến triển"
            required
            options={MILESTONES}
            presentation="dialog"
            {...field}
          />
        )}
      />
      {!initial && (
        <FormField
          control={form.control}
          name="taken_at"
          render={(field) => <DateTimeField label="Thời điểm chụp" {...field} />}
        />
      )}
      {(['itch_score', 'pain_score', 'burn_score'] as const).map((name, i) => (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={(field) => (
            <NumberField
              label={['Mức độ ngứa (0–10)', 'Mức độ đau (0–10)', 'Mức độ rát (0–10)'][i]}
              decimal
              hint="Bỏ trống nếu chưa đánh giá"
              {...field}
            />
          )}
        />
      ))}
      <FormField
        control={form.control}
        name="hives_count"
        render={(field) => <NumberField label="Số nốt sẩn (nếu đã đếm)" {...field} />}
      />
      {initial?.local_auas != null && <Text>AUAS cục bộ do hệ thống cung cấp: {initial.local_auas}</Text>}
      <Button
        title={initial ? 'Lưu mốc và điểm số' : 'Ghi nhận ảnh tiến triển'}
        loading={loading}
        onPress={() => {
          void form.handleSubmit(
            (value) =>
              onSubmit({
                ...value,
                episode_id: episodeId,
                location_id: locationId,
                taken_at: initial ? initial.taken_at : value.taken_at || null,
                local_auas: initial?.local_auas ?? null,
                annotated_url: initial?.annotated_url ?? null,
              }),
            () => toast.warning('Kiểm tra các trường được đánh dấu trong biểu mẫu.'),
          )();
        }}
      />
      <Button title="Hủy" variant="ghost" disabled={loading} onPress={onCancel} />
    </View>
  );
}
