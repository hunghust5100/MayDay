import { Lock, UserRound } from 'lucide-react-native';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import {
  FormField,
  NumberField,
  PasswordField,
  PhoneField,
  RadioGroup,
  TextField,
  useZodForm,
} from '@/shared/form';
import { GENDER_OPTIONS } from '@/shared/constants';
import { Button, toast } from '@/shared/ui';

import { AuthScaffold } from '../components/AuthScaffold';
import { TextLink } from '../components/TextLink';
import { useSignup } from '../hooks/useAuthMutations';
import { useBackToLogin } from '../hooks/useBackToLogin';
import { signupSchema } from '../schemas';

export function SignupScreen() {
  const backToLogin = useBackToLogin();
  const signup = useSignup();
  const form = useZodForm(signupSchema, {
    defaultValues: { full_name: '', phone: '', password: '', confirm_password: '', gender: null, year_of_birth: null },
  });

  const submit = form.handleSubmit(({ confirm_password: _, gender, year_of_birth, ...values }) =>
    signup.mutate(
      { ...values, gender: gender ?? undefined, year_of_birth: year_of_birth ?? undefined },
      {
        onSuccess: (user) => {
          toast.success('Đăng ký thành công. Mời bạn đăng nhập.');
          backToLogin(user.phone);
        },
        onError: (error) =>
          applyFieldErrors(error, form.setError, {
            '2004': ['phone', 'Số điện thoại không hợp lệ'],
            '3006': ['phone', 'Số điện thoại đã được đăng ký'],
          }),
      },
    ),
  );

  return (
    <AuthScaffold
      title="Tạo tài khoản"
      onBack={() => backToLogin()}
      footer={<TextLink prompt="Đã có tài khoản?" label="Đăng nhập" onPress={() => backToLogin()} />}>
      <View className="gap-3 roomy:gap-[18px]">
        <FormField
          control={form.control}
          name="full_name"
          render={(field) => (
            <TextField
              label="Họ và tên"
              required
              leftIcon={UserRound}
              placeholder="VD: Nguyễn Văn A"
              autoCapitalize="words"
              autoComplete="name"
              {...field}
            />
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={(field) => <PhoneField label="Số điện thoại" required hint="Dùng để đăng nhập" {...field} />}
        />
        <FormField
          control={form.control}
          name="password"
          render={(field) => (
            <PasswordField label="Mật khẩu" required leftIcon={Lock} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={(field) => (
            <PasswordField label="Nhập lại mật khẩu" required leftIcon={Lock} autoComplete="new-password" {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ value, onChange, error }) => (
            <RadioGroup label="Giới tính" direction="row" options={GENDER_OPTIONS} value={value} onChange={onChange} error={error} />
          )}
        />
        <FormField
          control={form.control}
          name="year_of_birth"
          render={(field) => <NumberField label="Năm sinh" placeholder="VD: 1990" maxLength={4} {...field} />}
        />
        <Button title="Đăng ký" fullWidth loading={signup.isPending} onPress={() => submit()} className="mt-1" />
      </View>
    </AuthScaffold>
  );
}
