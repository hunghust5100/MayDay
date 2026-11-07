import { api } from '@/core/api';

import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  SignupRequest,
  SignupResponse,
} from '../types';

type Empty = Record<string, never>;

export const authApi = {
  /** auth01 — Đăng ký tài khoản bệnh nhân. */
  signup: (body: SignupRequest) => api.post<SignupResponse>('/auth/signup', body, { auth: false }),

  /** auth02 — Đăng nhập bằng SĐT + mật khẩu. */
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body, { auth: false }),

  /** auth03 — Đăng xuất: blacklist token hiện tại trên server. */
  logout: (fcmToken?: string) => api.post<Empty>('/auth/logout', fcmToken ? { fcm_token: fcmToken } : {}),

  /** auth04 — Gửi OTP đặt lại mật khẩu qua SMS. */
  forgotPassword: (phone: string) => api.post<Empty>('/auth/forgot-password', { phone }, { auth: false }),

  /** auth05 — Đặt lại mật khẩu bằng OTP. */
  resetPassword: (body: ResetPasswordRequest) => api.post<Empty>('/auth/reset-password', body, { auth: false }),

  /** auth06 — Đổi mật khẩu (token hiện tại bị thu hồi → phải đăng nhập lại). */
  changePassword: (body: ChangePasswordRequest) => api.put<Empty>('/auth/change-password', body),
};
