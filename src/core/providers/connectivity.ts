import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

function isOnline() {
  return onlineManager.isOnline();
}

export function useOnline() {
  return useSyncExternalStore(onlineManager.subscribe, isOnline, () => true);
}

export async function startConnectivity() {
  // React Query already subscribes to browser online/offline events.
  if (Platform.OS === 'web') return;
  let initial = true;
  const update = (state: Network.NetworkState) => {
    onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  };
  onlineManager.setEventListener(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      initial = false;
      update(state);
    });
    return () => subscription.remove();
  });
  try {
    const state = await Network.getNetworkStateAsync();
    if (initial) update(state);
  } catch {
    // Keep the default; the next network event will update it.
  }
}
