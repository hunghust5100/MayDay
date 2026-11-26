import { CircleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon, Text } from '@/shared/ui';
import { cn } from '@/shared/utils';

/** Props chung của mọi field: nhãn, dấu * bắt buộc, gợi ý, lỗi. */
export type FieldBaseProps = {
  label?: string;
  /** Hiện dấu * đỏ sau nhãn (chỉ hiển thị — kiểm tra hợp lệ nằm ở schema). */
  required?: boolean;
  /** Dòng gợi ý dưới ô nhập (ẩn khi có lỗi). */
  hint?: string;
  /** Thông báo lỗi; có giá trị thì ô nhập chuyển viền đỏ. */
  error?: string;
  className?: string;
};

/** Khung bao quanh ô nhập: nhãn ở trên, lỗi/gợi ý ở dưới. */
export function FieldShell({
  label,
  required,
  hint,
  error,
  className,
  children,
}: FieldBaseProps & { children: ReactNode }) {
  return (
    <View className={cn('gap-1.5 roomy:gap-2', className)}>
      {label && (
        <Text variant="label">
          {label}
          {required && <Text variant="label" tone="danger"> *</Text>}
        </Text>
      )}
      {children}
      {error ? (
        <View className="flex-row items-center gap-1.5">
          <Icon as={CircleAlert} size={14} color="danger" />
          <Text variant="caption" tone="danger" className="flex-1">
            {error}
          </Text>
        </View>
      ) : (
        hint && (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        )
      )}
    </View>
  );
}
