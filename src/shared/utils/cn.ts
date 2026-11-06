import { extendTailwindMerge, type ClassNameValue } from 'tailwind-merge';
import { createTV } from 'tailwind-variants';

import { radius } from '@/shared/theme/tokens';

/** Khai báo token tùy biến để tailwind-merge biết class nào xung đột (VD `rounded-card` vs `rounded-full`). */
const twMergeConfig = {
  theme: { borderRadius: Object.keys(radius) },
};

const twMerge = extendTailwindMerge({ extend: twMergeConfig });

/** Gộp class Tailwind, class sau ghi đè class trước cùng nhóm. */
export function cn(...inputs: ClassNameValue[]) {
  return twMerge(inputs);
}

/** `tv()` dùng chung cấu hình merge ở trên — mọi component khai báo biến thể qua hàm này. */
export const tv = createTV({ twMergeConfig });

export type { VariantProps } from 'tailwind-variants';
