import { ShieldCheck } from 'lucide-react-native';

import { SelectField } from '@/shared/form';
import { Button } from '@/shared/ui';

import { roleTitle, useRoles } from '../hooks/useRbac';

type RoleSelectProps = {
  value: number | null;
  onChange: (roleId: number) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  /** Bỏ bớt vai trò khỏi danh sách (VD vai trò Bệnh nhân khi tạo nhân viên). */
  exclude?: number[];
};

export function RoleSelect({ value, onChange, error, label = 'Vai trò', required = true, disabled, hint, exclude = [] }: RoleSelectProps) {
  const { data: roles = [], isLoading, isError, refetch } = useRoles();
  if (isError && roles.length === 0) {
    return <Button title="Tải lại vai trò" variant="soft" onPress={() => void refetch()} />;
  }
  return (
    <SelectField
      label={label}
      required={required}
      hint={hint}
      disabled={disabled || isLoading}
      leftIcon={ShieldCheck}
      placeholder={isLoading ? 'Đang tải…' : 'Chọn vai trò'}
      options={roles.filter((r) => !exclude.includes(r.id)).map((r) => ({ value: r.id, label: roleTitle(r) }))}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
