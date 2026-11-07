import { Redirect, Stack } from 'expo-router';

import { getRoleGroup, type RoleGroup } from './roles';
import { useSession } from './session';

const screenOptions = { headerShown: false } as const;

/** Nhóm màn chưa đăng nhập (đăng nhập, đăng ký…); đã đăng nhập thì về điểm vào để chuyển theo vai trò. */
export function SignedOutStack() {
  const { status } = useSession();
  if (status === 'signedIn') return <Redirect href="/" />;
  return <Stack screenOptions={screenOptions} />;
}

/** Nhóm màn cần đăng nhập; mất phiên (đăng xuất, token hết hạn) thì về màn đăng nhập. */
export function SignedInStack() {
  const { status } = useSession();
  if (status !== 'signedIn') return <Redirect href="/login" />;
  return <Stack screenOptions={screenOptions} />;
}

/** Nhóm màn của một vai trò; sai vai trò thì về điểm vào để chuyển đúng trang chủ. */
export function RoleStack({ group }: { group: RoleGroup }) {
  const auth = useSession();
  if (auth.status !== 'signedIn') return null; // SignedInStack phía trên đã xử lý chuyển hướng
  if (getRoleGroup(auth.user.role_id) !== group) return <Redirect href="/" />;
  return <Stack screenOptions={screenOptions} />;
}
