import { z } from 'zod';

import { rules } from '@/shared/form';

export const labItemSchema = z.object({
  test_name: rules.required('tên xét nghiệm'),
  description: rules.optional(),
});

export const labRequestSchema = z.object({
  note: rules.optional(),
  items: z.array(labItemSchema).min(1, 'Vui lòng chọn ít nhất 1 xét nghiệm'),
});

export type LabRequestFormValues = z.input<typeof labRequestSchema>;
