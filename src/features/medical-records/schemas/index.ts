import { z } from 'zod';
export const recordUpdateSchema = z.object({
  status: z.enum(['completed', 'cancelled']),
  instructions: z.string().trim(),
});
export const createRecordSchema = z.object({
  template_id: z.string().min(1),
  patient_id: z.number().int().positive().optional(),
});
