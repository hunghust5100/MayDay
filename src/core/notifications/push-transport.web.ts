import type { getPushTransport as getNativePushTransport } from './push-transport';

export const getPushTransport: typeof getNativePushTransport = async () => {
  throw new Error('Device notifications are available in the native app.');
};
