import { useRouter } from 'expo-router';
import { Info, Lock } from 'lucide-react-native';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { FormField, PasswordField, useZodForm } from '@/shared/form';
import { AppHeader, Button, Card, Icon, Screen, Text, toast } from '@/shared/ui';

import { useChangePassword } from '../hooks/useAuthMutations';
import { changePasswordSchema } from '../schemas';

/** auth06 — đổi mật khẩu; thành công thì phiên bị thu hồi, quay về đăng nhập. */
export function ChangePasswordScreen() {
  const router = useRouter();
  const change = useChangePassword();
  const form = useZodForm(changePasswordSchema, {
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  });

  const submit = form.handleSubmit((values) =>
    change.mutate(values, {
      onSuccess: () => toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'),
      onError: (error) =>
        applyFieldErrors(error, form.setError, {
          '3009': ['old_password', 'Mật khẩu hiện tại không đúng'],
        }),
    }),
  );

  return (
    <Screen
      header={<AppHeader title="Đổi mật khẩu" onBack={() => router.canGoBack() ? router.back() : router.replace('/')} />}
      footer={<Button title="Cập nhật mật khẩu" fullWidth loading={change.isPending} onPress={() => submit()} />}>
      <Card className="flex-row gap-3 border-info-soft bg-info-soft">
        <Icon as={Info} size={20} color="info" />
        <Text variant="caption" className="flex-1 text-info-strong">
          Bạn sẽ đăng nhập lại bằng mật khẩu mới.
        </Text>
      </Card>
      <View className="mt-5 gap-3 roomy:gap-[18px]">
        <FormField
          control={form.control}
          name="old_password"
          render={(field) => <PasswordField label="Mật khẩu hiện tại" leftIcon={Lock} autoComplete="current-password" {...field} />}
        />
        <FormField
          control={form.control}
          name="new_password"
          render={(field) => (
            <PasswordField label="Mật khẩu mới" leftIcon={Lock} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={(field) => (
            <PasswordField label="Nhập lại mật khẩu mới" leftIcon={Lock} autoComplete="new-password" {...field} />
          )}
        />
      </View>
    </Screen>
  );
}
