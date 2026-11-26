import { Building2, DoorOpen, Stethoscope } from 'lucide-react-native';
import { View } from 'react-native';

import { useBranches, useDepartments, useRooms } from '@/features/facilities';
import { SelectField } from '@/shared/form';

export type WorkplaceValue = { branch_id: number | null; department_id: number | null; room_id: number | null };

type WorkplaceFieldsProps = {
  value: WorkplaceValue;
  onChange: (next: WorkplaceValue) => void;
  errors?: Partial<Record<keyof WorkplaceValue, string>>;
};

/** Chọn Chi nhánh → Khoa → Phòng; đổi cấp trên thì xóa lựa chọn cấp dưới. */
export function WorkplaceFields({ value, onChange, errors }: WorkplaceFieldsProps) {
  const branches = useBranches();
  const departments = useDepartments(value.branch_id);
  const rooms = useRooms(value.department_id);

  return (
    <View className="gap-[18px]">
      <SelectField
        label="Chi nhánh"
        required
        leftIcon={Building2}
        placeholder={branches.isLoading ? 'Đang tải…' : 'Chọn chi nhánh'}
        options={(branches.data ?? []).map((b) => ({ value: b.id, label: b.name, description: b.address }))}
        value={value.branch_id}
        onChange={(branchId) => onChange({ branch_id: branchId, department_id: null, room_id: null })}
        error={errors?.branch_id}
      />
      <SelectField
        label="Khoa"
        required
        leftIcon={Stethoscope}
        disabled={value.branch_id === null}
        placeholder={value.branch_id === null ? 'Chọn chi nhánh trước' : 'Chọn khoa'}
        options={value.branch_id === null ? [] : (departments.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
        value={value.department_id}
        onChange={(departmentId) => onChange({ ...value, department_id: departmentId, room_id: null })}
        error={errors?.department_id}
      />
      <SelectField
        label="Phòng khám"
        leftIcon={DoorOpen}
        disabled={value.department_id === null}
        placeholder={value.department_id === null ? 'Chọn khoa trước' : 'Không có phòng cố định'}
        options={[
          { value: 0, label: 'Không có phòng cố định' },
          ...(value.department_id === null ? [] : (rooms.data ?? []).map((r) => ({ value: r.id, label: r.name }))),
        ]}
        value={value.room_id ?? (value.department_id === null ? null : 0)}
        onChange={(roomId) => onChange({ ...value, room_id: roomId === 0 ? null : roomId })}
        error={errors?.room_id}
      />
    </View>
  );
}
