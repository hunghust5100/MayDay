import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

import { getErrorMessage, isApiError } from './errors';
import { toast } from '@/shared/ui';

/**
 * Hiện lỗi API ngay dưới ô nhập tương ứng (VD `3008` → ô mật khẩu); mã không ánh xạ → toast.
 * `fields`: mã lỗi → `[tên field, thông báo]`.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Partial<Record<string, [FieldPath<T>, string]>>,
) {
  const target = isApiError(error) ? fields[error.code] : undefined;
  if (target) {
    setError(target[0], { type: 'server', message: target[1] }, { shouldFocus: true });
    return;
  }
  toast.error(getErrorMessage(error));
}
