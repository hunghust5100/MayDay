import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { useSession } from '@/core/auth';
import { GENDER_OPTIONS } from '@/shared/constants';
import { FormField, RadioGroup, SwitchField, TextField, useZodForm } from '@/shared/form';
import { AppHeader, Button, ErrorState, Screen, Spinner, toast } from '@/shared/ui';

import { RoleSelect } from '../components/RoleSelect';
import { useEditUser, useUser } from '../hooks/useUsers';
import { editUserSchema } from '../schemas';
import type { UserDetail } from '../types';

function EditForm({ user, isSelf }: { user: UserDetail; isSelf: boolean }) {
  const router = useRouter();
  const edit = useEditUser(user.user_id);
  const form = useZodForm(editUserSchema, {
    defaultValues: { full_name: user.full_name, gender: user.gender, role_id: user.role_id, is_active: user.is_active === 1 },
  });
  const { control } = form;

  const submit = form.handleSubmit(({ is_active, ...values }) =>
    edit.mutate(
      // Admin không được tự hạ quyền / tự khóa (API trả 3101) → không gửi 2 trường này cho chính mình.
      isSelf ? { full_name: values.full_name, gender: values.gender } : { ...values, is_active: is_active ? 1 : 0 },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật người dùng.');
          router.back();
        },
      },
    ),
  );

  return (
    <Screen
      header={<AppHeader title="Sửa người dùng" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/users')} />}
      footer={<Button title="Lưu thay đổi" fullWidth loading={edit.isPending} onPress={() => submit()} />}>
      <View className="gap-[18px] pb-4">
        <FormField
          control={control}
          name="full_name"
          render={(field) => <TextField label="Họ và tên" required leftIcon={UserRound} autoCapitalize="words" {...field} />}
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
            <RoleSelect
              value={value}
              onChange={onChange}
              error={error}
              disabled={isSelf}
              hint={isSelf ? 'Không thể tự đổi vai trò của chính mình' : 'Có hiệu lực từ lần thao tác kế tiếp của người dùng'}
            />
          )}
        />
        <FormField
          control={control}
          name="is_active"
          render={({ value, onChange }) => (
            <SwitchField
              label="Cho phép đăng nhập"
              description={isSelf ? 'Không thể tự khóa tài khoản của chính mình' : 'Tắt để khóa tài khoản'}
              disabled={isSelf}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </View>
    </Screen>
  );
}

/** admin04 — Sửa họ tên, giới tính, vai trò, trạng thái. */
export function UserEditScreen() {
  const router = useRouter();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const auth = useSession();
  const { data: user, isLoading, error, refetch } = useUser(id);
  if (user) return <EditForm user={user} isSelf={auth.status === 'signedIn' && auth.user.user_id === id} />;
  return (
    <Screen header={<AppHeader title="Sửa người dùng" onBack={() => router.canGoBack() ? router.back() : router.replace('/admin/users')} />}>
      {isLoading ? <Spinner fill /> : <ErrorState fill description={getErrorMessage(error)} onRetry={() => refetch()} />}
    </Screen>
  );
}
