import { useRouter } from 'expo-router';
import { Lock, UserRound } from 'lucide-react-native';
import { View } from 'react-native';

import { applyFieldErrors } from '@/core/api';
import { GENDER_OPTIONS } from '@/shared/constants';
import { FormField, PasswordField, PhoneField, RadioGroup, SwitchField, TextField, useZodForm } from '@/shared/form';
import { AppHeader, Button, Screen, toast } from '@/shared/ui';

import { RoleSelect } from '../components/RoleSelect';
import { useCreateUser } from '../hooks/useUsers';
import { createUserSchema } from '../schemas';

/** admin01 — Thêm người dùng và gán vai trò trực tiếp. */
export function UserCreateScreen() {
  const router = useRouter();
  const create = useCreateUser();
  const form = useZodForm(createUserSchema, {
    defaultValues: { full_name: '', phone: '', password: '', gender: null, role_id: null, is_active: true },
  });
  const { control } = form;

  const submit = form.handleSubmit(({ gender, is_active, ...values }) =>
    create.mutate(
      { ...values, gender: gender ?? undefined, is_active: is_active ? 1 : 0 },
      {
        onSuccess: (user) => {
          toast.success('Đã thêm người dùng.');
          router.replace(`/admin/users/${user.user_id}`);
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
    <Screen
      header={<AppHeader title="Thêm người dùng" onBack={router.back} />}
      footer={<Button title="Tạo tài khoản" fullWidth loading={create.isPending} onPress={() => submit()} />}>
      <View className="gap-[18px] pb-4">
        <FormField
          control={control}
          name="full_name"
          render={(field) => <TextField label="Họ và tên" required leftIcon={UserRound} autoCapitalize="words" {...field} />}
        />
        <FormField control={control} name="phone" render={(field) => <PhoneField label="Số điện thoại" required hint="Dùng để đăng nhập" {...field} />} />
        <FormField
          control={control}
          name="password"
          render={(field) => <PasswordField label="Mật khẩu khởi tạo" required leftIcon={Lock} placeholder="Tối thiểu 6 ký tự" {...field} />}
        />
        <FormField
          control={control}
          name="gender"
          render={({ value, onChange, error }) => (
            <RadioGroup label="Giới tính" direction="row" options={GENDER_OPTIONS} value={value} onChange={onChange} error={error} />
          )}
        />
        <FormField
          control={control}
          name="role_id"
          render={({ value, onChange, error }) => (
            <RoleSelect value={value} onChange={onChange} error={error} hint="Nhân viên y tế nên tạo bằng “Thêm nhân viên” để gán luôn nơi công tác" />
          )}
        />
        <FormField
          control={control}
          name="is_active"
          render={({ value, onChange }) => (
            <SwitchField label="Kích hoạt tài khoản" description="Tắt nếu chưa muốn cho đăng nhập ngay" value={value} onChange={onChange} />
          )}
        />
      </View>
    </Screen>
  );
}
