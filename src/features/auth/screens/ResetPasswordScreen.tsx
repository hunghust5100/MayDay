import { useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { FormField, OtpInput, PasswordField, useZodForm } from '@/shared/form';
import { Button, Text, toast } from '@/shared/ui';
import { formatPhone } from '@/shared/utils';

import { AuthScaffold } from '../components/AuthScaffold';
import { TextLink } from '../components/TextLink';
import { useForgotPassword, useResetPassword } from '../hooks/useAuthMutations';
import { useBackToLogin } from '../hooks/useBackToLogin';
import { resetPasswordSchema } from '../schemas';

const RESEND_SECONDS = 60;

/** auth05 — nhập OTP + mật khẩu mới. */
export function ResetPasswordScreen() {
  const backToLogin = useBackToLogin();
  const { phone = '' } = useLocalSearchParams<{ phone?: string }>();
  const reset = useResetPassword();
  const resend = useForgotPassword();
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const form = useZodForm(resetPasswordSchema, {
    defaultValues: { otp: '', new_password: '', confirm_password: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resendOtp = () =>
    resend.mutate(phone, {
      onSuccess: () => {
        setCooldown(RESEND_SECONDS);
        form.resetField('otp');
        toast.success('Đã gửi lại mã OTP.');
      },
      onError: (error) => applyFieldErrors(error, form.setError, {}),
    });

  const submit = form.handleSubmit((values) =>
    reset.mutate(
      { phone, ...values },
      {
        onSuccess: () => {
          toast.success('Đặt lại mật khẩu thành công. Mời bạn đăng nhập.');
          backToLogin(phone);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, {
            '3004': ['otp', 'Mã OTP không đúng'],
            '3005': ['otp', 'Mã OTP đã hết hạn, vui lòng gửi lại mã'],
          }),
      },
    ),
  );

  return (
    <AuthScaffold
      title="Đặt lại mật khẩu"
      subtitle={`Nhập mã OTP gồm 6 chữ số vừa được gửi tới ${formatPhone(phone)}.`}
      onBack={() => backToLogin()}
      footer={<TextLink label="Quay lại đăng nhập" onPress={() => backToLogin()} />}>
      <View className="gap-[18px]">
        <FormField
          control={form.control}
          name="otp"
          render={(field) => <OtpInput label="Mã OTP" autoFocus {...field} />}
        />
        <View className="-mt-2 flex-row items-center justify-end">
          {cooldown > 0 ? (
            <Text variant="caption" tone="muted">
              Gửi lại mã sau {cooldown}s
            </Text>
          ) : (
            <TextLink label={resend.isPending ? 'Đang gửi…' : 'Gửi lại mã'} onPress={resendOtp} />
          )}
        </View>
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
            <PasswordField label="Nhập lại mật khẩu mới" leftIcon={Lock} placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" {...field} />
          )}
        />
        <Button title="Đặt lại mật khẩu" fullWidth loading={reset.isPending} onPress={() => submit()} />
      </View>
    </AuthScaffold>
  );
}
