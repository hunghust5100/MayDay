import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type Resolver, type UseFormProps } from 'react-hook-form';
import type { z } from 'zod';

/**
 * `useForm` gắn sẵn zod schema; kiểm tra khi rời ô (onTouched) để báo lỗi ngay tại từng ô.
 *
 * ```ts
 * const form = useZodForm(loginSchema, { defaultValues: { phone: '', password: '' } });
 * ```
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, 'resolver'>,
) {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    mode: 'onTouched',
    ...options,
    // zodResolver suy kiểu theo schema cụ thể; với schema generic phải ép về đúng cặp input/output.
    resolver: zodResolver(schema) as unknown as Resolver<z.input<TSchema>, unknown, z.output<TSchema>>,
  });
}
