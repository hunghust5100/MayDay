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
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/api';
import { session, useSession } from '@/core/auth';
import { ScreenNoticeContext, Text, ToastHost } from '@/shared/ui';

import { startConnectivity, useOnline } from './connectivity';
import { restoreOfflineCache, startOfflineCache } from './offline-cache';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** react-query: coi "app quay lại foreground" như "focus cửa sổ" để làm mới dữ liệu cũ. */
function useAppFocusRefetch() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'));
    return () => subscription.remove();
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
  const online = useOnline();
  const auth = useSession();
  // Lỗi font thì vẫn chạy bằng font hệ thống.
  const ready = (fontsLoaded || Boolean(fontError)) && sessionReady;

  useEffect(() => {
    let active = true;
    let stopCache: (() => void) | undefined;
    const restoreSession = session.restore().catch(() => session.signOut().catch(() => {}));
    // Initialize retention defaults before reloading inactive queries.
    Promise.all([
      startConnectivity(),
      restoreSession.then(async () => {
        if (!active) return;
        stopCache = startOfflineCache();
        await restoreOfflineCache();
      }),
    ]).catch(() => {}).finally(() => {
      if (active) setSessionReady(true);
    });
    return () => {
      active = false;
      stopCache?.();
    };
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useAppFocusRefetch();

  // Giữ splash tới khi font + phiên đăng nhập sẵn sàng.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <ScreenNoticeContext.Provider value={online ? null : (
            <View className="bg-warning-soft px-3 py-1.5">
              <Text variant="caption" tone="warning" align="center" accessibilityLiveRegion="polite">
                {auth.status === 'signedIn' ? 'Ngoại tuyến · Có thể xem dữ liệu đã tải' : 'Ngoại tuyến · Kết nối mạng để tiếp tục'}
              </Text>
            </View>
          )}>
            {children}
          </ScreenNoticeContext.Provider>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
