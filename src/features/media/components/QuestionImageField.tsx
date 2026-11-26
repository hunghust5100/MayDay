import { View } from 'react-native';
import type { FormQuestion, FormValues, ImageSelections } from '@/shared/types/clinical-form';
import { AttachmentPicker } from './AttachmentPicker';
import type { UploadContext } from '../types';
const flag = (v: unknown) => v === true || v === 1 || v === '1';
export function QuestionImageField({
  question,
  answer,
  images,
  onChange,
  editable,
  context,
}: {
  question: FormQuestion;
  answer: FormValues[string];
  images: ImageSelections[string];
  onChange: (images: ImageSelections[string]) => void;
  editable: boolean;
  context?: UploadContext;
}) {
  const selected = Array.isArray(answer) ? answer : [answer];
  const options = (question.options ?? []).filter(
    (o) => selected.includes(o.option_value) && flag(o.trigger_image_upload),
  );
  const slots = [
    ...(question.type_question === 'image_upload' || flag(question.allow_image)
      ? [{ label: 'Ảnh minh họa', value: null }]
      : []),
    ...options.map((o) => ({ label: `Ảnh cho “${o.option_text}” *`, value: o.option_value })),
  ];
  // Luôn cho xem các liên kết cũ, kể cả khi metadata mẫu đã thay đổi.
  if (!editable)
    return images.length ? (
      <AttachmentPicker value={images} onChange={() => {}} disabled label="Ảnh đã đính kèm" />
    ) : null;
  return (
    <View className="gap-3">
      {slots.map((slot) => (
        <AttachmentPicker
          key={slot.value ?? 'general'}
          label={slot.label}
          value={images.filter((a) => (a.option_value ?? null) === slot.value)}
          context={context}
          onChange={(next) =>
            onChange([
              ...images.filter((a) => (a.option_value ?? null) !== slot.value),
              ...next.map((a) => ({ ...a, option_value: slot.value })),
            ])
          }
        />
      ))}
    </View>
  );
}
