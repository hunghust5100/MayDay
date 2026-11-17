import { MOCK_CONFIG, ROLE } from '../config';
import { authenticate, issueToken, requireAdmin, requirePatient } from '../core/auth';
import { ok, reject, type MockRequest } from '../core/http';
import type { RouteDef } from '../core/router';
import {
  checkDate,
  checkGender,
  checkPassword,
  checkPhone,
  checkYearOfBirth,
  optInt,
  optString,
  readBody,
  reqInt,
  reqString,
  requireAny,
  requireFields,
} from '../core/validate';
import {
  db,
  emptyPatient,
  findUserByPhone,
  insertUser,
  isPatientRole,
  isValidWorkplace,
  nowString,
  toPatientProfile,
  toStaff,
  toUserInfo,
  type PatientRow,
} from '../db/store';

// Tài liệu: "Xác thực và quản lý tài khoản người dùng" — auth01–auth07, profile01–profile02.

/** auth01 — Đăng ký tài khoản bệnh nhân. */
function signup(req: MockRequest) {
  const body = readBody(req);
  requireFields(body, ['full_name', 'phone', 'password']);
  const fullName = reqString(body, 'full_name').trim();
  const phone = reqString(body, 'phone');
  const password = reqString(body, 'password');
  const gender = optString(body, 'gender');
  const yearOfBirth = optInt(body, 'year_of_birth');

  checkPhone(phone);
  checkPassword(password);
  checkGender(gender);
  checkYearOfBirth(yearOfBirth);
  if (findUserByPhone(phone)) reject('3006');

  const user = insertUser({ full_name: fullName, phone, password, gender, role_id: ROLE.PATIENT });
  db.patients.set(user.user_id, emptyPatient(user.user_id, { year_of_birth: yearOfBirth ?? null }));
  return ok({
    user_id: user.user_id,
    full_name: user.full_name,
    phone: user.phone,
    gender: user.gender,
    role_id: user.role_id,
    is_active: user.is_active,
    created_at: user.created_at,
  });
}

/** auth02 — Đăng nhập: tồn tại → mật khẩu → `is_active`, rồi cấp token. */
function login(req: MockRequest) {
  const body = readBody(req);
  requireFields(body, ['phone', 'password']);
  const phone = reqString(body, 'phone');
  const password = reqString(body, 'password');
  checkPhone(phone);

  const user = findUserByPhone(phone);
  if (!user) reject('3007');
  if (user.password !== password) reject('3008');
  if (user.is_active !== 1) reject('3101');
  return ok({ token: issueToken(user), user_info: toUserInfo(user) });
}

/** auth03 — Blacklist JWT and remove this user's device token when supplied. */
function logout(req: MockRequest) {
  const { user, jti } = authenticate(req);
  const token = req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>).fcm_token : undefined;
  db.token_blacklist.add(jti);
  for (const [id, row] of db.user_fcm_tokens) if (row.user_id === user.user_id && row.fcm_token === token) db.user_fcm_tokens.delete(id);
  return ok();
}

/** auth04 — Quên mật khẩu: "gửi" OTP (mock luôn là `MOCK_CONFIG.otp`, in ra console). */
function forgotPassword(req: MockRequest) {
  const body = readBody(req);
  requireFields(body, ['phone']);
  const phone = reqString(body, 'phone');
  checkPhone(phone);

  const user = findUserByPhone(phone);
  if (!user) reject('3007');
  user.reset_otp = MOCK_CONFIG.otp;
  user.reset_expires_at = Date.now() + MOCK_CONFIG.otpTtlMinutes * 60_000;
  console.info(`[mock] OTP đặt lại mật khẩu cho ${phone}: ${MOCK_CONFIG.otp} (hết hạn sau ${MOCK_CONFIG.otpTtlMinutes} phút)`);
  return ok();
}

/** auth05 — Đặt lại mật khẩu bằng OTP; mọi token cũ của tài khoản mất hiệu lực. */
function resetPassword(req: MockRequest) {
  const body = readBody(req);
  requireFields(body, ['phone', 'otp', 'new_password', 'confirm_password']);
  const phone = reqString(body, 'phone');
  const otp = reqString(body, 'otp');
  const newPassword = reqString(body, 'new_password');
  const confirmPassword = reqString(body, 'confirm_password');
  checkPhone(phone);
  if (newPassword !== confirmPassword) reject('2003');
  checkPassword(newPassword);

  const user = findUserByPhone(phone);
  if (!user) reject('3007');
  if (!user.reset_otp || user.reset_otp !== otp) reject('3004');
  if (!user.reset_expires_at || user.reset_expires_at < Date.now()) reject('3005');

  user.password = newPassword;
  user.reset_otp = null;
  user.reset_expires_at = null;
  user.token_version += 1;
  user.updated_at = nowString();
  return ok();
}

/** auth06 — Đổi mật khẩu; token hiện tại bị blacklist → client phải đăng nhập lại. */
function changePassword(req: MockRequest) {
  const { user, jti } = authenticate(req);
  const body = readBody(req);
  requireFields(body, ['old_password', 'new_password', 'confirm_password']);
  const oldPassword = reqString(body, 'old_password');
  const newPassword = reqString(body, 'new_password');
  const confirmPassword = reqString(body, 'confirm_password');
  if (newPassword !== confirmPassword || newPassword === oldPassword) reject('2003');
  checkPassword(newPassword);
  if (user.password !== oldPassword) reject('3009');

  user.password = newPassword;
  user.updated_at = nowString();
  db.token_blacklist.add(jti);
  return ok();
}

/** auth07 — Admin tạo tài khoản nhân viên y tế (`users` + `staffs`). */
function createStaff(req: MockRequest) {
  requireAdmin(req);
  const body = readBody(req);
  requireFields(body, ['full_name', 'phone', 'password', 'role_id', 'branch_id', 'department_id']);
  const fullName = reqString(body, 'full_name').trim();
  const phone = reqString(body, 'phone');
  const password = reqString(body, 'password');
  const gender = optString(body, 'gender');
  const roleId = reqInt(body, 'role_id');
  const branchId = reqInt(body, 'branch_id');
  const departmentId = reqInt(body, 'department_id');
  const roomId = optInt(body, 'room_id');

  checkPhone(phone);
  checkPassword(password);
  checkGender(gender);
  if (!db.roles.has(roleId) || isPatientRole(roleId)) reject('2003');
  if (!isValidWorkplace(branchId, departmentId, roomId)) reject('2003');
  if (findUserByPhone(phone)) reject('3006');

  const user = insertUser({ full_name: fullName, phone, password, gender, role_id: roleId });
  db.staffs.set(user.user_id, {
    user_id: user.user_id,
    branch_id: branchId,
    department_id: departmentId,
    room_id: roomId ?? null,
  });
  return ok(toStaff(user));
}

/** profile01 — Bệnh nhân xem hồ sơ của mình. */
function getProfile(req: MockRequest) {
  const { user } = requirePatient(req);
  return ok(toPatientProfile(user));
}

const PROFILE_TEXT_FIELDS = [
  'career',
  'ethnic',
  'hamlet_address',
  'commune_address',
  'city_address',
  'work_place',
  'health_insurance_number',
  'health_insurance_validate',
  'next_of_kin_name',
  'next_of_kin_phone',
] as const;

/** profile02 — Cập nhật một phần hồ sơ (không cho sửa `phone`, `role_id`, `is_active`). */
function updateProfile(req: MockRequest) {
  const { user } = requirePatient(req);
  const body = readBody(req);
  requireAny(body, ['full_name', 'gender', 'year_of_birth', ...PROFILE_TEXT_FIELDS]);

  const fullName = optString(body, 'full_name');
  const gender = optString(body, 'gender');
  const yearOfBirth = optInt(body, 'year_of_birth');
  const patch: Partial<PatientRow> = {};
  for (const key of PROFILE_TEXT_FIELDS) {
    const value = optString(body, key);
    if (value !== undefined) patch[key] = value?.trim() || null;
  }

  if (fullName !== undefined && !fullName?.trim()) reject('2003');
  checkGender(gender);
  checkYearOfBirth(yearOfBirth);
  if (patch.next_of_kin_phone) checkPhone(patch.next_of_kin_phone);
  checkDate(patch.health_insurance_validate);

  if (fullName) user.full_name = fullName.trim();
  if (gender !== undefined) user.gender = gender;
  if (yearOfBirth !== undefined) patch.year_of_birth = yearOfBirth;
  user.updated_at = nowString();
  db.patients.set(user.user_id, { ...(db.patients.get(user.user_id) ?? emptyPatient(user.user_id)), ...patch });
  return ok(toPatientProfile(user));
}

export const authRoutes: RouteDef[] = [
  ['POST', '/auth/signup', signup],
  ['POST', '/auth/login', login],
  ['POST', '/auth/logout', logout],
  ['POST', '/auth/forgot-password', forgotPassword],
  ['POST', '/auth/reset-password', resetPassword],
  ['PUT', '/auth/change-password', changePassword],
  ['POST', '/auth/admin/create-staff', createStaff],
  ['GET', '/profile', getProfile],
  ['PUT', '/profile', updateProfile],
];
