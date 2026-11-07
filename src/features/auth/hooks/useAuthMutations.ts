import { useMutation } from '@tanstack/react-query';

import { session } from '@/core/auth';

import { authApi } from '../api/auth-api';
import type { ChangePasswordRequest, LoginRequest, ResetPasswordRequest, SignupRequest } from '../types';

// Màn hình tự xử lý lỗi (`meta.silent`) để hiện lỗi ngay dưới ô nhập — xem `applyFieldErrors`.

/** Đăng nhập → lưu phiên; layout tự điều hướng theo vai trò khi phiên chuyển sang `signedIn`. */
export function useLogin() {
  return useMutation({
    mutationFn: async ({ remember, ...body }: LoginRequest & { remember: boolean }) => {
      const { token, user_info } = await authApi.login(body);
      await session.signIn(token, user_info, { remember });
      return user_info;
    },
    meta: { silent: true },
  });
}

export function useSignup() {
  return useMutation({ mutationFn: (body: SignupRequest) => authApi.signup(body), meta: { silent: true } });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (phone: string) => authApi.forgotPassword(phone), meta: { silent: true } });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (body: ResetPasswordRequest) => authApi.resetPassword(body), meta: { silent: true } });
}

/** Đổi mật khẩu thành công → server đã thu hồi token → xóa phiên để đăng nhập lại. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      await authApi.changePassword(body);
      await session.signOut();
    },
    meta: { silent: true },
  });
}

/** Đăng xuất: báo server (lỗi cũng bỏ qua) rồi luôn xóa phiên cục bộ. */
export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout();
      } finally {
        await session.signOut();
      }
    },
    meta: { silent: true },
  });
}
