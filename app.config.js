const { readFirebaseConfig } = require('./scripts/firebase-config.cjs');

module.exports = ({ config }) => {
  const { androidFile, iosFile, android, ios } = readFirebaseConfig();
  const buildPlatform = process.env.EAS_BUILD_PLATFORM;
  // EAS file variables may be absent on the developer machine during signing setup.
  if (process.env.EAS_BUILD === 'true') {
    if (buildPlatform === 'android' && android && !androidFile) throw new Error('Missing EAS file variable MAYDAY_GOOGLE_SERVICES_JSON.');
    if (buildPlatform === 'ios' && ios && !iosFile) throw new Error('Missing EAS file variable MAYDAY_GOOGLE_SERVICE_INFO_PLIST.');
  }
  const plugins = [...(config.plugins ?? [])];
  if (android || ios) {
    const icon = './assets/images/android-icon-monochrome.png';
    plugins.push(
      '@react-native-firebase/app',
      ['@react-native-firebase/messaging', android ? { android: { notificationIcon: icon } } : {}],
    );
    if (android) plugins.push(['./scripts/with-android-notification-icon.cjs', { icon }]);
  }
  if (ios) plugins.push(['expo-build-properties', { ios: { useFrameworks: 'dynamic' } }]);

  return {
    ...config,
    android: {
      ...config.android,
      package: process.env.MAYDAY_ANDROID_PACKAGE || 'vn.drmayday.app',
      ...(android && {
        ...(androidFile && { googleServicesFile: androidFile }),
        permissions: [...(config.android?.permissions ?? []), 'android.permission.POST_NOTIFICATIONS'],
      }),
    },
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.MAYDAY_IOS_BUNDLE_ID || 'vn.drmayday.app',
      ...(ios && {
        ...(iosFile && { googleServicesFile: iosFile }),
        entitlements: {
          ...config.ios?.entitlements,
          'aps-environment': process.env.MAYDAY_APS_ENVIRONMENT || 'production',
        },
      }),
    },
    plugins,
    extra: { ...config.extra, firebasePush: { android, ios } },
  };
};
