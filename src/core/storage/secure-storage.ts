import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Lưu trữ bảo mật (Keychain iOS / Keystore Android) cho dữ liệu nhạy cảm như JWT.
 * Web không có secure store → dùng localStorage (chỉ phục vụ chạy thử trên trình duyệt).
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown): Promise<void> {
    return this.set(key, JSON.stringify(value));
  },
};

/** Khóa lưu trữ dùng trong toàn ứng dụng. */
export const STORAGE_KEYS = {
  accessToken: 'drmayday.access_token',
  sessionUser: 'drmayday.session_user',
} as const;
