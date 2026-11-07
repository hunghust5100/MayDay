import type { PatientProfile } from '@/features/profile';
import type { Gender } from '@/shared/types';

// Model & DTO theo tài liệu "Quản trị người dùng, Phân Quyền" (+ create_staff của tài liệu Xác thực).

/** admin02 — một dòng trong danh sách người dùng. */
export type UserListItem = {
  user_id: number;
  full_name: string;
  phone: string;
  role_id: number;
  is_active: number;
  created_at: string;
};

export type UserFilters = { keyword?: string; role_id?: number; is_active?: 0 | 1 };

/** Đối tượng Staff (JOIN `users` + `staffs`); nhân viên chưa phân công có vị trí `null`. */
export type Staff = {
  user_id: number;
  full_name: string;
  phone: string;
  gender: Gender | null;
  role_id: number;
  branch_id: number | null;
  department_id: number | null;
  room_id: number | null;
  is_active: number;
  created_at: string;
};

/** admin03/admin04 — Patient Profile nếu là bệnh nhân, Staff nếu là nhân viên. */
export type UserDetail = PatientProfile | Staff;

export const isPatientDetail = (detail: UserDetail): detail is PatientProfile => 'year_of_birth' in detail;

/** admin01 */
export type CreateUserRequest = {
  full_name: string;
  phone: string;
  password: string;
  gender?: Gender;
  role_id: number;
  is_active?: 0 | 1;
};

/** admin01 — kết quả. */
export type CreatedUser = Pick<UserListItem, 'user_id' | 'full_name' | 'phone' | 'role_id' | 'is_active' | 'created_at'>;

/** auth07 */
export type CreateStaffRequest = {
  full_name: string;
  phone: string;
  password: string;
  gender?: Gender;
  role_id: number;
  branch_id: number;
  department_id: number;
  room_id?: number | null;
};

/** admin04 — cập nhật một phần. */
export type EditUserRequest = Partial<{ full_name: string; gender: Gender | null; role_id: number; is_active: 0 | 1 }>;

/** admin06 */
export type AssignWorkplaceRequest = { branch_id: number; department_id: number; room_id: number | null };

export type Role = { id: number; name: string; description: string | null; parent_role_id: number | null };

export type CreateRoleRequest = { name: string; description?: string; parent_role_id?: number };

export type Permission = { id: number; name: string; description: string | null; created_at: string; updated_at: string };

export type PermissionRequest = { name?: string; description?: string | null };

/** roleperm02 */
export type RolePermission = {
  role_permission_id: number;
  permission_id: number;
  name: string;
  description: string | null;
  assigned_at: string;
};

/** roleperm01 — kết quả. */
export type AssignPermissionsResult = { role_id: number; added_count: number; skipped_count: number };
