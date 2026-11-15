import { shortName, toApiDateTime } from '@/shared/utils';

import { ROLE } from '../config';
import type { Gender } from '../core/validate';
import { createSeed, emptyPatient } from './seed';
import type { createClinicalSeed } from './clinical';

/** Các bảng của CSDL giả — đặt tên cột giống mô hình dữ liệu trong tài liệu API. */

export type UserRow = {
  user_id: number;
  full_name: string;
  phone: string;
  /** Mock lưu mật khẩu thô cho dễ thử; server thật lưu `password_hash`. */
  password: string;
  gender: Gender | null;
  role_id: number;
  is_active: 0 | 1;
  /** Tăng lên khi đặt lại mật khẩu → mọi token cũ của tài khoản mất hiệu lực. */
  token_version: number;
  reset_otp: string | null;
  reset_expires_at: number | null;
  created_at: string;
  updated_at: string;
};

export type PatientRow = {
  user_id: number;
  year_of_birth: number | null;
  career: string | null;
  ethnic: string | null;
  hamlet_address: string | null;
  commune_address: string | null;
  city_address: string | null;
  work_place: string | null;
  health_insurance_number: string | null;
  health_insurance_validate: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  first_visit: string | null;
};

export type StaffRow = { user_id: number; branch_id: number; department_id: number; room_id: number | null };

export type RoleRow = {
  id: number;
  name: string;
  description: string | null;
  parent_role_id: number | null;
  created_at: string;
  updated_at: string;
};

export type PermissionRow = { id: number; name: string; description: string | null; created_at: string; updated_at: string };

export type RolePermissionRow = { id: number; role_id: number; permission_id: number; created_at: string };

/** Cơ sở vật chất — CRUD chi nhánh, khoa, phòng khám. */
type Timestamps = { created_at: string; updated_at: string };
export type BranchRow = Timestamps & { id: number; name: string; address: string; phone: string };
export type DepartmentRow = Timestamps & { id: number; name: string; description: string | null; branch_id: number };
export type RoomRow = Timestamps & { id: number; name: string; description: string | null; department_id: number | null };

export type MockDb = ReturnType<typeof createClinicalSeed> & {
  users: Map<number, UserRow>;
  patients: Map<number, PatientRow>;
  staffs: Map<number, StaffRow>;
  roles: Map<number, RoleRow>;
  permissions: Map<number, PermissionRow>;
  role_permissions: RolePermissionRow[];
  branches: Map<number, BranchRow>;
  departments: Map<number, DepartmentRow>;
  rooms: Map<number, RoomRow>;
  /** `jti` của token đã đăng xuất / đổi mật khẩu (bảng `token_blacklist`). */
  token_blacklist: Set<string>;
};

/** Dữ liệu chỉ nằm trong bộ nhớ: tải lại app là về trạng thái mẫu ban đầu. */
export const db: MockDb = createSeed();

/** Đưa CSDL giả về dữ liệu mẫu ban đầu. */
export function resetDb() {
  Object.assign(db, createSeed());
}

export const nowString = () => toApiDateTime(new Date());

/** ID tự tăng: lớn nhất hiện có + 1. */
export function nextId(table: Map<number, unknown> | { id: number }[]) {
  const ids = table instanceof Map ? [...table.keys()] : table.map((row) => row.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

export const findUserByPhone = (phone: string) => [...db.users.values()].find((user) => user.phone === phone);

export const isPatientRole = (roleId: number) => roleId === ROLE.PATIENT;

export { emptyPatient };

export function insertUser(input: {
  full_name: string;
  phone: string;
  password: string;
  gender?: Gender | null;
  role_id: number;
  is_active?: 0 | 1;
}): UserRow {
  const now = nowString();
  const user: UserRow = {
    user_id: nextId(db.users),
    full_name: input.full_name,
    phone: input.phone,
    password: input.password,
    gender: input.gender ?? null,
    role_id: input.role_id,
    is_active: input.is_active ?? 1,
    token_version: 0,
    reset_otp: null,
    reset_expires_at: null,
    created_at: now,
    updated_at: now,
  };
  db.users.set(user.user_id, user);
  return user;
}

/** Xóa người dùng: CASCADE `patients`, `staffs` (token cũ tự hỏng vì không còn user). */
export function deleteUser(userId: number) {
  db.users.delete(userId);
  db.patients.delete(userId);
  db.staffs.delete(userId);
}

// ---- Định dạng dữ liệu trả về (theo tài liệu) ----

/** `data.user_info` của login. */
export const toUserInfo = (user: UserRow) => ({
  user_id: user.user_id,
  full_name: user.full_name,
  display_name: shortName(user.full_name),
  phone: user.phone,
  role_id: user.role_id,
});

/** Một dòng trong danh sách người dùng (admin02). */
export const toUserListItem = (user: UserRow) => ({
  user_id: user.user_id,
  full_name: user.full_name,
  phone: user.phone,
  role_id: user.role_id,
  is_active: user.is_active,
  created_at: user.created_at,
});

/** Patient Profile (JOIN `users` + `patients`). */
export function toPatientProfile(user: UserRow) {
  const { user_id: _, ...patient } = db.patients.get(user.user_id) ?? emptyPatient(user.user_id);
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    phone: user.phone,
    role_id: user.role_id,
    is_active: user.is_active,
    gender: user.gender,
    ...patient,
    created_at: user.created_at,
  };
}

/** Staff (JOIN `users` + `staffs`); nhân viên chưa phân công thì vị trí là `null`. */
export function toStaff(user: UserRow) {
  const staff = db.staffs.get(user.user_id);
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    phone: user.phone,
    gender: user.gender,
    role_id: user.role_id,
    branch_id: staff?.branch_id ?? null,
    department_id: staff?.department_id ?? null,
    room_id: staff?.room_id ?? null,
    is_active: user.is_active,
    created_at: user.created_at,
  };
}

/** Chi tiết người dùng: Patient Profile nếu là bệnh nhân, Staff nếu là nhân viên. */
export const toUserDetail = (user: UserRow) => (isPatientRole(user.role_id) ? toPatientProfile(user) : toStaff(user));

/** Kiểm tra vị trí công tác: tồn tại và đúng cấp (khoa thuộc chi nhánh, phòng thuộc khoa) → sai: 2003. */
export function isValidWorkplace(branchId: number, departmentId: number, roomId: number | null | undefined) {
  const department = db.departments.get(departmentId);
  if (!db.branches.has(branchId) || !department || department.branch_id !== branchId) return false;
  if (roomId == null) return true;
  return db.rooms.get(roomId)?.department_id === departmentId;
}
