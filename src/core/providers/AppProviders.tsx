import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/api';
import { session } from '@/core/auth';
import { ToastHost } from '@/shared/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** react-query: coi "app quay lại foreground" như "focus cửa sổ" để làm mới dữ liệu cũ. */
function useAppFocusRefetch() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => subscription.remove();
  }, []);
}

/** Đăng xuất → xóa toàn bộ cache dữ liệu của người dùng cũ. */
function useClearCacheOnSignOut() {
  useEffect(() => {
    let previous = session.getState().status;
    return session.subscribe(() => {
      const current = session.getState().status;
      if (previous === 'signedIn' && current === 'signedOut') queryClient.clear();
      previous = current;
    });
  }, []);
}

/** Gộp các Provider gốc: cử chỉ, vùng an toàn, react-query, font, phiên đăng nhập, toast. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });
  const [sessionReady, setSessionReady] = useState(false);
  // Lỗi font thì vẫn chạy bằng font hệ thống.
  const ready = (fontsLoaded || Boolean(fontError)) && sessionReady;

  useEffect(() => {
    session
      .restore()
      .catch(() => session.signOut())
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useAppFocusRefetch();
  useClearCacheOnSignOut();

  // Giữ splash tới khi font + phiên đăng nhập sẵn sàng.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {children}
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
