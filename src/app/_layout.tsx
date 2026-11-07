import '@/global.css';

import { Stack } from 'expo-router';

import { env } from '@/core/config';
import { AppProviders } from '@/core/providers';
import { installMockApi } from '@/mocks';

// Phải chạy trước mọi request: chặn fetch tới API và trả dữ liệu giả.
if (env.apiMock) installMockApi({ baseUrl: env.apiUrl });

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
