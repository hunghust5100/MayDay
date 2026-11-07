import { ShieldCheck } from 'lucide-react-native';

import { SelectField } from '@/shared/form';

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
  const { data: roles = [], isLoading } = useRoles();
  return (
    <SelectField
      label={label}
      required={required}
      hint={hint}
      disabled={disabled}
      leftIcon={ShieldCheck}
      placeholder={isLoading ? 'Đang tải…' : 'Chọn vai trò'}
      options={roles.filter((r) => !exclude.includes(r.id)).map((r) => ({ value: r.id, label: roleTitle(r), description: r.name }))}
      value={value}
      onChange={onChange}
      error={error}
    />
  );
}
