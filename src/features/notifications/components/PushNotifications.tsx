import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { useRootNavigationState, useRouter } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking } from 'react-native';

import { getRoleGroup, session } from '@/core/auth';
import { env } from '@/core/config';
import { getPushTransport, loadPushBinding, pushAvailable, pushDevice, storePushBinding } from '@/core/notifications';
import { toast } from '@/shared/ui';

import { notificationsApi } from '../api/notifications-api';
import { NOTIFICATIONS_QUERY_KEY } from '../hooks/useNotifications';

type Status = 'unavailable' | 'checking' | 'ready' | 'denied' | 'enabled' | 'error';
const PushContext = createContext<{ status: Status; enable: () => void }>({
  status: 'unavailable',
  enable: () => {},
});

export const usePushNotifications = () => useContext(PushContext);

function currentInbox() {
  const auth = session.getState();
  if (auth.status !== 'signedIn') return null;
  const role = getRoleGroup(auth.user.role_id);
  if (role === 'patient') return '/patient/notifications' as const;
  if (role === 'staff') return '/doctor/notifications' as const;
  return null;
}

export function PushNotifications({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(pushAvailable ? 'checking' : 'unavailable');
  const [openedFor, setOpenedFor] = useState<{ token: string } | null>(null);
  const handledOpen = useRef<typeof openedFor>(null);
  const enable = useRef(() => {});
  const router = useRouter();
  const rootKey = useRootNavigationState()?.key;
  const cache = useQueryClient();

  useEffect(() => {
    if (!rootKey || !openedFor || handledOpen.current === openedFor) return;
    handledOpen.current = openedFor;
    const inbox = currentInbox();
    if (inbox && session.getToken() === openedFor.token) router.navigate(inbox);
  }, [openedFor, rootKey, router]);

  useEffect(() => {
    if (!pushAvailable || !pushDevice) return;
    const deviceType = pushDevice;
    let active = true;
    let previousToken = session.getToken();
    let confirmed: { scope: string; token: string } | null = null;
    let work = Promise.resolve();
    const cleanups: (() => void)[] = [];
    const transportPromise = getPushTransport();

    const refreshInbox = () => {
      if (active && currentInbox() && confirmed) {
        void cache.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      }
    };
    const openInbox = () => {
      // Only honor a tray tap for the account with an active device binding.
      const token = session.getToken();
      if (!active || !token || !currentInbox()) return;
      void Promise.all([
        loadPushBinding(),
        digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([env.apiUrl, token])),
      ]).then(([binding, scope]) => {
        if (!active || session.getToken() !== token || binding?.scope !== scope) return;
        void cache.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        setOpenedFor({ token });
      }).catch(() => {});
    };

    const sync = (ask = false) => {
      work = work.then(async () => {
        const auth = session.getState();
        if (!active || !onlineManager.isOnline()) return;
        const transport = await transportPromise;
        const scope = auth.token
          ? await digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify([env.apiUrl, auth.token]))
          : null;
        let binding = await loadPushBinding();
        const stillCurrent = () => active && session.getToken() === auth.token;
        if (!stillCurrent()) return;
        if (binding && binding.scope !== scope) {
          // Rotate before registering another account. A pending binding survives offline logout.
          await transport.revoke();
          await storePushBinding(null);
          binding = null;
        }
        if (!stillCurrent() || auth.status !== 'signedIn' || !scope || !currentInbox()) return;
        if (ask) setStatus('checking');
        if (!await transport.allowed(ask)) {
          if (stillCurrent()) setStatus(ask ? 'denied' : 'ready');
          return;
        }
        const token = await transport.token();
        if (!stillCurrent()) return;
        if (confirmed?.token !== token || confirmed.scope !== scope) {
          if (binding?.token !== token || binding.scope !== scope) {
            await storePushBinding({ userId: auth.user.user_id, scope, token });
          }
          if (!stillCurrent()) return;
          await notificationsApi.registerToken({ fcm_token: token, device_type: deviceType });
          if (!stillCurrent()) return;
          confirmed = { scope, token };
        }
        setStatus('enabled');
      }).catch(() => {
        if (active && currentInbox()) setStatus('error');
      });
    };

    enable.current = () => sync(true);
    cleanups.push(session.subscribe(() => {
      const token = session.getToken();
      if (token === previousToken) return;
      previousToken = token;
      confirmed = null;
      setStatus('checking');
      sync();
    }));
    cleanups.push(onlineManager.subscribe((online) => { if (online) sync(); }));
    const appState = AppState.addEventListener('change', (state) => { if (state === 'active') sync(); });
    cleanups.push(() => appState.remove());
    void transportPromise.then((transport) => {
      if (!active) return;
      cleanups.push(transport.onRefresh(() => sync()), transport.onOpen(openInbox), transport.onMessage(() => {
        if (!currentInbox() || !confirmed) return;
        refreshInbox();
        toast.info('Bạn có thông báo mới.');
      }));
      void transport.initialNotification().then((message) => { if (message) openInbox(); }).catch(() => {});
    }).catch(() => {});
    sync();
    return () => {
      active = false;
      enable.current = () => {};
      cleanups.forEach((dispose) => dispose());
    };
  }, [cache]);

  return (
    <PushContext.Provider value={{
      status,
      enable: () => {
        if (status === 'denied') void Linking.openSettings().catch(() => {});
        else enable.current();
      },
    }}>
      {children}
    </PushContext.Provider>
  );
}
