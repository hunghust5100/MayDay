import { z } from 'zod';
import { rules } from '@/shared/form';

export function validTimestamp(value: string) {
  if (!value) return true;
  const match = /^([0-9]{4}-[0-9]{2}-[0-9]{2})[ T]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(value);
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] ?? 0) > 59) return false;
  const day = new Date(match[1] + 'T00:00:00Z');
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === match[1];
}
export const observationSchema = (mode: 'episode' | 'location') =>
  z
    .object({
      name: z.string().trim(),
      body_part: z.string().trim(),
      occurred_at: z.string().refine(validTimestamp, 'Ngày giờ không hợp lệ'),
      context_tags: z.array(z.string()),
      context_other: z.string().trim(),
      medication_name: z.string().trim(),
      medicationInterval: z.number().min(0, 'Thời gian không được âm').nullable(),
      medication_unit: z.enum(['hour', 'day']),
      description: z.string().trim(),
    })
    .superRefine((value, ctx) => {
      const field = mode === 'episode' ? 'name' : 'body_part';
      if (!value[field])
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Vui lòng nhập ' + (mode === 'episode' ? 'tên đợt tổn thương' : 'vị trí cơ thể'),
        });
    });
export type ObservationValues = z.infer<ReturnType<typeof observationSchema>>;
export const photoSchema = z.object({
  attachment_id: rules.required('ảnh'),
  milestone: z.enum(['start', 'peak', 'normal']),
  taken_at: z.string().refine(validTimestamp, 'Ngày giờ không hợp lệ'),
  itch_score: z.number().min(0, 'Điểm phải từ 0 đến 10').max(10, 'Điểm phải từ 0 đến 10').nullable(),
  pain_score: z.number().min(0, 'Điểm phải từ 0 đến 10').max(10, 'Điểm phải từ 0 đến 10').nullable(),
  burn_score: z.number().min(0, 'Điểm phải từ 0 đến 10').max(10, 'Điểm phải từ 0 đến 10').nullable(),
  hives_count: z.number().int('Số nốt sẩn phải là số nguyên').min(0, 'Số nốt sẩn không được âm').nullable(),
});
