import { z } from 'zod';

import { rules } from '@/shared/form';

export const uas7Schema = z.object({
  iss7: rules.score(0, 3, 'điểm ngứa (ISS7)'),
  hss7: rules.score(0, 3, 'điểm nốt sẩn phù (HSS7)'),
  note: rules.optional(),
});

export type Uas7FormValues = z.input<typeof uas7Schema>;
