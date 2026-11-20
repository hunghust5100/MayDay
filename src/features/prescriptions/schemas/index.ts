import { z } from 'zod';

import { rules } from '@/shared/form';

export const prescriptionItemSchema = z.object({
  medicine_name: rules.required('tên thuốc'),
  dosage: rules.optional(),
  frequency: rules.optional(),
  duration: rules.optional(),
  instruction: rules.optional(),
});

export const prescriptionSchema = z.object({
  note: rules.optional(),
  items: z.array(prescriptionItemSchema).min(1, 'Đơn thuốc phải có ít nhất 1 thuốc'),
});

export type PrescriptionFormValues = z.input<typeof prescriptionSchema>;
