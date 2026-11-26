import { session } from '@/core/auth';
import { readRegisteredPushToken } from '@/core/notifications';

import { authApi } from './auth-api';

export async function logout() {
  const auth = session.getState();
  if (auth.status !== 'signedIn') return;
  const fcm = readRegisteredPushToken(auth.user.user_id);
  await session.signOut();
  // Best effort only. Local logout is already complete.
  void fcm.then((token) => authApi.logout(auth.token, token)).catch(() => {});
}
