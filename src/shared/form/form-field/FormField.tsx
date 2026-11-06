import type { ReactElement } from 'react';
import {
  useController,
  type Control,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
} from 'react-hook-form';

export type FormFieldRenderProps<TValues extends FieldValues, TName extends FieldPath<TValues>> = {
  value: FieldPathValue<TValues, TName>;
  onChange: (value: FieldPathValue<TValues, TName>) => void;
  onBlur: () => void;
  /** Thông báo lỗi của field (đã qua schema), truyền thẳng vào prop `error` của component. */
  error?: string;
};

export type FormFieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> = {
  control: Control<TValues>;
  name: TName;
  render: (field: FormFieldRenderProps<TValues, TName>) => ReactElement;
};

/**
 * Gắn một field của react-hook-form vào component nhập liệu bất kỳ trong shared/form:
 *
 * ```tsx
 * <FormField control={control} name="phone" render={(field) => <PhoneField label="Số điện thoại" required {...field} />} />
 * ```
 */
export function FormField<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  control,
  name,
  render,
}: FormFieldProps<TValues, TName>) {
  const { field, fieldState } = useController({ control, name });
  return render({
    value: field.value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    error: fieldState.error?.message,
  });
}
