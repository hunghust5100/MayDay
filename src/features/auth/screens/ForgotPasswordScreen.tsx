import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { FormField, PhoneField, useZodForm } from '@/shared/form';
import { Button } from '@/shared/ui';
import { isValidPhone } from '@/shared/utils';

import { AuthScaffold } from '../components/AuthScaffold';
import { TextLink } from '../components/TextLink';
import { useForgotPassword } from '../hooks/useAuthMutations';
import { useBackToLogin } from '../hooks/useBackToLogin';
import { forgotPasswordSchema } from '../schemas';

/** auth04 — nhập SĐT để nhận OTP, rồi sang màn đặt lại mật khẩu. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const backToLogin = useBackToLogin();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const forgot = useForgotPassword();
  const form = useZodForm(forgotPasswordSchema, {
    defaultValues: { phone: phone && isValidPhone(phone) ? phone : '' },
  });

  const submit = form.handleSubmit((values) =>
    forgot.mutate(values.phone, {
      onSuccess: () => router.push({ pathname: '/reset-password', params: { phone: values.phone } }),
      onError: (error) =>
        applyFieldErrors(error, form.setError, {
          '2004': ['phone', 'Số điện thoại không hợp lệ'],
          '3007': ['phone', 'Số điện thoại chưa được đăng ký'],
        }),
    }),
  );

  return (
    <AuthScaffold
      title="Quên mật khẩu"
      subtitle="Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã OTP qua tin nhắn SMS."
      onBack={() => backToLogin()}
      footer={<TextLink prompt="Nhớ ra mật khẩu?" label="Đăng nhập" onPress={() => backToLogin()} />}>
      <View className="gap-[18px]">
        <FormField
          control={form.control}
          name="phone"
          render={(field) => (
            <PhoneField label="Số điện thoại" returnKeyType="send" onSubmitEditing={() => submit()} {...field} />
          )}
        />
        <Button title="Gửi mã OTP" fullWidth loading={forgot.isPending} onPress={() => submit()} />
      </View>
    </AuthScaffold>
  );
}
