import { removeDiacritics } from '@/shared/utils';

import { ROLE } from '../config';
import { requireAdmin } from '../core/auth';
import { ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import {
  checkFlag,
  checkGender,
  checkPassword,
  checkPhone,
  optInt,
  optString,
  paramInt,
  queryInt,
  readBody,
  readPaging,
  reqInt,
  reqString,
  requireAny,
  requireFields,
} from '../core/validate';
import {
  db,
  deleteUser,
  emptyPatient,
  findUserByPhone,
  insertUser,
  isPatientRole,
  isValidWorkplace,
  nowString,
  toUserDetail,
  toUserListItem,
} from '../db/store';

// Tài liệu: "Quản trị người dùng, Phân Quyền" — admin01–admin06. Mọi API cần token Admin (không phải → 3102).

function findUser(req: MockRequest) {
  const user = db.users.get(paramInt(req, 'id'));
  if (!user) reject('3007');
  return user;
}

/** admin01 — Thêm người dùng, gán vai trò trực tiếp (bệnh nhân → tạo thêm bản ghi `patients` rỗng). */
function createUser(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  requireFields(body, ['full_name', 'phone', 'password', 'role_id']);
  const fullName = reqString(body, 'full_name').trim();
  const phone = reqString(body, 'phone');
  const password = reqString(body, 'password');
  const gender = optString(body, 'gender');
  const roleId = reqInt(body, 'role_id');
  const isActive = optInt(body, 'is_active');

  checkPhone(phone);
  checkPassword(password);
  checkGender(gender);
  checkFlag(isActive);
  if (!db.roles.has(roleId)) reject('2003');
  if (findUserByPhone(phone)) reject('3006');

  const user = insertUser({
    full_name: fullName,
    phone,
    password,
    gender,
    role_id: roleId,
    is_active: (isActive ?? 1) as 0 | 1,
  });
  if (isPatientRole(roleId)) db.patients.set(user.user_id, emptyPatient(user.user_id));
  const { user_id, full_name, role_id, is_active, created_at } = user;
  return ok({ user_id, full_name, phone, role_id, is_active, created_at });
}

/** admin02 — Danh sách người dùng: lọc `role_id`, `keyword` (tên/SĐT, không phân biệt dấu), `is_active`. */
function listUsers(req: MockRequest) {
  requireAdmin(req);
  const { limit, offset } = readPaging(req);
  const roleId = queryInt(req, 'role_id');
  const isActive = queryInt(req, 'is_active');
  const keyword = removeDiacritics(req.query.keyword?.trim() ?? '');

  const matched = [...db.users.values()]
    .filter((user) => roleId === undefined || user.role_id === roleId)
    .filter((user) => isActive === undefined || user.is_active === isActive)
    .filter((user) => !keyword || removeDiacritics(user.full_name).includes(keyword) || user.phone.includes(keyword))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.user_id - a.user_id);

  return ok(matched.slice(offset, offset + limit).map(toUserListItem), matched.length);
}

/** admin03 — Chi tiết: Patient Profile (bệnh nhân) hoặc Staff (nhân viên). */
function getUser(req: MockRequest) {
  requireAdmin(req);
  return ok(toUserDetail(findUser(req)));
}

/** admin04 — Cập nhật một phần: họ tên, giới tính, vai trò, khóa/mở khóa. */
function editUser(req: MockRequest) {
  const { user: admin } = requireAdmin(req);
  const body = readBody(req);
  requireAny(body, ['full_name', 'gender', 'role_id', 'is_active']);
  const fullName = optString(body, 'full_name');
  const gender = optString(body, 'gender');
  const roleId = optInt(body, 'role_id');
  const isActive = optInt(body, 'is_active');

  if (fullName !== undefined && !fullName?.trim()) reject('2003');
  checkGender(gender);
  checkFlag(isActive);
  if (roleId !== undefined && (roleId === null || !db.roles.has(roleId))) reject('2003');
  const user = findUser(req);
  // Admin không được tự khóa hoặc tự hạ quyền của chính mình.
  if (user.user_id === admin.user_id && (isActive === 0 || (roleId != null && roleId !== ROLE.ADMIN))) reject('3101');

  if (fullName) user.full_name = fullName.trim();
  if (gender !== undefined) user.gender = gender;
  if (isActive != null) user.is_active = isActive as 0 | 1;
  if (roleId != null && roleId !== user.role_id) {
    user.role_id = roleId;
    if (isPatientRole(roleId) && !db.patients.has(user.user_id)) db.patients.set(user.user_id, emptyPatient(user.user_id));
  }
  user.updated_at = nowString();
  return ok(toUserDetail(user));
}

/** admin05 — Xóa người dùng (CASCADE hồ sơ con); Admin không tự xóa mình. */
function removeUser(req: MockRequest) {
  const { user: admin } = requireAdmin(req);
  const user = findUser(req);
  if (user.user_id === admin.user_id) reject('3101');
  deleteUser(user.user_id);
  return ok();
}

/** admin06 — Phân công công tác: chuyển nhân viên sang chi nhánh/khoa/phòng khác. */
function assignUser(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  requireFields(body, ['branch_id', 'department_id']);
  const branchId = reqInt(body, 'branch_id');
  const departmentId = reqInt(body, 'department_id');
  const roomId = optInt(body, 'room_id');
  const user = findUser(req);
  if (isPatientRole(user.role_id)) reject('2003');
  if (!isValidWorkplace(branchId, departmentId, roomId)) reject('2003');

  const staff = { user_id: user.user_id, branch_id: branchId, department_id: departmentId, room_id: roomId ?? null };
  db.staffs.set(user.user_id, staff);
  user.updated_at = nowString();
  return ok(staff);
}

export const adminUserRoutes: RouteDef[] = [
  ['POST', '/admin/users', createUser],
  ['GET', '/admin/users', listUsers],
  ['GET', '/admin/users/:id', getUser],
  ['PUT', '/admin/users/:id', editUser],
  ['DELETE', '/admin/users/:id', removeUser],
  ['PUT', '/admin/users/:id/assign', assignUser],
];
