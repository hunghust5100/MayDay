import { useRouter } from 'expo-router';

/** Về màn đăng nhập: quay lại nếu đi từ đó tới, không thì thay màn; `phone` → điền sẵn. */
export function useBackToLogin() {
  const router = useRouter();
  return (phone?: string) => {
    const target = { pathname: '/login', params: phone ? { phone } : {} } as const;
    if (router.canDismiss()) router.dismissTo(target);
    else router.replace(target);
  };
}
