import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { env } from '@/core/config';
import { secureStorage } from '@/core/storage';

export { getPushTransport } from './push-transport';

const bindingKey = 'drmayday.fcm_binding_v1';
export type PushBinding = { userId: number; scope: string; token: string };

export const pushDevice = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;
export const pushAvailable = Boolean(
  pushDevice && !env.apiMock && !isRunningInExpoGo() && Constants.expoConfig?.extra?.firebasePush?.[pushDevice],
);

export function loadPushBinding() {
  return pushAvailable ? secureStorage.getJSON<PushBinding>(bindingKey) : Promise.resolve(null);
}

export function storePushBinding(binding: PushBinding | null) {
  return binding ? secureStorage.setJSON(bindingKey, binding) : secureStorage.remove(bindingKey);
}

export async function readRegisteredPushToken(userId: number) {
  const binding = await loadPushBinding().catch(() => null);
  return binding?.userId === userId ? binding.token : undefined;
}
