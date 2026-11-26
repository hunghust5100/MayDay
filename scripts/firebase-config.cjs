function readFirebaseConfig(env = process.env) {
  const androidFile = env.MAYDAY_GOOGLE_SERVICES_JSON;
  const iosFile = env.MAYDAY_GOOGLE_SERVICE_INFO_PLIST;
  const enabled = (file) => env.MAYDAY_FCM_ENABLED !== 'false'
    && (env.MAYDAY_FCM_ENABLED === 'true' || Boolean(file));

  return { androidFile, iosFile, android: enabled(androidFile), ios: enabled(iosFile) };
}

module.exports = { readFirebaseConfig };
