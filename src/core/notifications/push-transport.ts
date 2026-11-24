import { PermissionsAndroid, Platform } from 'react-native';

export async function getPushTransport() {
  const firebase = await import('@react-native-firebase/messaging');
  const messaging = firebase.getMessaging();
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const androidNeedsPermission = Platform.OS === 'android' && Number(Platform.Version) >= 33;

  return {
    async allowed(request: boolean) {
      if (Platform.OS === 'android') {
        if (!androidNeedsPermission || await PermissionsAndroid.check(permission)) return true;
        return request && await PermissionsAndroid.request(permission) === PermissionsAndroid.RESULTS.GRANTED;
      }
      const status = await firebase.hasPermission(messaging);
      const authorized = (value: number) => value >= firebase.AuthorizationStatus.AUTHORIZED;
      if (authorized(status)) return true;
      return request && authorized(await firebase.requestPermission(messaging));
    },
    async token() {
      if (Platform.OS === 'ios' && !firebase.isDeviceRegisteredForRemoteMessages(messaging)) {
        await firebase.registerDeviceForRemoteMessages(messaging);
      }
      return firebase.getToken(messaging);
    },
    revoke: () => firebase.deleteToken(messaging),
    initialNotification: () => firebase.getInitialNotification(messaging),
    onMessage: (callback: () => void) => firebase.onMessage(messaging, callback),
    onOpen: (callback: () => void) => firebase.onNotificationOpenedApp(messaging, callback),
    onRefresh: (callback: () => void) => firebase.onTokenRefresh(messaging, callback),
  };
}
