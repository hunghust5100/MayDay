import { Redirect } from 'expo-router';

import { getRoleGroup, ROLE_HOME, useSession } from '@/core/auth';

/** Điểm vào: chưa đăng nhập → đăng nhập; đã đăng nhập → trang chủ theo vai trò. */
export default function Index() {
  const auth = useSession();
  if (auth.status !== 'signedIn') return <Redirect href="/login" />;
  return <Redirect href={ROLE_HOME[getRoleGroup(auth.user.role_id)]} />;
}
