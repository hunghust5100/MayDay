/**
 * Nhóm vai trò dùng để điều hướng (mỗi nhóm có bộ tab riêng).
 * Tài liệu API chỉ chốt `role_id = 3` là Bệnh nhân; ID Admin là giả định (khớp mock) — sửa ở đây khi backend chốt.
 * Mọi vai trò còn lại (bác sĩ, điều dưỡng, trưởng khoa…) dùng chung giao diện nhân viên y tế.
 */
export const ROLE_IDS = {
  ADMIN: 1,
  PATIENT: 3,
} as const;

/** Quy ước hiện tại khớp seed mock; backend luôn kiểm tra quyền cuối cùng. */
export const canEditClinicalRecord = (roleId: number) => roleId === 2 || roleId === 6;
export const canCreatePatient = (roleId: number) => roleId === 2 || roleId === 4 || roleId === 6;

export type RoleGroup = 'admin' | 'staff' | 'patient';

export function getRoleGroup(roleId: number): RoleGroup {
  if (roleId === ROLE_IDS.ADMIN) return 'admin';
  if (roleId === ROLE_IDS.PATIENT) return 'patient';
  return 'staff';
}

export const ROLE_GROUP_LABELS: Record<RoleGroup, string> = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên y tế',
  patient: 'Bệnh nhân',
};

/** Trang chủ của từng nhóm vai trò. */
export const ROLE_HOME = {
  admin: '/admin',
  staff: '/doctor',
  patient: '/patient',
} as const satisfies Record<RoleGroup, string>;
