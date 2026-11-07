import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { Checkbox, FormField, PasswordField, PhoneField, useZodForm } from '@/shared/form';
import { Button, Divider, Text } from '@/shared/ui';

import { AuthScaffold } from '../components/AuthScaffold';
import { useLogin } from '../hooks/useAuthMutations';
import { loginSchema } from '../schemas';

export function LoginScreen() {
  const router = useRouter();
  // Quay về từ đăng ký / đặt lại mật khẩu: điền sẵn SĐT.
  const { phone: presetPhone } = useLocalSearchParams<{ phone?: string }>();
  const login = useLogin();
  const form = useZodForm(loginSchema, {
    defaultValues: { phone: presetPhone ?? '', password: '', remember: true },
  });

  useEffect(() => {
    if (presetPhone) form.reset({ phone: presetPhone, password: '', remember: form.getValues('remember') });
  }, [presetPhone, form]);

  const submit = form.handleSubmit((values) =>
    login.mutate(values, {
      onError: (error) =>
        applyFieldErrors(error, form.setError, {
          '2004': ['phone', 'Số điện thoại không hợp lệ'],
          '3007': ['phone', 'Số điện thoại chưa được đăng ký'],
          '3008': ['password', 'Mật khẩu không đúng'],
          '3101': ['phone', 'Tài khoản đã bị khóa. Vui lòng liên hệ cơ sở khám.'],
        }),
    }),
  );

  return (
    <AuthScaffold
      title="Chào mừng trở lại"
      subtitle="Theo dõi mề đay mỗi ngày, an tâm hơn mỗi ngày."
      footer={
        <>
          <Divider label="Chưa có tài khoản?" className="mb-4" />
          <Button title="Đăng ký tài khoản bệnh nhân" variant="outline" fullWidth onPress={() => router.push('/signup')} />
        </>
      }>
      <View className="gap-[18px]">
        <FormField
          control={form.control}
          name="phone"
          render={(field) => <PhoneField label="Số điện thoại" returnKeyType="next" {...field} />}
        />
        <FormField
          control={form.control}
          name="password"
          render={(field) => (
            <PasswordField
              label="Mật khẩu"
              leftIcon={Lock}
              placeholder="Nhập mật khẩu"
              returnKeyType="go"
              onSubmitEditing={() => submit()}
              {...field}
            />
          )}
        />
        <View className="flex-row items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ value, onChange }) => <Checkbox label="Ghi nhớ đăng nhập" checked={value} onChange={onChange} />}
          />
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/forgot-password', params: { phone: form.getValues('phone') } })}>
            <Text variant="caption" weight="semibold" tone="primary">
              Quên mật khẩu?
            </Text>
          </Pressable>
        </View>
        <Button title="Đăng nhập" fullWidth loading={login.isPending} onPress={() => submit()} />
      </View>
    </AuthScaffold>
  );
}
