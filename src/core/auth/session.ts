import { useSyncExternalStore } from 'react';

import { secureStorage, STORAGE_KEYS } from '@/core/storage';

/** Thông tin người dùng trả về từ `login` (`data.user_info`). */
export type SessionUser = {
  user_id: number;
  full_name: string;
  display_name: string;
  phone: string;
  role_id: number;
};

export type SessionState =
  | { status: 'loading'; token: null; user: null }
  | { status: 'signedOut'; token: null; user: null }
  | { status: 'signedIn'; token: string; user: SessionUser };

let state: SessionState = { status: 'loading', token: null, user: null };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Phiên đăng nhập: giữ JWT + user trong bộ nhớ, đồng bộ với secure storage.
 * Gọi được ngoài React (API client đọc token qua `session.getToken()`).
 */
export const session = {
  getState: () => state,
  /** Lắng nghe thay đổi phiên (ngoài React); trả hàm hủy. */
  subscribe,
  getToken: () => state.token,

  /** Đọc phiên đã lưu khi mở app. */
  async restore() {
    const [token, user] = await Promise.all([
      secureStorage.get(STORAGE_KEYS.accessToken),
      secureStorage.getJSON<SessionUser>(STORAGE_KEYS.sessionUser),
    ]);
    setState(token && user ? { status: 'signedIn', token, user } : { status: 'signedOut', token: null, user: null });
  },

  /**
   * Bắt đầu phiên sau khi `login` thành công.
   * `remember: false` → chỉ giữ trong bộ nhớ, đóng app là phải đăng nhập lại.
   */
  async signIn(token: string, user: SessionUser, { remember = true }: { remember?: boolean } = {}) {
    if (remember) {
      await Promise.all([
        secureStorage.set(STORAGE_KEYS.accessToken, token),
        secureStorage.setJSON(STORAGE_KEYS.sessionUser, user),
      ]);
    } else {
      await Promise.all([secureStorage.remove(STORAGE_KEYS.accessToken), secureStorage.remove(STORAGE_KEYS.sessionUser)]);
    }
    setState({ status: 'signedIn', token, user });
  },

  /** Cập nhật thông tin user (VD sau khi sửa hồ sơ). */
  async updateUser(patch: Partial<SessionUser>) {
    if (state.status !== 'signedIn') return;
    const user = { ...state.user, ...patch };
    // Chỉ ghi xuống máy nếu phiên đang được ghi nhớ.
    if (await secureStorage.get(STORAGE_KEYS.accessToken)) await secureStorage.setJSON(STORAGE_KEYS.sessionUser, user);
    setState({ ...state, user });
  },

  /** Xóa phiên cục bộ (sau `logout`, hoặc khi token hết hạn/không hợp lệ). */
  async signOut() {
    await Promise.all([secureStorage.remove(STORAGE_KEYS.accessToken), secureStorage.remove(STORAGE_KEYS.sessionUser)]);
    setState({ status: 'signedOut', token: null, user: null });
  },
};

/** Đọc phiên đăng nhập trong component; tự render lại khi đăng nhập/đăng xuất. */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, session.getState, session.getState);
}
