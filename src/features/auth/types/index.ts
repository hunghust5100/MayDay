import type { SessionUser } from '@/core/auth';
import type { Gender } from '@/shared/types';

// Model & DTO theo tài liệu "Xác thực và quản lý tài khoản người dùng".

/** auth01 — body đăng ký. */
export type SignupRequest = {
  full_name: string;
  phone: string;
  password: string;
  gender?: Gender;
  year_of_birth?: number;
};

/** auth01 — tài khoản vừa tạo. */
export type SignupResponse = {
  user_id: number;
  full_name: string;
  phone: string;
  gender: Gender | null;
  role_id: number;
  is_active: number;
  created_at: string;
};

/** auth02 — body đăng nhập. */
export type LoginRequest = { phone: string; password: string };

/** auth02 — JWT + thông tin tối thiểu của người dùng. */
export type LoginResponse = { token: string; user_info: SessionUser };

/** auth05 */
export type ResetPasswordRequest = { phone: string; otp: string; new_password: string; confirm_password: string };

/** auth06 */
export type ChangePasswordRequest = { old_password: string; new_password: string; confirm_password: string };
